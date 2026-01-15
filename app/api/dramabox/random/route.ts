import { NextResponse } from "next/server";

const UPSTREAM = "https://dramabox.sansekai.my.id/api/dramabox/randomdrama";

// cache in-memory (dev-friendly)
let cachedAt = 0;
let cachedData: any = null;

// simple rate limit per IP (dev-friendly)
const ipHits = new Map<string, number[]>();
const WINDOW_MS = 10_000; // 10s
const MAX_HITS = 5;       // max 5 req / 10s per IP

function getIP(req: Request) {
  // on some platforms, this header exists
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function normalize(item: any) {
  // ambil 720p default kalo ada
  const cdn720 =
    item?.cdnList?.find((c: any) => c?.isDefault === 1)?.videoPathList?.find((v: any) => v?.quality === 720)?.videoPath
    || item?.cdnList?.[0]?.videoPathList?.find((v: any) => v?.quality === 720)?.videoPath;

  return {
    id: item?.chapterId || item?.bookId,
    title: item?.bookName,
    intro: item?.introduction,
    tags: item?.tags || [],
    cover: item?.bookCover,
    poster: item?.chapterImg,
    video: cdn720 || item?.videoPath, // fallback ke videoPath
    meta: {
      bookId: item?.bookId,
      chapterId: item?.chapterId,
      playCount: item?.playCount,
      totalChapterNum: item?.totalChapterNum,
      nextChapterId: item?.nextChapterId,
    },
  };
}

export async function GET(req: Request) {
  const ip = getIP(req);

  // rate limit
  const now = Date.now();
  const arr = ipHits.get(ip) || [];
  const fresh = arr.filter((t) => now - t < WINDOW_MS);
  if (fresh.length >= MAX_HITS) {
    return NextResponse.json(
      { ok: false, status: 429, message: "Too many requests (cooldown dulu ya 😭)" },
      { status: 429 }
    );
  }
  fresh.push(now);
  ipHits.set(ip, fresh);

  // cache 15 detik
  if (cachedData && now - cachedAt < 15_000) {
    return NextResponse.json({ ok: true, data: cachedData, cached: true });
  }

  const res = await fetch(UPSTREAM, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { ok: false, status: res.status, message: text },
      { status: 502 }
    );
  }

  const raw = await res.json(); // ini array
  const list = Array.isArray(raw) ? raw : raw?.data ?? [];
  const normalized = list.map(normalize);

  cachedAt = now;
  cachedData = normalized;

  return NextResponse.json({ ok: true, data: normalized, cached: false });
}

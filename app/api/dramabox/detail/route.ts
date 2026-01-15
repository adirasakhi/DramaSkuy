import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bookId = url.searchParams.get("bookId"); // ✅ camelCase

  if (!bookId) {
    return NextResponse.json({ ok: false, message: "bookId required" }, { status: 400 });
  }

  const upstream = `https://dramabox.sansekai.my.id/api/dramabox/detail?bookId=${encodeURIComponent(bookId)}`;

  const res = await fetch(upstream, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0",
      "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
    },
    cache: "no-store",
  });

  const text = await res.text();

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, status: res.status, upstream, message: text.slice(0, 500) },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, data: JSON.parse(text) });
}


import { NextResponse } from "next/server";

const UPSTREAM = "https://dramabox.sansekai.my.id/api/dramabox/foryou";

export async function GET(request: Request) {
  try {
    // 1. Ambil parameter page dari URL (misal: ?page=2)
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") || "1";
    const pageSize = searchParams.get("pageSize") || "10";

    // 2. Susun URL ke API asli dengan parameter halaman
    // Note: Kalau API aslinya random, parameter ini mungkin gak ngaruh, 
    // tapi kalau dia support pagination, ini kuncinya.
    const targetUrl = `${UPSTREAM}?pageNo=${page}&pageSize=${pageSize}`;

    const res = await fetch(targetUrl, {
      headers: { 
        "Accept": "application/json", 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" 
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      throw new Error(`Upstream error: ${res.status}`);
    }

    const json = await res.json();
    const cleanList = Array.isArray(json) ? json : (json.data || []);

    return NextResponse.json({ 
      ok: true, 
      data: cleanList, 
      page: Number(page) 
    });

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { ok: false, data: [] },
      { status: 500 }
    );
  }
}

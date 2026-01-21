import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || searchParams.get("query");

    if (!keyword) {
      return NextResponse.json({ ok: false, data: [] });
    }

    const targetUrl = `https://dramabox.sansekai.my.id/api/dramabox/search?query=${encodeURIComponent(keyword)}`;
    console.log(`📡 Nembak Upstream: ${targetUrl}`);

    const res = await fetch(targetUrl, {
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" 
      },
      next: { revalidate: 60 } 
    });

    if (!res.ok) {
      return NextResponse.json({ ok: true, data: [] });
    }

    const data = await res.json();
    
    // 🔥 FIX LOGIC LOGGING & FORMAT RESPONSE
    // Cek apakah data itu Array langsung ATAU Object { data: [] }
    let items = [];
    if (Array.isArray(data)) {
      items = data; // Kalau formatnya [...]
    } else if (Array.isArray(data?.data)) {
      items = data.data; // Kalau formatnya { data: [...] }
    }

    console.log(`✅ Success! Dapet ${items.length} item (Format: ${Array.isArray(data) ? "Raw Array" : "Object"})`);

    // Kita balikin standar biar frontend enak bacanya: Selalu bungkus pake { data: ... }
    return NextResponse.json({ data: items });

  } catch (error) {
    console.error("Search API Error:", error);
    return NextResponse.json({ data: [] }, { status: 500 });
  }
}

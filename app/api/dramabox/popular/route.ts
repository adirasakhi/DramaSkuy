import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 1. Tembak API Asli (Real-Time Data)
    const res = await fetch("https://dramabox.sansekai.my.id/api/dramabox/populersearch", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      // 🔥 CACHE 1 JAM (3600 Detik)
      // Data populer search akan update otomatis setiap 1 jam. Aman buat IP lo.
      next: { revalidate: 3600 } 
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, data: [] });
    }

    const rawData = await res.json();

    // 2. Olah Data (Parsing)
    // API kadang balikin Array langsung, kadang Object. Kita antisipasi dua-duanya.
    let items: any[] = [];
    if (Array.isArray(rawData)) {
      items = rawData;
    } else if (rawData && Array.isArray(rawData.data)) {
      items = rawData.data;
    }

    // 3. Ekstrak Keyword (Judul & Tags)
    const titles = items.map((item: any) => item.bookName).filter(Boolean); // Ambil Judul
    
    // Ambil tags, gabungin semua jadi satu list panjang, terus ambil yang unik
    const allTags = items.flatMap((item: any) => item.tags || []);
    // Set() otomatis buang duplikat, Array.from balikin jadi array lagi
    const uniqueTags = Array.from(new Set(allTags)).slice(0, 10); // Ambil top 10 tags unik

    // Gabungin: Judul di atas, Tag di bawah
    const keywords = [...titles, ...uniqueTags];

    // 4. Balikin ke Frontend
    return NextResponse.json({
      ok: true,
      data: keywords
    });

  } catch (error) {
    console.error("Popular API Error:", error);
    // Kalau error, balikin array kosong biar UI gak crash
    return NextResponse.json({ ok: false, data: [] }, { status: 500 });
  }
}

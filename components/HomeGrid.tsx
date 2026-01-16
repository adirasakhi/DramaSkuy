"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLibrary } from "@/hooks/useLibrary"; // 1. Import Hook Library

// --- 1. Definisi Tipe Data ---
interface DramaItem {
  bookId: string | number;
  bookName: string;
  coverWap?: string;
  bookCover?: string;
  tags?: string[];
  chapterCount?: number | string;
  introduction?: string;
}

export default function HomeGrid() {
  const [items, setItems] = useState<DramaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");

  // --- FUNCTION FETCH DATA ---
  const fetchDrama = async (targetPage: number) => {
    try {
      const res = await fetch(`/api/dramabox/foryou?page=${targetPage}`, { 
        cache: "no-store" 
      });
      const json = await res.json();
      const newData = Array.isArray(json?.data) ? json.data : [];
      return newData as DramaItem[];
    } catch (error) {
      console.error("Gagal ambil data:", error);
      return [];
    }
  };

  // Initial Load
  useEffect(() => {
    (async () => {
      setLoading(true);
      const initialData = await fetchDrama(1);
      setItems(initialData);
      setLoading(false);
    })();
  }, []);

  // Handle Load More
  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    const moreData = await fetchDrama(nextPage);

    if (moreData.length > 0) {
      setItems((prevItems) => {
        // Anti Duplikat
        const existingIds = new Set(prevItems.map((i) => String(i.bookId)));
        const uniqueNewItems = moreData.filter((i) => !existingIds.has(String(i.bookId)));
        return [...prevItems, ...uniqueNewItems];
      });
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  // Filter & Validasi
  const filtered = useMemo(() => {
    const validItems = items.filter((it) => it && it.bookId && it.bookName);
    const q = query.trim().toLowerCase();
    if (!q) return validItems;
    return validItems.filter((it) => it.bookName.toLowerCase().includes(q));
  }, [items, query]);

  // Hero Item
  const heroItem = filtered.length > 0 ? filtered[0] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500/30">
      
      {/* --- TOPBAR --- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/30">
  <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center">
    
    {/* 1. LOGO AREA */}
    <div className="flex items-center justify-between gap-3">
      <Link href="/" className="font-bold text-xl tracking-tight flex items-center gap-2 group">
        <span className="text-red-600 text-2xl group-hover:scale-110 transition">▶</span>
        DramaBox <span className="text-white/40 text-xs font-normal border border-white/10 px-1.5 py-0.5 rounded">CLONE</span>
      </Link>

      {/* Mobile Counter (Opsional) */}
      <div className="sm:hidden text-xs text-white/50 font-medium">
        {loading ? "..." : `${filtered.length} Judul`}
      </div>
    </div>

    {/* 2. SEARCH BAR + TOMBOL LIBRARY (Update di sini) */}
    <div className="sm:ml-auto w-full sm:max-w-xl flex items-center gap-3">
      
      {/* Search Bar */}
      <div className="flex-1 group flex items-center gap-3 rounded-full bg-white/[0.05] border border-white/5 px-4 py-2.5 focus-within:border-white/20 focus-within:bg-white/[0.08] transition-all duration-300">
        <span className="text-white/40 group-focus-within:text-white/80 transition">🔎</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul drama..."
          className="w-full bg-transparent outline-none text-sm placeholder:text-white/30 text-white"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-white/40 hover:text-white transition">✕</button>
        )}
      </div>

      {/* TOMBOL PUSTAKA SAYA (BARU) */}
      <Link 
        href="/library"
        className="flex-shrink-0 w-11 h-11 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 flex items-center justify-center transition group relative"
        title="Pustaka Saya"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70 group-hover:text-white transition"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        
        {/* Opsional: Dot Merah kalau ada isinya (Logic simpel aja) */}
        {/* <div className="absolute top-2.5 right-3 w-2 h-2 bg-red-500 rounded-full border border-black" /> */}
      </Link>

    </div>
  </div>
</header>

      {/* --- CONTENT --- */}
      <main className="pb-20">
        {loading ? (
          <div className="mx-auto max-w-7xl px-4 py-6">
            <SkeletonGrid />
          </div>
        ) : (
          <>
            {/* HERO BANNER (Update: Pass Item ke Component yang udah di-upgrade) */}
            {!query && heroItem && <HeroBanner item={heroItem} />}

            <div className="mx-auto max-w-7xl px-4 py-8">
              <div className="mb-6 flex items-end justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white/90">
                  {query ? `Hasil: "${query}"` : "Trending Sekarang 🔥"}
                </h2>
                <span className="hidden sm:block text-xs text-white/40 mb-1">
                  Total {filtered.length} Drama
                </span>
              </div>

              {/* Grid List */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                {filtered.map((it) => (
                  <DramaCard key={String(it.bookId)} it={it} />
                ))}
              </div>

              {/* Load More Button */}
              {!query && filtered.length > 0 && (
                <div className="mt-12 text-center">
                  <button 
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="group relative px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white/80 font-medium hover:bg-white/10 hover:text-white hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-95"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Mengambil drama...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Muat Lebih Banyak <span className="group-hover:translate-y-0.5 transition-transform">👇</span>
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!filtered.length && (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="text-4xl mb-4">🤔</div>
                  <p className="text-white/60">Ga nemu drama dengan kata kunci "{query}"</p>
                  <button onClick={() => setQuery("")} className="mt-4 text-sm text-red-500 underline">Hapus pencarian</button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// --- COMPONENT: HERO BANNER (UPDATED WITH MY LIST) ---
function HeroBanner({ item }: { item: DramaItem }) {
  // 2. Pake Hook Library di sini
  const { toggleMyList, isInList } = useLibrary();
  
  if (!item || !item.bookName) return null;
  
  const bgImage = item.coverWap || item.bookCover || "";
  const isSaved = isInList(String(item.bookId)); // Cek status saved

  const handleToggle = () => {
    toggleMyList({
      bookId: String(item.bookId),
      bookName: item.bookName,
      cover: bgImage,
      timestamp: Date.now()
    });
  };

  return (
    <div className="relative w-full h-[55vh] sm:h-[65vh] overflow-hidden group">
      <div className="absolute inset-0">
         <img 
          src={bgImage} 
          className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition duration-[2s] ease-out"
          alt="Hero"
          onError={(e) => { e.currentTarget.src = "https://placehold.co/1920x1080/1a1a1a/FFF?text=No+Image"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 p-6 sm:p-12 max-w-3xl z-10 flex flex-col gap-4">
        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded w-fit uppercase tracking-wider">Top Pick #1</span>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-2xl line-clamp-2">{item.bookName}</h1>
        <p className="text-white/70 text-sm sm:text-base line-clamp-2 max-w-xl font-medium">{item.introduction || "Drama pilihan terbaik minggu ini. Nonton sekarang full episode sub indo."}</p>
        
        <div className="flex gap-3 mt-2">
          <Link href={`/watch/${item.bookId}`} className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition active:scale-95">
            ▶ Putar Sekarang
          </Link>
          
          {/* 3. Tombol My List Interaktif */}
          <button 
            onClick={handleToggle}
            className={`
              px-5 py-3 rounded-full font-semibold backdrop-blur-sm transition flex items-center gap-2 border
              ${isSaved 
                ? "bg-red-600/80 border-red-500 text-white hover:bg-red-600" 
                : "bg-white/10 border-white/20 text-white hover:bg-white/20"}
            `}
          >
            {isSaved ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Tersimpan
              </>
            ) : (
              <>
                <span>+</span> My List
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- COMPONENT: DRAMA CARD ---
function DramaCard({ it }: { it: DramaItem }) {
  if (!it || !it.bookId || !it.bookName) return null;
  const [imgSrc, setImgSrc] = useState(it.coverWap || it.bookCover || "");
  const tags = (it.tags || []).slice(0, 2);
  const eps = it.chapterCount ?? "?";

  useEffect(() => { setImgSrc(it.coverWap || it.bookCover || ""); }, [it]);

  return (
    <Link href={`/watch/${it.bookId}`} className="group block outline-none">
      <article className="relative w-full">
        <div className="relative aspect-[3/4.2] rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 group-hover:border-red-500/50 group-hover:shadow-[0_0_25px_-5px_rgba(220,38,38,0.4)] transition-all duration-300 ease-out">
          <img
            src={imgSrc}
            alt={it.bookName}
            loading="lazy"
            onError={() => setImgSrc("https://placehold.co/400x600/1a1a1a/FFF?text=No+Image")}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500 ease-in-out"
          />
          <div className="absolute top-2 right-2 z-20">
             <div className="bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 rounded text-[10px] font-medium text-white/90 shadow-sm">{eps} Eps</div>
          </div>
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg scale-50 opacity-0 translate-y-4 group-hover:scale-100 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
               <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
        </div>
        <div className="mt-3 px-1">
          <h3 className="text-sm font-bold text-white/90 leading-tight line-clamp-2 group-hover:text-red-500 transition-colors">{it.bookName}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {tags.length > 0 ? tags.map((t) => (
              <span key={t} className="text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded">{t}</span>
            )) : <span className="text-[10px] text-white/30 italic">Drama</span>}
          </div>
        </div>
      </article>
    </Link>
  );
}

// --- COMPONENT: LOADING SKELETON ---
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 mt-10">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4.2] rounded-xl bg-white/5 animate-pulse border border-white/5" />
          <div className="space-y-1.5 px-1">
             <div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" />
             <div className="h-3 w-1/2 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

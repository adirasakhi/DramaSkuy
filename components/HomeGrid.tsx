"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useMemo } from "react";
import { useLibrary } from "@/hooks/useLibrary";

// --- TIPE DATA ---
interface DramaItem {
  bookId: string | number;
  bookName: string;
  cover?: string;        // <--- TAMBAH INI (Sering dipake di Search)
  coverWap?: string;
  bookCover?: string;
  tags?: string[];
  chapterCount?: number | string;
  introduction?: string;
}

export default function HomeGrid() {
  // --- STATE DATA ---
  const [items, setItems] = useState<DramaItem[]>([]); // Data Trending
  const [searchResults, setSearchResults] = useState<DramaItem[]>([]); // Data Search
  const [popularTags, setPopularTags] = useState<string[]>([]); // Keyword Populer

  // --- STATE UI ---
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Mode Search
  const [isSearching, setIsSearching] = useState(false); 
  const [showPopular, setShowPopular] = useState(false);
  const [query, setQuery] = useState("");
  
  const [page, setPage] = useState(1);

  // Refs
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- 1. FETCH TRENDING (DEFAULT) ---
  const fetchTrending = async (targetPage: number) => {
    try {
      const res = await fetch(`/api/dramabox/foryou?page=${targetPage}`, { cache: "no-store" });
      const json = await res.json();
      return (Array.isArray(json?.data) ? json.data : []) as DramaItem[];
    } catch (e) { return []; }
  };

  // --- 2. FETCH POPULAR KEYWORDS ---
  const fetchPopular = async () => {
    try {
      const res = await fetch("/api/dramabox/popular");
      const json = await res.json();
      // Asumsi response { data: ["CEO", "Selingkuh"] }
      if (json && Array.isArray(json.data)) {
         setPopularTags(json.data.slice(0, 8)); // Ambil 8 aja biar rapi
      }
    } catch (e) { console.error("Gagal load popular", e); }
  };

  // --- 3. EXECUTE SEARCH ---
  const handleSearch = async (keyword: string) => {
    if (!keyword.trim()) {
      setIsSearching(false);
      return;
    }

    setLoading(true);
    setIsSearching(true);
    setShowPopular(false); 
    setQuery(keyword); 

    try {
      const res = await fetch(`/api/dramabox/search?query=${encodeURIComponent(keyword)}`); // Pastikan ?query= atau ?keyword= sesuai route
      const json = await res.json();
      
      // 🔥 FIX PARSING DATA (Bisa baca Array Langsung / Object.data)
      let results: DramaItem[] = [];
      
      if (Array.isArray(json)) {
        results = json; // Kalau backend balikin [...]
      } else if (json && Array.isArray(json.data)) {
        results = json.data; // Kalau backend balikin { data: [...] }
      }

      console.log("Search Results:", results); // Debug di browser console
      setSearchResults(results);
    } catch (e) {
      console.error("Search error", e);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. HANDLE INPUT CHANGE (DEBOUNCE) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    // Kalau kosong, balik ke mode trending
    if (val.trim() === "") {
      setIsSearching(false);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      return;
    }

    // Reset timer lama
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    // Set timer baru (tunggu 800ms baru search)
    searchTimeout.current = setTimeout(() => {
      handleSearch(val);
    }, 800);
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [data, _] = await Promise.all([fetchTrending(1), fetchPopular()]);
      setItems(data);
      setLoading(false);
    })();

    // Tutup dropdown kalau klik di luar
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowPopular(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LOAD MORE (Trending Only) ---
  const handleLoadMore = async () => {
    if (isSearching) return; 
    setLoadingMore(true);
    const nextPage = page + 1;
    const moreData = await fetchTrending(nextPage);

    if (moreData.length > 0) {
      setItems((prev) => {
        const existingIds = new Set(prev.map((i) => String(i.bookId)));
        const unique = moreData.filter((i) => !existingIds.has(String(i.bookId)));
        return [...prev, ...unique];
      });
      setPage(nextPage);
    }
    setLoadingMore(false);
  };

  // TENTUKAN DATA YG DITAMPILKAN
  // Filter lokal tetep jalan buat item trending kalau belum search
  const displayItems = isSearching ? searchResults : items;
  const heroItem = !isSearching && items.length > 0 ? items[0] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-red-500/30">
      
      {/* --- HEADER --- */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          
          <div className="flex items-center justify-between gap-3">
            <Link 
              href="/" 
              onClick={() => { setIsSearching(false); setQuery(""); }} 
              className="font-bold text-xl tracking-tight flex items-center gap-2 group"
            >
              <span className="text-red-600 text-2xl group-hover:scale-110 transition">▶</span>
              Drachin <span className="text-white/40 text-xs font-normal border border-white/10 px-1.5 py-0.5 rounded">ema</span>
            </Link>
          </div>

          {/* SEARCH SECTION */}
          <div className="sm:ml-auto w-full sm:max-w-md relative" ref={searchContainerRef}>
            <div className="group flex items-center gap-3 rounded-full bg-white/[0.05] border border-white/5 px-4 py-2.5 focus-within:border-white/20 focus-within:bg-white/[0.08] transition-all duration-300">
              <span className="text-white/40 group-focus-within:text-white/80 transition">🔎</span>
              <input
                value={query}
                onFocus={() => setShowPopular(true)}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                     if (searchTimeout.current) clearTimeout(searchTimeout.current);
                     handleSearch(query);
                  }
                }}
                placeholder="Cari judul, genre..."
                className="w-full bg-transparent outline-none text-sm placeholder:text-white/30 text-white"
              />
              {query && (
                <button 
                  onClick={() => { setQuery(""); setIsSearching(false); }} 
                  className="text-white/40 hover:text-white transition"
                >✕</button>
              )}
            </div>

            {/* DROPDOWN POPULAR */}
            {showPopular && !isSearching && popularTags.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#121212] border border-white/10 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 mb-3 text-xs font-bold text-white/50 uppercase tracking-wider">
                  <span>🔥 Pencarian Populer</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(tag)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-red-600 hover:text-white border border-white/5 rounded-lg text-xs text-white/80 transition-all active:scale-95"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* LIBRARY BUTTON */}
          <Link href="/library" className="flex-shrink-0 w-11 h-11 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition group" title="Pustaka Saya">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/70 group-hover:text-white"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </Link>
        </div>
      </header>

      {/* --- CONTENT --- */}
      <main className="pb-20">
        {loading ? (
          <div className="mx-auto max-w-7xl px-4 py-6"><SkeletonGrid /></div>
        ) : (
          <>
            {/* HERO (Cuma muncul pas mode Trending) */}
            {!isSearching && heroItem && <HeroBanner item={heroItem} />}

            <div className="mx-auto max-w-7xl px-4 py-8">
              <div className="mb-6 flex items-end justify-between">
                <h2 className="text-xl sm:text-2xl font-bold text-white/90">
                  {isSearching ? `Hasil Pencarian: "${query}"` : "Trending Sekarang 🔥"}
                </h2>
                <span className="hidden sm:block text-xs text-white/40 mb-1">
                  {displayItems.length} Drama Ditemukan
                </span>
              </div>

              {/* GRID */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
                {displayItems.map((it) => (
                  <DramaCard key={String(it.bookId)} it={it} />
                ))}
              </div>

              {/* LOAD MORE (Trending Only) */}
              {!isSearching && displayItems.length > 0 && (
                <div className="mt-12 text-center">
                  <button 
                    onClick={handleLoadMore} 
                    disabled={loadingMore} 
                    className="group relative px-8 py-3 rounded-full bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loadingMore ? "Memuat..." : "Muat Lebih Banyak 👇"}
                  </button>
                </div>
              )}

              {/* EMPTY STATE */}
              {displayItems.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="text-4xl mb-4">🤔</div>
                  <p className="text-white/60">
                    {isSearching ? `Gak nemu drama "${query}"` : "Belum ada data drama."}
                  </p>
                  {isSearching && (
                    <button onClick={() => { setQuery(""); setIsSearching(false); }} className="mt-4 text-sm text-red-500 underline">Kembali ke Trending</button>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

// --- SUB COMPONENTS ---

function HeroBanner({ item }: { item: DramaItem }) {
  const { toggleMyList, isInList } = useLibrary();
  if (!item || !item.bookName) return null;
  
  const bgImage = item.coverWap || item.bookCover || "";
  const isSaved = isInList(String(item.bookId));

  return (
    <div className="relative w-full h-[55vh] sm:h-[65vh] overflow-hidden group">
      <div className="absolute inset-0">
         <img 
          src={bgImage} 
          className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition duration-[2s] ease-out"
          onError={(e) => { e.currentTarget.src = "https://placehold.co/1920x1080/1a1a1a/FFF?text=No+Image"; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 p-6 sm:p-12 max-w-3xl z-10 flex flex-col gap-4">
        <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded w-fit uppercase tracking-wider">Top Pick #1</span>
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight drop-shadow-2xl line-clamp-2">{item.bookName}</h1>
        <p className="text-white/70 text-sm sm:text-base line-clamp-2 max-w-xl font-medium">{item.introduction || "Nonton drama seru full episode sub indo."}</p>
        
        <div className="flex gap-3 mt-2">
          <Link href={`/watch/${item.bookId}`} className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition active:scale-95">
            ▶ Putar Sekarang
          </Link>
          
          <button 
            onClick={() => toggleMyList({
              bookId: String(item.bookId),
              bookName: item.bookName,
              cover: bgImage,
              timestamp: Date.now()
            })}
            className={`px-5 py-3 rounded-full font-semibold border transition flex items-center gap-2 ${isSaved ? "bg-red-600 border-red-500 text-white" : "bg-white/10 border-white/20 text-white hover:bg-white/20"}`}
          >
            {isSaved ? "Tersimpan" : "+ My List"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- UPDATE: DRAMA CARD PINTAR ---
function DramaCard({ it }: { it: DramaItem }) {
  const { history } = useLibrary();
  
  // 1. Gambar
  const rawImg = it.cover || it.coverWap || it.bookCover;
  const validImg = rawImg && rawImg.length > 0 ? rawImg : "https://placehold.co/400x600/1a1a1a/FFF?text=No+Image";
  const [imgSrc, setImgSrc] = useState(validImg);
  
  // 2. Episode (Cek valid gak datanya)
  // Kalau chapterCount ada isinya, simpen. Kalau undefined/0/null, jadiin null.
  const eps = (it.chapterCount && Number(it.chapterCount) > 0) ? it.chapterCount : null;

  // 3. History
  const historyItem = history.find((h) => String(h.bookId) === String(it.bookId));
  const lastEp = historyItem?.lastEpIndex;
  
  const targetLink = lastEp ? `/watch/${it.bookId}?ep=${lastEp}` : `/watch/${it.bookId}`;

  useEffect(() => { 
    const newImg = it.cover || it.coverWap || it.bookCover;
    if (newImg) setImgSrc(newImg);
  }, [it]);

  if (!it || !it.bookId) return null;

  return (
    <Link href={targetLink} className="group block outline-none">
      <article className="relative w-full">
        
        <div className="relative aspect-[3/4.2] rounded-xl overflow-hidden bg-[#1a1a1a] border border-white/5 group-hover:border-red-500/50 transition-all duration-300">
          <img
            src={imgSrc}
            loading="lazy"
            onError={() => setImgSrc("https://placehold.co/400x600/1a1a1a/FFF?text=Image+Error")}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            alt={it.bookName}
          />
          
          {/* --- LOGIC BARU: HANYA MUNCUL KALAU ADA DATA EPS --- */}
          {eps && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-medium text-white/90 shadow-sm border border-white/10">
              {eps} Eps
            </div>
          )}

          {/* Badge History */}
          {lastEp && (
            <div className="absolute bottom-0 left-0 right-0 bg-red-600/90 backdrop-blur-md py-1 px-2 flex items-center justify-center gap-1">
               <svg width="10" height="10" viewBox="0 0 24 24" fill="white" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
               <span className="text-[10px] font-bold text-white uppercase tracking-wide">
                 Eps {lastEp}
               </span>
            </div>
          )}
        </div>

        <div className="mt-3 px-1">
          <h3 className="text-sm font-bold text-white/90 line-clamp-2 group-hover:text-red-500 transition-colors">
            {it.bookName}
          </h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5 opacity-60">
             {lastEp ? (
                <span className="text-[10px] text-red-400 font-medium">▶ Lanjutkan</span>
             ) : (
                // Fallback tag kalau gak ada history
                <span className="text-[10px] text-white/50">
                  {it.tags?.[0] || "Drama"}
                </span>
             )}
          </div>
        </div>

      </article>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8 mt-10">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[3/4.2] rounded-xl bg-white/5 animate-pulse border border-white/5" />
          <div className="space-y-1.5 px-1"><div className="h-4 w-3/4 bg-white/5 rounded animate-pulse" /></div>
        </div>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLibrary } from "@/hooks/useLibrary";

// --- TIPE DATA ---
type EpisodeRaw = any;
type FeedItem = {
  id: string;
  title: string;
  subtitle: string;
  intro?: string;
  poster?: string;
  video?: string;
  epNo: number;
};

// --- HELPER ---
function pick720(ep: EpisodeRaw) {
  const defCdn = ep?.cdnList?.find((c: any) => c?.isDefault === 1) || ep?.cdnList?.[0];
  const v720 =
    defCdn?.videoPathList?.find((v: any) => v?.quality === 720 && v?.isDefault === 1) ||
    defCdn?.videoPathList?.find((v: any) => v?.quality === 720) ||
    defCdn?.videoPathList?.find((v: any) => v?.isDefault === 1) ||
    defCdn?.videoPathList?.[0];
  return v720?.videoPath as string | undefined;
}

// --- COMPONENT UTAMA ---
export default function WatchFeed({ bookId }: { bookId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToHistory, toggleMyList, isInList } = useLibrary();

  const initialEpParam = searchParams.get("ep");
  const initialIndex = initialEpParam ? Math.max(0, parseInt(initialEpParam) - 1) : 0;

  const [detail, setDetail] = useState<any>(null);
  const [episodes, setEpisodes] = useState<EpisodeRaw[]>([]);
  const [limit, setLimit] = useState(Math.max(3, initialIndex + 2)); 
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showEpList, setShowEpList] = useState(false);

  const hasAutoScrolled = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Fetch Data
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const [dRes, eRes] = await Promise.all([
          fetch(`/api/dramabox/detail?bookId=${bookId}`, { cache: "no-store" }),
          fetch(`/api/dramabox/allepisode?bookId=${bookId}`, { cache: "no-store" }),
        ]);

        const dJson = await dRes.json();
        const eJson = await eRes.json();

        const book = dJson?.data?.data?.book || dJson?.data?.book || dJson?.data || null;
        const eps = Array.isArray(eJson?.data) ? eJson.data : (Array.isArray(eJson) ? eJson : []);

        setDetail(book);
        setEpisodes(eps);
      } catch (e: any) {
        setErr("Gagal memuat drama");
      } finally {
        setLoading(false);
      }
    })();
  }, [bookId]);

  // Data Processing
  const indexOffset = useMemo(() => {
    const nums = episodes.map((e) => Number(e?.chapterIndex)).filter(Number.isFinite);
    return (nums.length && Math.min(...nums) === 0) ? 1 : 0;
  }, [episodes]);

  const feed: FeedItem[] = useMemo(() => {
    return episodes.slice(0, limit).map((ep: any) => {
      const rawIdx = Number(ep?.chapterIndex ?? 0);
      const epNo = rawIdx + indexOffset;
      return {
        id: String(ep?.chapterId ?? epNo),
        title: detail?.bookName || "Drama",
        subtitle: `Episode ${epNo}`,
        intro: detail?.introduction,
        poster: ep?.chapterImg,
        video: pick720(ep),
        epNo,
      };
    }).filter((x) => x.video);
  }, [episodes, limit, detail, indexOffset]);

  // Observer & Infinite Scroll
  useEffect(() => {
    const root = containerRef.current;
    if (!root || feed.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best && best.isIntersecting && best.intersectionRatio > 0.5) {
          const idx = Number((best.target as HTMLElement).dataset.index);
          setActiveIndex(idx);

          if (idx >= limit - 2 && limit < episodes.length) {
            setLimit((prev) => Math.min(prev + 5, episodes.length));
          }
        }
      },
      { root, threshold: 0.5 }
    );

    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [feed.length, limit, episodes.length]);

  // Auto Scroll
  useEffect(() => {
    if (!loading && feed.length > 0 && !hasAutoScrolled.current) {
      setTimeout(() => {
        const targetEl = itemRefs.current[initialIndex];
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "auto", block: "start" });
          hasAutoScrolled.current = true;
        }
      }, 100);
    }
  }, [loading, feed.length, initialIndex]);

  // Navigation
  const jumpToEpisode = useCallback((index: number) => {
    if (index >= limit) {
      setLimit(index + 3);
      setTimeout(() => {
        itemRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
        setActiveIndex(index);
      }, 100);
    } else {
      itemRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
      setActiveIndex(index);
    }
    setShowEpList(false);
  }, [limit]);

  const handleNext = () => {
    const next = activeIndex + 1;
    if (next < episodes.length) jumpToEpisode(next);
  };
   
  // History Save
  useEffect(() => {
    if (detail && episodes.length > 0) {
      const currentEp = activeIndex + 1; 
      addToHistory({
        bookId: String(bookId),
        bookName: detail.bookName || "Drama",
        cover: detail.bookCover || detail.coverWap || "",
        lastEpIndex: currentEp,
        timestamp: Date.now(),
      });
    }
  }, [detail, activeIndex, bookId, episodes.length]);

  const isSaved = isInList(String(bookId));
  const currentEpNum = feed[activeIndex]?.epNo || (activeIndex + 1);
  const totalEpNum = episodes.length > 0 ? episodes.length : "-";
  const currentPoster = feed[activeIndex]?.poster || "";

  if (err) return <div className="h-screen flex items-center justify-center text-red-500 bg-[#0a0a0a]">{err}</div>;

  return (
    <div className="relative h-[100svh] bg-[#0a0a0a] text-white overflow-hidden font-sans">
       
      {/* Background Blur */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-out opacity-20 blur-[80px] scale-110"
          style={{ backgroundImage: `url(${currentPoster})` }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center active:scale-90 transition">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-sm truncate text-white drop-shadow-md">{detail?.bookName}</h1>
          <p className="text-[10px] text-white/70">Episode {currentEpNum} / {totalEpNum}</p>
        </div>
      </div>

      {/* Feed Container */}
      <div 
        ref={containerRef}
        className="relative z-10 h-full overflow-y-scroll snap-y snap-mandatory no-scrollbar touch-pan-y"
      >
        {feed.map((item, idx) => (
          <div 
            key={item.id}
            data-index={idx}
            ref={(el) => { itemRefs.current[idx] = el; }}
            className="h-full w-full snap-start flex justify-center items-center md:p-4" 
          >
            <div className="relative w-full h-full md:max-w-[400px] md:rounded-2xl overflow-hidden bg-black shadow-2xl">
              
              <VideoPlayer 
                src={item.video || ""} 
                poster={item.poster || ""} 
                isActive={idx === activeIndex}
                onEnded={handleNext}
              />

              {/* OVERLAY UI 
                  🔥 FIX: Tambahin z-20 biar dia di atas layer video (z-10).
                  Tanpa ini, tombol "Eps" gak bisa diklik.
              */}
              <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end p-4 pb-8 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
                <div className="flex items-end gap-3">
                  <div className="flex-1 space-y-1.5 pointer-events-auto">
                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Ep. {item.epNo}
                    </span>
                    <p className="text-xs text-white/90 line-clamp-2 leading-relaxed drop-shadow-md">
                      {item.intro || "Nonton drama seru full episode."}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 items-center pointer-events-auto">
                    {/* Tombol EPS (Sekarang bisa diklik!) */}
                    <button onClick={() => setShowEpList(true)} className="flex flex-col items-center gap-1 group cursor-pointer z-30">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-active:scale-90 transition border border-white/10 hover:bg-white/20">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                      </div>
                      <span className="text-[9px] font-medium text-white/80">Eps</span>
                    </button>

                     <button 
                       onClick={() => detail && toggleMyList({
                          bookId: String(bookId),
                          bookName: detail.bookName,
                          cover: detail.bookCover || detail.coverWap || "",
                          timestamp: Date.now()
                       })}
                       className="flex flex-col items-center gap-1 group cursor-pointer z-30"
                      >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center group-active:scale-90 transition border backdrop-blur-md ${isSaved ? "bg-red-600 border-red-500 text-white" : "bg-white/10 border-white/10 text-white"}`}>
                         {isSaved ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                         )}
                      </div>
                      <span className="text-[9px] font-medium text-white/80">{isSaved ? "Saved" : "List"}</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}
        {feed.length < episodes.length && (
          <div className="h-20 flex items-center justify-center text-white/30 text-xs">
            <span className="animate-pulse">Memuat...</span>
          </div>
        )}
      </div>

      {/* Drawer Episode */}
      {showEpList && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-[#181818] w-full max-w-md h-[70vh] rounded-t-2xl flex flex-col overflow-hidden border-t border-white/10 animate-in slide-in-from-bottom-10 duration-300"
            onClick={(e) => e.stopPropagation()} // Stop propagation biar gak nutup pas diklik contentnya
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-bold text-white">Pilih Episode</h3>
              <button onClick={() => setShowEpList(false)} className="p-2 bg-white/10 rounded-full text-white/70 hover:bg-white/20">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-2 content-start">
              {episodes.map((ep: any, i) => {
                 const num = i + indexOffset;
                 return (
                   <button
                    key={i}
                    onClick={() => jumpToEpisode(i)}
                    className={`aspect-square rounded-lg text-sm font-bold flex items-center justify-center transition ${i === activeIndex ? "bg-red-600 text-white" : "bg-white/5 text-white/60"}`}
                   >
                     {num}
                   </button>
                 )
              })}
            </div>
          </div>
          <div className="absolute inset-0 -z-10" onClick={() => setShowEpList(false)} />
        </div>
      )}
    </div>
  );
}

// --- VIDEO PLAYER (MUTE ADDED) ---
function VideoPlayer({ src, poster, isActive, onEnded }: { src: string, poster: string, isActive: boolean, onEnded: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeeding, setIsSpeeding] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // 🔥 State Mute
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (isActive) {
      const timer = setTimeout(() => {
        vid.currentTime = 0; 
        vid.playbackRate = 1.0;
        vid.muted = isMuted; // Sync mute state
        vid.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }, 50); 
      return () => clearTimeout(timer);
    } else {
      vid.pause();
      setIsPlaying(false);
    }
  }, [isActive, src]);

  // Handle Touch/Click
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleStart = (e: any) => {
    if (e.type === 'mousedown') e.preventDefault();
    pressTimer.current = setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.playbackRate = 2.0;
        setIsSpeeding(true);
      }
    }, 200);
  };

  const handleEnd = (e: any) => {
    if (e.type === 'mouseup') e.preventDefault();
    if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }

    if (isSpeeding) {
      if (videoRef.current) { videoRef.current.playbackRate = 1.0; setIsSpeeding(false); }
    } else {
      if (videoRef.current) {
        if (videoRef.current.paused) { videoRef.current.play().catch(()=>{}); setIsPlaying(true); }
        else { videoRef.current.pause(); setIsPlaying(false); }
      }
    }
  };

  const toggleMute = (e: any) => {
    e.stopPropagation(); // 🔥 Penting! Biar gak pause video pas klik mute
    if (videoRef.current) {
      const next = !videoRef.current.muted;
      videoRef.current.muted = next;
      setIsMuted(next);
    }
  };

  return (
    <div className="relative w-full h-full bg-black select-none touch-none">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-cover"
        playsInline
        webkit-playsinline="true"
        loop={false}
        muted={isMuted}
        onTimeUpdate={() => videoRef.current && setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)}
        onEnded={onEnded}
      />
      
      {/* Invisible Layer buat Touch (z-10) */}
      <div 
        className="absolute inset-0 z-10"
        onMouseDown={handleStart} onMouseUp={handleEnd} onMouseLeave={handleEnd}
        onTouchStart={handleStart} onTouchEnd={handleEnd}
      />

      {/* 🔥 TOMBOL MUTE (z-30 biar paling atas) */}
      <button 
        onClick={toggleMute}
        onTouchEnd={(e) => { e.preventDefault(); toggleMute(e); }}
        className="absolute top-4 right-4 z-30 p-2 bg-black/40 backdrop-blur rounded-full text-white/80 hover:text-white"
      >
        {isMuted ? (
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
        ) : (
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        )}
      </button>

      {isSpeeding && (
         <div className="absolute top-10 inset-x-0 flex justify-center z-20 pointer-events-none">
           <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur">⚡ 2x Speed</span>
         </div>
      )}

      {!isPlaying && !isSpeeding && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
           <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur shadow">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
           </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/20 z-20">
         <div className="h-full bg-red-600 transition-all duration-100" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

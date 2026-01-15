"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  const [detail, setDetail] = useState<any>(null);
  const [episodes, setEpisodes] = useState<EpisodeRaw[]>([]);
  
  const [limit, setLimit] = useState(5); 
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [showEpList, setShowEpList] = useState(false);

  const aliveRef = useRef(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  // Fetch Data
  useEffect(() => {
    aliveRef.current = true;
    setLoading(true);

    (async () => {
      try {
        const [dRes, eRes] = await Promise.all([
          fetch(`/api/dramabox/detail?bookId=${bookId}`, { cache: "no-store" }),
          fetch(`/api/dramabox/allepisode?bookId=${bookId}`, { cache: "no-store" }),
        ]);

        const dJson = await dRes.json();
        const eJson = await eRes.json();

        if (!aliveRef.current) return;

        const book = dJson?.data?.data?.book || dJson?.data?.book || null;
        const eps = Array.isArray(eJson?.data) ? eJson.data : (Array.isArray(eJson) ? eJson : []);

        setDetail(book);
        setEpisodes(eps);
      } catch (e: any) {
        if (aliveRef.current) setErr(e?.message || "Gagal memuat drama");
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    })();

    return () => { aliveRef.current = false; };
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

  // Observer
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (best && best.isIntersecting) {
          const idx = Number((best.target as HTMLElement).dataset.index);
          setActiveIndex(idx);
        }
      },
      { root, threshold: 0.6 }
    );
    itemRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [feed.length]);

  // Navigation Logic
  const jumpToEpisode = useCallback((index: number) => {
    if (index >= limit) {
      setLimit(index + 5);
      setTimeout(() => {
        itemRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      itemRefs.current[index]?.scrollIntoView({ behavior: "smooth" });
    }
    setShowEpList(false);
  }, [limit]);

  // Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showEpList) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = activeIndex + 1;
        if (next < episodes.length) jumpToEpisode(next);
      } 
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = activeIndex - 1;
        if (prev >= 0) jumpToEpisode(prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, episodes.length, showEpList, jumpToEpisode]);

  const handleNext = () => {
    const next = activeIndex + 1;
    if (next < episodes.length) jumpToEpisode(next);
  };

  // --- INFO HEADER (Current / Total) ---
  const currentEpNum = feed[activeIndex]?.epNo || (activeIndex + 1);
  const totalEpNum = episodes.length > 0 ? episodes.length : "-";
  const currentPoster = feed[activeIndex]?.poster || "";

  if (err) return <div className="h-screen flex items-center justify-center text-red-500 bg-[#0a0a0a]">{err}</div>;

  return (
    <div className="relative h-[100svh] bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-red-500/30">
      
      {/* === AMBIENT BACKGROUND === */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out opacity-30 blur-[90px] scale-110"
          style={{ backgroundImage: `url(${currentPoster})` }}
        />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* === HEADER BARU (LEBIH RAPI) === */}
      <div className="absolute top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        <button 
          onClick={() => router.back()} 
          className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/5 flex items-center justify-center hover:bg-white/20 transition group"
        >
          <svg className="w-5 h-5 text-white/90 group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        
        {/* Info Judul & Episode */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h1 className="font-bold text-sm sm:text-base truncate text-white drop-shadow-lg tracking-tight leading-tight">
            {detail?.bookName || "Memuat Drama..."}
          </h1>
          <div className="flex items-center gap-2 text-[11px] text-white/60 font-medium tracking-wide mt-0.5">
             {loading ? (
                <span className="animate-pulse">Loading info...</span>
             ) : (
               <>
                 <span className="text-red-500 font-bold">Eps {currentEpNum}</span>
                 <span className="text-white/30">/</span>
                 <span>{totalEpNum} Episodes</span>
               </>
             )}
          </div>
        </div>
      </div>

      {/* === FEED CONTAINER === */}
      <div 
        ref={containerRef}
        className="relative z-10 h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
      >
        {feed.map((item, idx) => (
          <div 
            key={item.id}
            data-index={idx}
            ref={(el) => { itemRefs.current[idx] = el; }}
            className="h-full w-full snap-start flex justify-center items-center p-0 md:p-6" 
          >
            {/* Wrapper Card */}
            <div className="relative w-full h-full md:max-w-[420px] md:h-[90vh] md:max-h-[850px] bg-black md:rounded-3xl overflow-hidden md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] md:border md:border-white/10 ring-1 ring-white/5">
              
              <VideoPlayer 
                src={item.video || ""} 
                poster={item.poster || ""} 
                isActive={idx === activeIndex}
                onEnded={handleNext}
              />

              {/* OVERLAY UI */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-5 pb-8 bg-gradient-to-t from-black via-black/20 to-transparent">
                <div className="flex items-end gap-4">
                  
                  {/* TEXT INFO (Left) */}
                  <div className="flex-1 space-y-2 pointer-events-auto pb-1">
                    <div className="flex items-center gap-2">
                       <span className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                         Ep. {item.epNo}
                       </span>
                    </div>
                    <p className="text-xs text-white/80 line-clamp-2 leading-relaxed drop-shadow-md font-medium pr-4">
                      {item.intro || "Nonton drama seru ini full episode sub indo. Kualitas HD tanpa buffering."}
                    </p>
                  </div>

                  {/* SIDE ACTIONS (Right) */}
                  <div className="flex flex-col gap-4 items-center pointer-events-auto pb-2">
                    {/* List Episode */}
                    <button onClick={() => setShowEpList(true)} className="group flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 hover:bg-white/20 transition shadow-lg">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
                      </div>
                      <span className="text-[9px] font-medium text-white/80 drop-shadow">Eps</span>
                    </button>

                     {/* Like */}
                     <button className="group flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center active:scale-90 hover:bg-white/20 transition shadow-lg">
                         <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                      </div>
                      <span className="text-[9px] font-medium text-white/80 drop-shadow">Like</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ))}

        {feed.length < episodes.length && (
           <div className="h-24 w-full flex items-center justify-center text-xs text-white/50 pb-10">
              <button onClick={() => setLimit(l => l + 5)} className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/5 rounded-full backdrop-blur-md transition">
                 Muat Episode Lainnya...
              </button>
           </div>
        )}
      </div>

      {/* === EPISODE DRAWER === */}
      {showEpList && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            className="bg-[#121212]/95 backdrop-blur-xl w-full max-w-md h-[70vh] rounded-t-3xl sm:rounded-3xl flex flex-col overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="font-bold text-base text-white">Daftar Episode</h3>
                <p className="text-xs text-white/40 mt-0.5">Total {episodes.length} Episode</p>
              </div>
              <button onClick={() => setShowEpList(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-5 gap-3 content-start">
              {episodes.map((ep: any, i) => {
                 const num = i + indexOffset;
                 const isCurrent = i === activeIndex;
                 return (
                   <button
                    key={i}
                    onClick={() => jumpToEpisode(i)}
                    className={`
                      aspect-square rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-200
                      ${isCurrent 
                        ? "bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105" 
                        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"}
                    `}
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

// --- VIDEO PLAYER + PROGRESS BAR + MUTE POJOK ATAS ---
function VideoPlayer({ src, poster, isActive, onEnded }: { src: string, poster: string, isActive: boolean, onEnded: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeeding, setIsSpeeding] = useState(false);
  const [progress, setProgress] = useState(0);

  const pressTimer = useRef<NodeJS.Timeout>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    if (isActive) {
      videoRef.current?.play().catch(() => {}); 
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.playbackRate = 1.0;
      }
      setIsPlaying(false);
      setIsSpeeding(false);
      setProgress(0);
    }
  }, [isActive]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(isNaN(p) ? 0 : p);
    }
  };

  const handleMouseDown = () => {
    isLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      if (videoRef.current) {
        videoRef.current.playbackRate = 2.0;
        setIsSpeeding(true);
      }
    }, 200);
  };

  const handleMouseUp = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    if (isLongPress.current) {
      if (videoRef.current) {
        videoRef.current.playbackRate = 1.0;
        setIsSpeeding(false);
      }
    } else {
      togglePlay();
    }
    isLongPress.current = false;
  };

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div 
      className="relative w-full h-full bg-black cursor-pointer select-none group"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        className="w-full h-full object-cover"
        playsInline
        webkit-playsinline="true"
        loop={false}
        onEnded={onEnded}
      />
      
      {/* 2x Speed Indicator */}
      {isSpeeding && (
        <div className="absolute top-8 inset-x-0 flex justify-center z-30 animate-in fade-in zoom-in duration-200 pointer-events-none">
           <div className="bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 shadow-xl">
             <span className="text-yellow-400">⚡</span> 2x Speed
           </div>
        </div>
      )}

      {/* --- MUTE BUTTON (POJOK KANAN ATAS VIDEO) --- */}
      <button 
        onClick={toggleMute}
        className="absolute top-4 right-4 z-40 p-2.5 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white/90 hover:text-white transition-all transform hover:scale-105 active:scale-95"
      >
        {isMuted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        )}
      </button>

      {/* Play Icon (Tengah) */}
      {!isPlaying && !isSpeeding && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shadow-2xl scale-100 animate-in zoom-in duration-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-50">
          <div 
            className="h-full bg-red-600 transition-all duration-100 ease-linear shadow-[0_0_10px_rgba(220,38,38,0.8)]"
            style={{ width: `${progress}%` }}
          />
      </div>
    </div>
  );
}

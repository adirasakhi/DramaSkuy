"use client";

import { useEffect, useRef, useState } from "react";

export default function VideoCard({ item }: { item: any }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(true); // default mute biar autoplay aman
  const [soundAllowed, setSoundAllowed] = useState(false); // udah pernah user gesture?
  const [pressing, setPressing] = useState(false);

  // UI control hide
  const [showControls, setShowControls] = useState(true);
  const hideTimerRef = useRef<number | null>(null);

  // long press timer
  const pressTimerRef = useRef<number | null>(null);
  const pressedTriggeredRef = useRef(false);

  const HIDE_AFTER_MS = 8000; // 5-10 detik, adjust aja
  const LONGPRESS_MS = 350;   // tahan 0.35s baru pause

  const scheduleHide = () => {
    setShowControls(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      setShowControls(false);
    }, HIDE_AFTER_MS);
  };

  useEffect(() => {
    scheduleHide();
    return () => {
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection observer: active video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const io = new IntersectionObserver(
      (entries) => setActive(Boolean(entries[0]?.isIntersecting)),
      { threshold: 0.75 }
    );

    io.observe(v);
    return () => io.disconnect();
  }, []);

  // play/pause based on active + pressing
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    if (!active) {
      v.pause();
      v.currentTime = 0;
      return;
    }

    if (pressing) {
      v.pause();
      return;
    }

    v.play().catch(() => {
      // autoplay gagal (biasanya karena audio)
      // biarin muted dulu
    });
  }, [active, pressing]);

  // sync muted state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    v.muted = muted;
    v.volume = muted ? 0 : 1;
  }, [muted]);

  // try auto enable sound when active (kalau udah pernah interaksi)
  useEffect(() => {
    if (!active) return;
    if (!soundAllowed) return;

    // kalau udah allowed, kita nyalain suara otomatis
    setMuted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, soundAllowed]);

  // called on any user interaction (tap/move)
  const userInteracted = () => {
    scheduleHide();
    setSoundAllowed(true);
  };

  const toggleMute = async () => {
    userInteracted();
    setMuted((m) => !m);

    // ensure play attempt after user gesture
    const v = videoRef.current;
    if (v) {
      try {
        await v.play();
      } catch {}
    }
  };

  // long press handlers (pointer events)
  const onPointerDown = () => {
    userInteracted();

    pressedTriggeredRef.current = false;
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);

    pressTimerRef.current = window.setTimeout(() => {
      pressedTriggeredRef.current = true;
      setPressing(true); // pause while holding
    }, LONGPRESS_MS);
  };

  const endPress = () => {
    if (pressTimerRef.current) window.clearTimeout(pressTimerRef.current);

    // kalau long press kepicu, lepas => play lagi
    if (pressedTriggeredRef.current) {
      setPressing(false);
    }
  };

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-none md:rounded-2xl select-none"
      onPointerMove={userInteracted}
      onPointerDown={onPointerDown}
      onPointerUp={endPress}
      onPointerCancel={endPress}
      onPointerLeave={endPress}
      onClick={userInteracted}
    >
      {/* background blur */}
      <div
        className="absolute inset-0 scale-110 blur-2xl opacity-40"
        style={{
          backgroundImage: `url(${item.poster || item.cover || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* video */}
      <video
        ref={videoRef}
        className="relative z-10 h-full w-full object-cover md:object-contain"
        src={item.video}
        poster={item.poster || item.cover}
        muted={muted}
        playsInline
        loop
        preload="metadata"
      />

      {/* hint long press */}
      <div
        className={[
          "absolute z-30 top-4 left-1/2 -translate-x-1/2 text-xs text-white/70",
          "transition-opacity",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        Tahan video untuk pause
      </div>

      {/* bottom gradient */}
      <div className="absolute z-20 inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 to-transparent" />

      {/* overlay kiri bawah */}
      <div className="absolute z-30 bottom-6 left-4 right-20 text-white">
        <div className="text-base font-semibold drop-shadow line-clamp-1">
          {item.title}
        </div>

        {item.subtitle && (
          <div className="text-sm text-white/85 mt-1 drop-shadow line-clamp-1">
            {item.subtitle}
          </div>
        )}

        {item.intro && (
          <div className="text-sm text-white/70 mt-1 line-clamp-2">
            {item.intro}
          </div>
        )}

        {!!(item.tags?.length) && (
          <div className="mt-2 flex flex-wrap gap-2">
            {(item.tags || []).slice(0, 4).map((t: string) => (
              <span key={t} className="text-xs px-2 py-1 rounded-full bg-white/15">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* right: sound button (auto-hide) */}
      <div
        className={[
          "absolute z-40 bottom-6 right-4 text-white",
          "transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      >
        <button
          className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 transition"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          title={muted ? "Hidupkan suara" : "Matikan suara"}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      {/* pause overlay indicator */}
      {pressing && (
        <div className="absolute z-40 inset-0 flex items-center justify-center">
          <div className="px-4 py-2 rounded-full bg-black/60 border border-white/10 text-white/90 text-sm">
            Paused ⏸️
          </div>
        </div>
      )}
    </div>
  );
}


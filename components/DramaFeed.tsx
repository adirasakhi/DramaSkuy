"use client";

import { useEffect, useRef, useState } from "react";
import VideoCard from "./VideoCard";

type Card = {
  id: string;
  title: string;
  intro?: string;
  tags: string[];
  cover?: string;
  poster?: string;
  video?: string;
  meta?: any;
};

export default function DramaFeed() {
  const [items, setItems] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  // anti dobel fetch (React Strict Mode)
  const booted = useRef(false);
  // throttle load-next
  const lastFetch = useRef(0);

  async function fetchBatch() {
    const now = Date.now();
    if (loading) return;
    if (now - lastFetch.current < 2000) return; // 2 detik minimal

    setLoading(true);
    lastFetch.current = now;

    try {
      const res = await fetch("/api/dramabox/random", { cache: "no-store" });
      const json = await res.json();

      if (!json?.ok) return;

      const batch: Card[] = json.data || [];
      setItems((prev) => {
        const seen = new Set(prev.map((x) => x.id));
        const merged = [...prev];
        for (const it of batch) if (!seen.has(it.id)) merged.push(it);
        return merged;
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    fetchBatch(); // 1x dapet banyak
  }, []);

  // fetch batch baru pas udah deket bawah
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const nearBottom =
        el.scrollTop + window.innerHeight > el.scrollHeight - 1200;
      if (nearBottom) fetchBatch();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading]);

  return (
<div className="h-[100svh] w-full overflow-y-scroll snap-y snap-mandatory bg-black">
{items.map((it, idx) => (
  <div key={it.id ?? idx} className="h-[100svh] snap-start">
    <div className="h-full w-full flex items-center justify-center bg-black">
      <div className="relative h-[100svh] w-full max-w-[520px]">
        <VideoCard item={it} />
      </div>
    </div>
  </div>
))}

      {loading && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
          loading…
        </div>
      )}
    </div>
  );
}

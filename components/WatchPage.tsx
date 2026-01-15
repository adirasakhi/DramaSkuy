"use client";
import { useEffect, useMemo, useState } from "react";
import VideoCard from "./VideoCard";

function pick720(ep: any) {
    const defCdn = ep?.cdnList?.find((c: any) => c.isDefault === 1) || ep?.cdnList?.[0];
    const v720 = defCdn?.videoPathList?.find((v: any) => v.quality === 720 && v.isDefault === 1)
        || defCdn?.videoPathList?.find((v: any) => v.quality === 720);
    return v720?.videoPath;
}

export default function WatchFeed({ bookId }: { bookId: string }) {
    const [detail, setDetail] = useState<any>(null);
    const [episodes, setEpisodes] = useState<any[]>([]);
    const [limit, setLimit] = useState(4);

    useEffect(() => {
        (async () => {
            const [dRes, eRes] = await Promise.all([
                fetch(`/api/dramabox/detail?bookId=${bookId}`, { cache: "no-store" }),
                fetch(`/api/dramabox/allepisode?bookId=${bookId}`, { cache: "no-store" }),
            ]);
            const dJson = await dRes.json();
            const eJson = await eRes.json();

            setDetail(dJson?.data?.data?.book || dJson?.data?.data?.data?.book || dJson?.data?.data?.book || null);
            setEpisodes(Array.isArray(eJson?.data) ? eJson.data : []);
            setLimit(4);
        })();
    }, [bookId]);

    const feed = useMemo(() => {
        return episodes
            .slice(0, limit)
            .map((ep) => ({
                id: ep.chapterId,
                title: detail?.bookName || "Drama",
                epName: ep.chapterName,
                intro: detail?.introduction,
                poster: ep.chapterImg,
                video: pick720(ep),
                index: ep.chapterIndex,
            }))
            .filter((x) => x.video);
    }, [episodes, limit, detail]);

    return (
        <div className="h-[100svh] bg-black text-white">
            <div className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur p-3">
                <div className="text-sm font-semibold line-clamp-1">{detail?.bookName}</div>
                <div className="text-xs text-white/60">Loaded {Math.min(limit, episodes.length)} / {episodes.length} eps</div>
            </div>

            <div className="pt-14 h-[100svh] overflow-y-scroll snap-y snap-mandatory">
                {feed.map((it) => (
                    <div key={it.id} className="h-[calc(100svh-56px)] snap-start flex justify-center">
                        <div className="w-full max-w-[520px] h-full">
                            <VideoCard item={it} />
                        </div>
                    </div>
                ))}

                {/* ini aman: load more cuma nambah slice lokal */}
                <div className="py-6 flex justify-center">
                    <button
                        onClick={() => setLimit((x) => Math.min(x + 4, episodes.length))}
                        disabled={limit >= episodes.length}
                        className="px-4 py-2 rounded-full bg-white text-black disabled:opacity-40"
                    >
                        {limit >= episodes.length ? "All episodes loaded ✅" : "Load 4 more"}
                    </button>
                </div>
            </div>
        </div>
    );
}

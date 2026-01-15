"use client";

import dynamic from "next/dynamic";

const WatchFeed = dynamic(() => import("@/components/WatchFeed"), {
  ssr: false,
});

export default function WatchPageClient({ bookId }: { bookId: string }) {
  return <WatchFeed bookId={bookId} />;
}


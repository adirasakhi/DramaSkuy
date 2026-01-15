import WatchPageClient from "./WatchPageClient";

export default async function Page({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  return <WatchPageClient bookId={bookId} />;
}


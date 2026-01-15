export default function Layout({ children }: { children: React.ReactNode }) {
    return <div className="h-[100svh] overflow-hidden bg-black">{children}</div>;
}

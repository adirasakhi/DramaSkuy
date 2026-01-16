"use client";

import Link from "next/link";
import { useLibrary } from "@/hooks/useLibrary";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LibraryPage() {
  const router = useRouter();
  const { history, myList, isMounted } = useLibrary();
  const [activeTab, setActiveTab] = useState<"history" | "mylist">("history");

  // Prevent Hydration Mismatch
  if (!isMounted) return <div className="min-h-screen bg-[#0a0a0a]" />;

  const dataToShow = activeTab === "history" ? history : myList;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24 selection:bg-red-500/30">
      
      {/* --- HEADER --- */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 py-3 flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-lg font-bold tracking-tight">Pustaka Saya</h1>
      </div>

      {/* --- TABS --- */}
      <div className="px-4 py-6">
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "history" ? "bg-white text-black shadow-lg scale-[1.02]" : "text-white/50 hover:text-white"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Riwayat
          </button>
          <button 
            onClick={() => setActiveTab("mylist")}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === "mylist" ? "bg-white text-black shadow-lg scale-[1.02]" : "text-white/50 hover:text-white"}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            My List
          </button>
        </div>
      </div>

      {/* --- GRID CONTENT --- */}
      <div className="px-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
        {dataToShow.map((item) => (
          <Link 
            // Kalau history, link bawa parameter ?ep=... biar auto loncat
            href={activeTab === "history" ? `/watch/${item.bookId}?ep=${item.lastEpIndex || 1}` : `/watch/${item.bookId}`}
            key={item.bookId} 
            className="group block relative"
          >
            {/* Card Image */}
            <div className="relative aspect-[3/4.2] rounded-xl overflow-hidden bg-white/5 border border-white/5 shadow-sm group-hover:border-red-500/50 transition duration-300">
              <img 
                src={item.cover} 
                alt={item.bookName}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-500 ease-in-out"
                onError={(e) => { e.currentTarget.src = "https://placehold.co/400x600/1a1a1a/FFF?text=No+Image"; }}
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition" />

              {/* BADGE KHUSUS HISTORY: LANJUT EPS BERAPA */}
              {activeTab === "history" && item.lastEpIndex && (
                <div className="absolute bottom-2 left-2 right-2">
                   <div className="bg-red-600/90 backdrop-blur-md text-white text-[10px] font-bold py-1.5 px-2 rounded-lg text-center shadow-lg flex items-center justify-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Lanjut Eps {item.lastEpIndex}
                   </div>
                </div>
              )}

              {/* BADGE KHUSUS MYLIST: ICON SAVED */}
              {activeTab === "mylist" && (
                 <div className="absolute top-2 right-2">
                    <div className="bg-black/60 backdrop-blur p-1.5 rounded-full">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    </div>
                 </div>
              )}
            </div>

            {/* Judul */}
            <h3 className="mt-2 text-xs font-medium text-white/80 line-clamp-2 leading-relaxed group-hover:text-white transition">
              {item.bookName}
            </h3>
            
            {/* Timestamp (Optional: Kalo mau nampilin kapan terakhir nonton) */}
            {activeTab === "history" && (
               <p className="text-[10px] text-white/30 mt-1">
                 {new Date(item.timestamp).toLocaleDateString()}
               </p>
            )}
          </Link>
        ))}
      </div>

      {/* --- EMPTY STATE --- */}
      {dataToShow.length === 0 && (
        <div className="mt-20 flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
             {activeTab === "history" ? (
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
             ) : (
               <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/20"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
             )}
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            {activeTab === "history" ? "Belum ada riwayat" : "List masih kosong"}
          </h3>
          <p className="text-sm text-white/40 max-w-xs leading-relaxed">
            {activeTab === "history" 
              ? "Ayo mulai nonton drama seru, nanti riwayatmu bakal muncul di sini otomatis!" 
              : "Simpan drama favoritmu biar gampang dicari nanti."}
          </p>
          <Link href="/" className="mt-8 px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition active:scale-95">
            Cari Drama
          </Link>
        </div>
      )}

    </div>
  );
}

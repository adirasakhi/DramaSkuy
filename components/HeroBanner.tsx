"use client";
import Link from "next/link";

// Ambil 5 item pertama dari data API lo buat ditampilin di sini
export default function HeroBanner({ items }: { items: any[] }) {
  if (!items.length) return null;
  
  // Ambil item pertama sebagai "Main Hero"
  const heroItem = items[0]; 

  return (
    <div className="relative w-full h-[60vh] sm:h-[70vh] overflow-hidden group">
      {/* Background Image Full */}
      <div className="absolute inset-0">
        <img 
          src={heroItem.coverWap || heroItem.bookCover} 
          className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition duration-700 ease-in-out"
          alt="Hero"
        />
        {/* Gradient biar teks kebaca & estetik */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-transparent" />
      </div>

      {/* Content Text */}
      <div className="absolute bottom-0 left-0 p-6 sm:p-10 max-w-2xl z-10 flex flex-col gap-4">
        <span className="text-red-500 font-bold tracking-widest text-xs uppercase bg-red-500/10 border border-red-500/20 px-3 py-1 rounded-full w-fit backdrop-blur-md">
          🔥 Trending #1
        </span>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight drop-shadow-xl">
          {heroItem.bookName}
        </h1>
        
        <p className="text-white/80 line-clamp-2 text-sm sm:text-base max-w-lg">
          {heroItem.introduction || "Nonton drama seru ini sekarang, full episode sub indo tanpa ribet."}
        </p>

        <div className="flex gap-3 mt-2">
            <Link 
              href={`/watch/${heroItem.bookId}`}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold flex items-center gap-2 transition transform hover:scale-105"
            >
              ▶ Mulai Nonton
            </Link>
            <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-6 py-3 rounded-full font-medium backdrop-blur-sm transition">
              + Daftar List
            </button>
        </div>
      </div>
    </div>
  );
}

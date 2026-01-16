"use client";

import { useState, useEffect } from "react";

export interface LibraryItem {
  bookId: string;
  bookName: string;
  cover: string;
  lastEpIndex?: number;
  timestamp: number;
}

export function useLibrary() {
  const [history, setHistory] = useState<LibraryItem[]>([]);
  const [myList, setMyList] = useState<LibraryItem[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Load data pas awal buka (Mounting)
  useEffect(() => {
    setIsMounted(true);
    try {
      const localHist = localStorage.getItem("dramabox-history");
      const localList = localStorage.getItem("dramabox-mylist");
      
      if (localHist) setHistory(JSON.parse(localHist));
      if (localList) setMyList(JSON.parse(localList));
      
      console.log("📚 Library Loaded!"); // Cek Console browser lo
    } catch (e) {
      console.error("Gagal load library:", e);
    }
  }, []);

  // 2. Fungsi Add History (VERSI BARU - LEBIH STABIL)
  const addToHistory = (item: LibraryItem) => {
    // Ambil data lama langsung dari state saat ini
    const currentHistory = [...history];
    
    // Filter biar gak duplikat
    const filtered = currentHistory.filter((i) => String(i.bookId) !== String(item.bookId));
    
    // Masukin item baru di paling atas
    const newHistory = [item, ...filtered].slice(0, 30);
    
    // A. SIMPAN KE BROWSER (Paksa Simpan)
    localStorage.setItem("dramabox-history", JSON.stringify(newHistory));
    
    // B. Update State React
    setHistory(newHistory);
    
    console.log("✅ History Saved:", item.bookName); // Debugging
  };

  // 3. Fungsi Toggle My List (VERSI BARU)
  const toggleMyList = (item: LibraryItem) => {
    const currentList = [...myList];
    const exists = currentList.find((i) => String(i.bookId) === String(item.bookId));
    
    let newList;
    if (exists) {
      newList = currentList.filter((i) => String(i.bookId) !== String(item.bookId));
      console.log("❌ Removed from List");
    } else {
      newList = [item, ...currentList];
      console.log("❤️ Added to List");
    }

    localStorage.setItem("dramabox-mylist", JSON.stringify(newList));
    setMyList(newList);
  };

  const isInList = (bookId: string) => {
    return !!myList.find((i) => String(i.bookId) === String(bookId));
  };

  return { 
    history, 
    myList, 
    addToHistory, 
    toggleMyList, 
    isInList,
    isMounted 
  };
}

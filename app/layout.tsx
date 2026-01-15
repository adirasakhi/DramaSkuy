import type { Metadata } from "next";
import { Outfit } from "next/font/google"; // 1. Import font dari sini
import "./globals.css";

// 2. Config fontnya
const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"], // Pilih ketebalan yang mau dipake
  variable: "--font-outfit", // Optional: kalau mau pake variable di tailwind
});

export const metadata: Metadata = {
  title: "DramaBox Clone",
  description: "Nonton drama china sub indo gratis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* 3. Masukin class fontnya ke Body */}
      <body className={`${outfit.className} bg-black text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}

"use client";


import dynamic from "next/dynamic";

const HomeGrid = dynamic(() => import("@/components/HomeGrid"), { ssr: false });

export default function Page() {
  return <HomeGrid />;
}


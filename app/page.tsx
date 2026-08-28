"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

export default function Home(){
  const [ads,setAds]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");

  useEffect(()=>{(async()=>{
    const q=query(collection(db,"products"), orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    setAds(snap.docs.map(d=>({id:d.id,...d.data() as any})));
  })()},[]);

  const categories=["All","Cars","Properties","Mobiles","Jobs","Bikes","Furniture","Fashion"];

  const filtered=ads.filter(a=>{
    const s=search.toLowerCase();
    return (a.title?.toLowerCase().includes(s) || "") && (cat==="All" || a.category===cat);
  });

  return <main className="min-h-screen bg-[#f2f2f2] pb-20">
    {/* SEARCH TOP ONLY - NO HEADER */}
    <div className="bg-white sticky top-0 z-20 p-3">
      <div className="flex items-center border border-gray-300 rounded-md px-3 py-2.5 bg-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="m21 21-4.3-4.3"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Find Cars, Mobile Phones and more...' className="flex-1 outline-none text-sm ml-2"/>
      </div>
      <div className="flex gap-2 overflow-x-auto mt-3 pb-1 scrollbar-hide">
        {categories.map(c=>
          <button key={c} onClick={()=>setCat(c)} className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-medium ${cat===c?'bg-[#002f34] text-white border-[#002f34]':'bg-white text-[#002f34]'}`}>{c}</button>
        )}
      </div>
    </div>

    {/* GRID */}
    <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
      {filtered.map(ad=>
        <Link key={ad.id} href={`/marketplace/${ad.id}`} className="bg-white p-2.5">
          <img src={ad.image || ad.images?.[0]} className="w-full h-36 object-cover"/>
          <p className="font-bold mt-2 text-[16px] text-[#002f34]">₹ {ad.price}</p>
          <p className="text-[13px] text-[#002f34] truncate leading-tight">{ad.title}</p>
          <div className="flex justify-between items-center mt-3">
            <p className="text-[10px] text-gray-500 uppercase">{ad.location || "MIZORAM"}</p>
            <p className="text-[10px] text-gray-500">Today</p>
          </div>
        </Link>
      )}
    </div>

    {/* FOOTER FINAL - ICON MAWI */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center pt-2 pb-1 z-30">
      <Link href="/" className="flex flex-col items-center text-[#002f34]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#002f34"><path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/></svg>
        <span className="text-[10px] font-bold mt-1">HOME</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center text-gray-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
        <span className="text-[10px] mt-1">MY ADS</span>
      </Link>
      <Link href="/sell" className="flex flex-col items-center">
        <div className="w-11 h-11 bg-white rounded-full border-[3px] border-[#002f34] flex items-center justify-center shadow -mt-2"><span className="text-xl font-bold">+</span></div>
        <span className="text-[10px] mt-1 font-medium">SELL</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center text-gray-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/></svg>
        <span className="text-[10px] mt-1">ACCOUNT</span>
      </Link>
    </div>
  </main>
}

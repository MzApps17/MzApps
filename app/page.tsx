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
    const data=snap.docs.map(d=>({id:d.id,...d.data() as any}));
    // Jobs pawh telh vek
    try{
      const q2=query(collection(db,"jobs"), orderBy("createdAt","desc"));
      const s2=await getDocs(q2);
      const jobs=s2.docs.map(d=>({id:d.id, title:d.data().title, price:d.data().salary, image:"https://cdn-icons-png.flaticon.com/512/3135/3135715.png", location:d.data().location, category:"Jobs", ...d.data()}));
      setAds([...data, ...jobs]);
    }catch{ setAds(data); }
  })()},[]);

  const categories = ["All","Cars","Properties","Mobiles","Jobs","Bikes","Furniture","Fashion","Electronics"];

  const filtered = ads.filter(a=>{
    const s=search.toLowerCase();
    const matchSearch = a.title?.toLowerCase().includes(s) || a.location?.toLowerCase().includes(s);
    const matchCat = cat==="All" || a.category===cat || a.title?.toLowerCase().includes(cat.toLowerCase());
    return matchSearch && matchCat;
  });

  return <main className="min-h-screen bg-[#f5f5f5] pb-20">
    {/* TOP SEARCH - OLX Style */}
    <div className="bg-white sticky top-0 z-20 p-3 border-b">
      <div className="flex gap-2 items-center border-2 border-black rounded-lg px-3 py-2">
        <span className="text-lg">🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder='Search "Properties"' className="flex-1 outline-none text-sm"/>
        <span className="text-lg">🎤</span>
      </div>
      {/* CATEGORY CHIPS */}
      <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
        {categories.map(c=>
          <button key={c} onClick={()=>setCat(c)} className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-xs font-bold ${cat===c?'bg-black text-white':'bg-white'}`}>{c}</button>
        )}
      </div>
    </div>

    {/* GRID - 2 COLUMNS LIKE OLX */}
    <div className="grid grid-cols-2 gap-[2px] bg-gray-200">
      {filtered.map(ad=>
        <Link key={ad.id} href={ad.category==="Jobs"?`/jobs/${ad.id}`:`/marketplace/${ad.id}`} className="bg-white p-2 relative">
          <div className="relative">
            <img src={ad.image || ad.images?.[0]} className="w-full h-32 object-cover bg-gray-100"/>
            <button className="absolute top-2 right-2 bg-white w-7 h-7 rounded-full flex items-center justify-center shadow">♡</button>
          </div>
          <p className="font-bold mt-2 text-[15px]">₹ {ad.price || ad.salary}</p>
          <p className="text-[12px] leading-tight truncate">{ad.title?.toUpperCase()}</p>
          <p className="text-[10px] text-gray-500 mt-2 flex items-center gap-1">📍 {ad.location || "Mizoram"} • {ad.createdAt? "Today":""}</p>
        </Link>
      )}
    </div>
    {filtered.length===0 && <p className="text-center text-gray-400 mt-20">Engmah a awm lo</p>}

    {/* FOOTER - OLX */}
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center py-2 z-30">
      <Link href="/" className="flex flex-col items-center text-blue-600"><span className="text-xl">🏠</span><span className="text-[10px] font-bold">Home</span></Link>
      <Link href="/profile" className="flex flex-col items-center"><span className="text-xl">📄</span><span className="text-[10px]">My Ads</span></Link>
      <Link href="/sell" className="flex flex-col items-center"><div className="w-12 h-12 bg-white border-4 border-yellow-400 border-t-cyan-500 border-r-blue-600 rounded-full flex items-center justify-center -mt-6 shadow-lg"><span className="text-2xl font-bold">+</span></div><span className="text-[10px] mt-1">Sell</span></Link>
      <Link href="/jobs" className="flex flex-col items-center"><span className="text-xl">💼</span><span className="text-[10px]">Jobs</span></Link>
      <Link href="/profile" className="flex flex-col items-center"><span className="text-xl">👤</span><span className="text-[10px]">Account</span></Link>
    </div>
  </main>
}

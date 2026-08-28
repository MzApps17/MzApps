"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

export default function Home(){
  const [ads,setAds]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      try{
        const q=query(collection(db,"products"), orderBy("createdAt","desc"));
        const snap=await getDocs(q);
        setAds(snap.docs.map(d=>({id:d.id,...d.data() as any})));
      }catch{}
      setLoading(false);
    })();
  },[]);

  const categories=["All","Cars","Properties","Mobiles","Jobs","Bikes","Furniture","Fashion","Electronics"];

  const filtered=ads.filter(a=>{
    const s=search.toLowerCase();
    const matchSearch=!s || a.title?.toLowerCase().includes(s) || a.location?.toLowerCase().includes(s);
    const matchCat=cat==="All" || a.category===cat;
    return matchSearch && matchCat;
  });

  return (
    <main className="min-h-screen bg-[#f2f2f2]">
      <div className="bg-white sticky top-0 z-20 p-3 border-b">
        <div className="flex items-center border border-[#002f34] rounded-md px-3 py-[10px] gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002f34" strokeWidth="2.5"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find Cars, Mobile Phones and more..." className="flex-1 outline-none text-[14px] bg-transparent"/>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 px-1 pb-1 scrollbar-hide">
          {categories.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-[13px] font-bold ${cat===c?'bg-[#002f34] text-white border-[#002f34]':'bg-white text-[#002f34] border-gray-300'}`}>{c}</button>
          ))}
        </div>
      </div>

      {loading? (
        <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
          {[1,2,3,4].map(i=><div key={i} className="bg-white h-56 animate-pulse"/>)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
          {filtered.map(ad=>(
            <Link key={ad.id} href={`/marketplace/${ad.id}`} className="bg-white p-2 flex flex-col">
              <div className="w-full h-36 bg-gray-100 overflow-hidden">
                <img src={ad.image || ad.images?.[0] || "https://via.placeholder.com/300"} alt={ad.title} className="w-full h-full object-cover"/>
              </div>
              <p className="font-black mt-2 text-[16px] text-[#002f34]">₹ {ad.price || "0"}</p>
              <p className="text-[13px] text-[#002f34] truncate font-medium">{ad.title}</p>
              <div className="flex justify-between mt-3">
                <p className="text-[10px] text-gray-500 font-bold uppercase">{ad.location || "MIZORAM"}</p>
                <p className="text-[10px] text-gray-500 font-bold">TODAY</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
              }

"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

function formatTime(ts:any){
  if(!ts) return "Just now";
  try{
    const d = ts.toDate? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime())/1000);
    if(diff < 60) return "Tunah";
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
  }catch{ return ""; }
}

export default function Market(){
  const [items,setItems]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");

  useEffect(()=>{ (async()=>{
    const q = query(collection(db,"products"), orderBy("createdAt","desc"));
    const snap = await getDocs(q);
    setItems(snap.docs.map(d=>({id:d.id,...d.data()})));
  })() },[]);

  const filtered = items.filter(i=>{
    const matchSearch = i.title?.toLowerCase().includes(search.toLowerCase());
    const matchCat = cat==="All" || i.category===cat || (cat==="Bike" && i.title?.toLowerCase().includes("bike"));
    return matchSearch && (cat==="All"? true : i.title?.toLowerCase().includes(cat.toLowerCase()) || matchCat);
  });

  const categories = ["All","Bike","Phone","Car","In","Thildang"];

  return (
    <main className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <Link href="/" className="font-bold">← MZ</Link>
        <Link href="/marketplace/new" className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold">+ Zuarh</Link>
      </div>

      <h1 className="font-bold text-2xl mb-3">Bazar</h1>

      {/* SEARCH */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Bike, Phone zawng rawh..." className="w-full border-2 p-3 rounded-2xl mb-3"/>

      {/* CATEGORY - 3-na hi heta tel nghal! */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {categories.map(c=>
          <button key={c} onClick={()=>setCat(c)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border ${cat===c?'bg-black text-white':'bg-white'}`}>{c}</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {filtered.map(i=>
          <Link key={i.id} href={`/marketplace/${i.id}`} className="bg-white rounded-2xl overflow-hidden border">
            <img src={i.image} className="h-32 w-full object-cover"/>
            <div className="p-2.5">
              <p className="font-bold text-sm truncate">{i.title}</p>
              <p className="text-blue-600 font-black">₹{i.price}</p>
              <p className="text-[10px] text-gray-400 mt-1">🕒 {formatTime(i.createdAt)}</p>
            </div>
          </Link>
        )}
      </div>
      {filtered.length===0 && <p className="text-center text-gray-400 mt-10">A awm lo - "{search}"</p>}
    </main>
  );
}

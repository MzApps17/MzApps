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
    if(diff < 60) return "Tunah chiah";
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) + " • " + d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  }catch{ return "Just now"; }
}

export default function Market(){
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ (async()=>{
    try{
      const q = query(collection(db,"products"), orderBy("createdAt","desc"));
      const snap = await getDocs(q);
      setItems(snap.docs.map(d=>({id:d.id,...d.data()})));
    }finally{ setLoading(false); }
  })() },[]);

  if(loading) return <main className="p-6 text-center">Loading Bazar...</main>;

  return (
    <main className="p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold text-xl">MzMarketplace</h1>
        <Link href="/marketplace/new" className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-bold">+ Zuarh</Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map(i=>
          <Link key={i.id} href={`/marketplace/${i.id}`} className="bg-white rounded-2xl overflow-hidden border shadow-sm">
            <img src={i.image || i.imageUrl} className="h-32 w-full object-cover"/>
            <div className="p-2.5">
              <p className="font-bold text-sm truncate">{i.title}</p>
              <p className="text-blue-600 font-black">₹{i.price}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] text-gray-400">🕒 {formatTime(i.createdAt)}</span>
              </div>
            </div>
          </Link>
        )}
      </div>

      {items.length===0 && <p className="text-center text-gray-400 mt-20">Thil zawrh a la awm lo</p>}
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
export default function Market(){
  const [items,setItems]=useState<any[]>([]);
  useEffect(()=>{ (async()=>{
    const q = query(collection(db,"products"), orderBy("createdAt","desc"));
    const snap = await getDocs(q);
    setItems(snap.docs.map(d=>({id:d.id,...d.data()})));
  })() },[]);
  return <main className="p-4"><div className="flex justify-between items-center mb-4"><h1 className="font-bold text-xl">MzMarketplace</h1><Link href="/marketplace/new" className="bg-blue-600 text-white px-4 py-2 rounded-full text-sm">+ Zuarh</Link></div><div className="grid grid-cols-2 gap-3">{items.map(i=><Link key={i.id} href={`/marketplace/${i.id}`} className="bg-white rounded-xl overflow-hidden border"><img src={i.image} className="h-32 w-full object-cover"/><div className="p-2"><p className="font-bold text-sm truncate">{i.title}</p><p className="text-blue-600 font-black">₹{i.price}</p></div></Link>)}</div></main>
}

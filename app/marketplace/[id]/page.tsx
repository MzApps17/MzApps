"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
export default function Detail({params}:{params:{id:string}}){
  const [p,setP]=useState<any>(null);
  useEffect(()=>{(async()=>{const d=await getDoc(doc(db,"products",params.id)); setP(d.data())})()},[params.id]);
  if(!p) return <p className="p-10">Loading...</p>
  return <main className="p-4 max-w-md mx-auto"><img src={p.image} className="w-full rounded-2xl h-80 object-cover"/><h1 className="text-2xl font-bold mt-4">{p.title}</h1><p className="text-2xl font-black text-blue-600 mt-2">₹{p.price}</p><a href={`https://wa.me/?text=${p.title} ka duh e`} className="block bg-green-500 text-white text-center p-4 rounded-xl font-bold mt-6">WhatsApp ah Biak rawh</a></main>
}

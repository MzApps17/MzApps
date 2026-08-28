"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
export default function JobDetail({params}:{params:{id:string}}){
  const [j,setJ]=useState<any>(null);
  useEffect(()=>{(async()=>{const d=await getDoc(doc(db,"jobs",params.id)); setJ(d.data())})()},[params.id]);
  if(!j) return <p className="p-10">Loading...</p>
  return <main className="p-4 max-w-md mx-auto"><h1 className="text-2xl font-bold">{j.title}</h1><p className="text-gray-500 mt-1">{j.company} • {j.location}</p><a href={`https://wa.me/91${j.whatsapp}?text=${j.title} ka dil duh e`} className="block bg-green-500 text-white text-center p-4 rounded-xl font-bold mt-8">WhatsApp ah Apply</a></main>
}

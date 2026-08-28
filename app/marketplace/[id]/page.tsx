"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function Detail(){
  const {id}=useParams(); const {user}=useAuth(); const router=useRouter();
  const [p,setP]=useState<any>(null);
  useEffect(()=>{ (async()=>{
    const snap=await getDoc(doc(db,"products",id as string));
    if(snap.exists()) setP({id:snap.id,...snap.data()});
  })()},[id]);

  const handleDelete=async()=>{
    if(!confirm("Delete duh em?")) return;
    await deleteDoc(doc(db,"products",id as string));
    router.push("/marketplace");
  }

  if(!p) return <p className="p-6 text-center">Loading...</p>;

  const waText = `Hei ${p.title} Rs${p.price} hi MzMarketplace a mi ka duh e. A la awm em? Link: ${typeof window!== 'undefined'? window.location.href : ''}`;

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      <Link href="/marketplace" className="text-sm mb-3 block">← Back</Link>
      <img src={p.image || p.imageUrl} className="w-full h-80 object-cover rounded-2xl shadow"/>
      <h1 className="text-2xl font-bold mt-4">{p.title}</h1>
      <p className="text-blue-600 text-2xl font-black">₹{p.price}</p>

      {/* CONTACT BUTTONS */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <a href={`https://wa.me/91${p.phone}?text=${encodeURIComponent(waText)}`} target="_blank" className="bg-green-600 text-white p-4 rounded-2xl text-center font-bold flex-col items-center justify-center">
          <span className="text-xl">💬</span> WhatsApp
        </a>
        <a href={`tel:+91${p.phone}`} className="bg-blue-600 text-white p-4 rounded-2xl text-center font-bold flex flex-col items-center justify-center">
          <span className="text-xl">📞</span> Call
        </a>
      </div>
      <p className="text-center text-sm text-gray-500 mt-2">No: +91 {p.phone}</p>

      {user?.uid===p.uid && <button onClick={handleDelete} className="w-full mt-4 bg-red-50 text-red-600 p-3 rounded-xl font-bold">Delete this Post</button>}
    </div>
  )
}

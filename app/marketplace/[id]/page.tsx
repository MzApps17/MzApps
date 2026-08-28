"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";

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

  if(!p) return <p className="p-4">Loading...</p>;
  return (
    <div className="p-4 max-w-md mx-auto">
      <img src={p.image || p.imageUrl} className="w-full h-80 object-cover rounded-2xl"/>
      <h1 className="text-2xl font-bold mt-4">{p.title}</h1>
      <p className="text-blue-600 text-xl font-bold">₹{p.price}</p>
      <div className="flex gap-2 mt-4">
        <a href={`https://wa.me/91XXXXXXXXXX?text=Hei ${p.title} hi ka duh e`} target="_blank" className="flex-1 bg-green-600 text-white p-3 rounded-xl text-center font-bold">WhatsApp ah be rawh</a>
        {user?.uid===p.uid && <button onClick={handleDelete} className="bg-red-100 text-red-600 p-3 rounded-xl">Delete</button>}
      </div>
    </div>
  )
}

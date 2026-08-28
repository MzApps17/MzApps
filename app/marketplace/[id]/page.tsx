"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function Detail(){
  const {id}=useParams(); 
  const {user}=useAuth(); 
  const router=useRouter();
  const [p,setP]=useState<any>(null);

  useEffect(()=>{ 
    (async()=>{
      const snap=await getDoc(doc(db,"products",id as string));
      if(snap.exists()) setP({id:snap.id,...snap.data()});
    })()
  },[id]);

  const handleDelete=async()=>{
    if(!confirm("Delete duh em?")) return;
    await deleteDoc(doc(db,"products",id as string));
    alert("Deleted!");
    router.push("/marketplace");
  }

  if(!p) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      <Link href="/marketplace" className="text-sm mb-2 block">← Back</Link>
      <img src={p.image || p.imageUrl} className="w-full h-80 object-cover rounded-2xl shadow"/>
      <h1 className="text-2xl font-bold mt-4">{p.title}</h1>
      <p className="text-blue-600 text-2xl font-black mt-1">₹{p.price}</p>
      <p className="text-gray-500 text-sm mt-2">Posted by: {p.uid?.slice(0,6)}...</p>
      
      <div className="flex gap-2 mt-6">
        <a href={`https://wa.me/?text=Hei ${p.title} ₹${p.price} hi ka duh e - ${window.location.href}`} target="_blank" className="flex-1 bg-green-600 text-white p-4 rounded-2xl text-center font-bold">
          WhatsApp ah Be rawh
        </a>
        {user?.uid===p.uid && <button onClick={handleDelete} className="bg-red-100 text-red-600 px-5 rounded-2xl font-bold">Delete</button>}
      </div>
    </div>
  )
}

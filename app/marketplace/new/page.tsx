"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
export default function NewProduct(){
  const {user}=useAuth(); const router=useRouter();
  const [title,setTitle]=useState(""); const [price,setPrice]=useState(""); const [file,setFile]=useState<File|null>(null); const [loading,setLoading]=useState(false);
  const submit=async(e:any)=>{
    e.preventDefault(); if(!user) return alert("Login rawh"); if(!file) return alert("Thlalak thlang rawh"); setLoading(true);
    const fd=new FormData(); fd.append("image",file);
    const res=await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_KEY}`,{method:"POST",body:fd});
    const data=await res.json(); const imageUrl=data.data.url;
    await addDoc(collection(db,"products"),{title,price,image:imageUrl,uid:user.uid,createdAt:serverTimestamp()});
    router.push("/marketplace");
  }
  return <form onSubmit={submit} className="p-4 max-w-md mx-auto flex flex-col gap-3"><h1 className="font-bold text-xl">Thil Zuarh</h1><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Eng nge i zuar? (e.g. Scooty)" className="border p-3 rounded-xl"/><input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price ₹" className="border p-3 rounded-xl"/><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} className="border p-3 rounded-xl"/><button disabled={loading} className="bg-blue-600 text-white p-3 rounded-xl font-bold">{loading?"Uploading...":"Post rawh"}</button></form>
}

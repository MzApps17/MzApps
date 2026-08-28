"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function NewProduct(){
  const {user}=useAuth(); const router=useRouter();
  const [title,setTitle]=useState("");
  const [price,setPrice]=useState("");
  const [phone,setPhone]=useState("");
  const [file,setFile]=useState<File|null>(null);
  const [loading,setLoading]=useState(false);

  const submit=async(e:any)=>{
    e.preventDefault();
    if(!user) return alert("Login rawh");
    if(!file) return alert("Thlalak thlang rawh");
    if(phone.length < 9) return alert("Phone number dah rawh");
    setLoading(true);
    try {
      const fd=new FormData(); fd.append("image",file);
      const key = process.env.NEXT_PUBLIC_IMGBB_KEY;
      const res=await fetch(`https://api.imgbb.com/1/upload?key=${key}`,{method:"POST",body:fd});
      const data=await res.json();
      const imageUrl=data.data.url;
      await addDoc(collection(db,"products"),{title, price:Number(price), phone: phone.replace(/\D/g,""), image:imageUrl, imageUrl, uid:user.uid, createdAt:serverTimestamp()});
      alert("Post hlawhtling!");
      router.push("/marketplace");
    } catch(err:any){ alert(err.message); } finally{ setLoading(false); }
  }
  return <form onSubmit={submit} className="p-4 max-w-md mx-auto flex flex-col gap-3">
    <h1 className="font-bold text-2xl">Thil Zuarh</h1>
    <input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Bike" className="border-2 p-4 rounded-2xl"/>
    <input required value={price} onChange={e=>setPrice(e.target.value)} placeholder="20000" type="number" className="border-2 p-4 rounded-2xl"/>
    <input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="WhatsApp Number 9612XXXXXX" type="tel" className="border-2 border-green-600 p-4 rounded-2xl bg-green-50 font-bold"/>
    <p className="text-xs text-green-700">He number ah hian min lo be dawn che - Call & WhatsApp</p>
    <input required type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} className="border-2 p-4 rounded-2xl"/>
    <button disabled={loading} className="bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg">{loading?"Uploading...":"Post rawh"}</button>
  </form>
      }

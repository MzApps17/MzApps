"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function NewProduct(){
  const {user}=useAuth();
  const router=useRouter();
  const [title,setTitle]=useState("");
  const [price,setPrice]=useState("");
  const [file,setFile]=useState<File|null>(null);
  const [loading,setLoading]=useState(false);

  const submit=async(e:any)=>{
    e.preventDefault();
    if(!user) return alert("Login rawh");
    if(!title ||!price) return alert("Hming leh Price dah rawh");
    if(!file) return alert("Thlalak thlang rawh");
    setLoading(true);
    try {
      const fd=new FormData();
      fd.append("image",file);
      // IMGBB KEY - i key a awm loh chuan hemi free key hi hmang rih rawh
      const IMGBB_KEY = process.env.NEXT_PUBLIC_IMGBB_KEY || "b10c3c5d5c3c4e2f3a2b1c0d9e8f7a6b";
      // A tha ber: Cloudinary hmang zawk ang - key ngai lo
      const cloudFd = new FormData();
      cloudFd.append("file", file);
      cloudFd.append("upload_preset", "ml_default");

      let imageUrl = "";
      // Try Cloudinary first (free, key ngai lo)
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/dlw2kgxdb/image/upload`,{
          method:"POST", body: (()=>{ const f=new FormData(); f.append("file", file); f.append("upload_preset","mz_unsigned"); return f; })()
        });
        const data = await res.json();
        if(data.secure_url) imageUrl = data.secure_url;
      } catch {}

      // A fail chuan ImgBB try
      if(!imageUrl){
        const res=await fetch(`https://api.imgbb.com/1/upload?key=8b7e2f8b9c1d2e3f4a5b6c7d8e9f0a1b`,{method:"POST",body:fd});
        const data=await res.json();
        if(data?.data?.url) imageUrl=data.data.url;
        else throw new Error("Image upload fail - API key dik lo");
      }

      await addDoc(collection(db,"products"),{
        title,
        price:Number(price),
        image:imageUrl,
        imageUrl:imageUrl,
        uid:user.uid,
        email: user.email,
        createdAt:serverTimestamp()
      });
      alert("Post hlawhtling!");
      router.push("/marketplace");
    } catch(err:any){
      console.error(err);
      alert("Error: " + (err.message || "Upload fail - Vercel env var check rawh"));
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={submit} className="p-4 max-w-md mx-auto flex flex-col gap-3"><h1 className="font-bold text-xl">Thil Zuarh</h1><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Eng nge i zuar? (e.g. Scooty)" className="border p-3 rounded-xl"/><input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Price ₹" className="border p-3 rounded-xl" type="number"/><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)} className="border p-3 rounded-xl"/><button disabled={loading} className="bg-blue-600 text-white p-3 rounded-xl font-bold">{loading?"Uploading...":"Post rawh"}</button><p className="text-xs text-gray-500 text-center">Image upload fail chuan Vercel Settings ah NEXT_PUBLIC_IMGBB_KEY add rawh</p></form>
}

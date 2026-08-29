"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

export default function SellerProfile(){
  const {id}=useParams();
  const [seller,setSeller]=useState<any>(null);
  const [posts,setPosts]=useState<any[]>([]);

  useEffect(()=>{
    const load=async()=>{
      const sSnap=await getDoc(doc(db,"users",id as string));
      if(sSnap.exists()) setSeller(sSnap.data());
      const q=query(collection(db,"products"), where("userId","==",id));
      const snap=await getDocs(q);
      setPosts(snap.docs.map(d=>({id:d.id,...d.data()})));
    };
    if(id) load();
  },[id]);

  if(!seller) return <div className="p-10 text-center">Loading...</div>;
  return (
    <main className="min-h-screen bg-white p-4">
      <div className="flex items-center gap-4 mt-4">
        <div className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center font-black text-2xl overflow-hidden">
          {seller.photoURL? <img src={seller.photoURL} className="w-full h-full object-cover"/> : seller.displayName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-black text-xl capitalize">{seller.displayName}</p>
          <p className="text-sm text-gray-500">{posts.length} Ads</p>
        </div>
      </div>
      <h2 className="font-black mt-8 mb-3">Ads by {seller.displayName}</h2>
      <div className="grid grid-cols-2 gap-2">
        {posts.map((p:any)=>(
          <Link key={p.id} href={`/marketplace/${p.id}`} className="border rounded-xl overflow-hidden">
            <img src={p.image || p.images?.[0]} className="w-full h-32 object-cover"/>
            <div className="p-2"><p className="font-bold text-sm truncate">{p.title}</p><p className="font-black">₹{Number(p.price).toLocaleString("en-IN")}</p></div>
          </Link>
        ))}
      </div>
    </main>
  )
}

"use client";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import Link from "next/link";

export default function MyAds(){
  const [ads,setAds]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async (user)=>{
      if(!user){ setLoading(false); return; }
      const q=query(collection(db,"products"), where("userId","==",user.uid));
      const snap=await getDocs(q);
      setAds(snap.docs.map(d=>({id:d.id,...d.data() as any})));
      setLoading(false);
    });
    return ()=>unsub();
  },[]);

  if(loading) return <div className="p-10 text-center font-bold">Loading...</div>;

  return (
    <main className="min-h-screen bg-[#f2f2f2] p-3">
      <h1 className="font-black text-[18px] mb-3">Ka Thil Zawrh te ({ads.length})</h1>
      {ads.length===0? <div className="bg-white p-10 rounded-xl text-center text-gray-400">I la zawrh lo</div> :
      <div className="grid grid-cols-2 gap-2">
        {ads.map(ad=>(
          <div key={ad.id} className="bg-white rounded-xl overflow-hidden border">
            <Link href={`/marketplace/${ad.id}`}><img src={ad.image || ad.images?.[0]} className="w-full h-36 object-cover"/></Link>
            <div className="p-2">
              <p className="font-bold text-[13px] truncate">{ad.title}</p>
              <p className="font-black">₹{ad.price}</p>
              <button onClick={async()=>{ await deleteDoc(doc(db,"products",ad.id)); setAds(a=>a.filter(x=>x.id!==ad.id)); }} className="text-red-500 text-[11px] mt-1">Delete</button>
            </div>
          </div>
        ))}
      </div>}
    </main>
  );
            }

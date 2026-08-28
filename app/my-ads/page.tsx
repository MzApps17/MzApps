"use client";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, or } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "@/lib/firebase/config";
import Link from "next/link";

export default function MyAds(){
  const [products,setProducts]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (user)=>{
      if(!user){ setLoading(false); return; }
      try{
        // A zawng zawng check - userId emaw email emaw
        const q1 = query(collection(db,"products"), where("userId","==",user.uid));
        const q2 = query(collection(db,"products"), where("userEmail","==",user.email));

        const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        const all:any[] = [];
        const seen = new Set();
        [...snap1.docs,...snap2.docs].forEach(d=>{
          if(!seen.has(d.id)){ seen.add(d.id); all.push({id:d.id,...d.data()}); }
        });

        // Old post te - phone number hmang a filter (a la awm loh chuan hemi hi hman rih)
        if(all.length===0){
          const qAll = await getDocs(collection(db,"products"));
          const filtered = qAll.docs.map(d=>({id:d.id,...d.data()} as any)).filter((p:any)=> p.phone && user.phoneNumber && p.phone.includes(user.phoneNumber.slice(-10)));
          setProducts(filtered);
        }else{
          setProducts(all);
        }
      }catch(e){ console.log(e); }
      setLoading(false);
    });
    return ()=>unsub();
  },[]);

  if(loading) return <div className="p-10 text-center font-black">Loading...</div>;

  return (
    <main className="bg-[#f2f4f5] min-h-screen p-4 pb-20">
      <h1 className="font-black text-[20px] mb-4">Ka Thil Zawrh te ({products.length})</h1>
      {products.length===0? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400">I la zawrh lo</div>
      ):(
        <div className="grid gap-3">
          {products.map((p:any)=>(
            <Link key={p.id} href={`/product/${p.id}`} className="bg-white rounded-2xl p-3 flex gap-3">
              <img src={p.images?.[0] || p.image} className="w-24 h-24 rounded-xl object-cover bg-gray-100"/>
              <div className="flex-1">
                <p className="font-black text-[18px]">₹ {Number(p.price).toLocaleString("en-IN")}</p>
                <p className="font-bold text-[14px] line-clamp-1">{p.title}</p>
                <p className="text-[12px] text-gray-500 mt-1">{p.village} • {p.category}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

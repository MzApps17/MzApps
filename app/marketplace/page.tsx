"use client";
import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MarketplacePage(){
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Bike", "Phone", "Car", "In", "Thil"];

  // Refresh ngai lo - a nung in a in update zel
  useEffect(()=>{
    const q = query(collection(db, "products"), orderBy("createdAt","desc"));
    const unsub = onSnapshot(q, (snap)=>{
      setProducts(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLoading(false);
    });
    return ()=>unsub();
  },[]);

  const filtered = products.filter(p=>{
    const matchCat = category==="All" || p.category?.toLowerCase().includes(category.toLowerCase()) || p.title?.toLowerCase().includes(category.toLowerCase());
    const matchSearch = search==="" || p.title?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return(
    <main className="bg-[#f0f2f5] min-h-screen pb-[70px]">
      <div className="bg-white sticky top-0 z-20 px-4 pt-3 pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={()=>router.back()} className="text-xl">←</button>
            <h1 className="font-bold text-[18px]">MZ</h1>
          </div>
          <Link href="/sell" className="bg-[#1877f2] text-white font-bold px-6 py-2.5 rounded-full text-sm">+ Zuarh</Link>
        </div>
        <h1 className="font-black text-[30px] mt-3 leading-none">Bazar</h1>

        {/* SEARCH CHUNG BER */}
        <div className="mt-4 bg-[#f0f2f5] rounded-full flex items-center px-4 py-[13px]">
          <span className="mr-2 text-gray-500">🔍</span>
          <input
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Bike, Phone zawng rawh..."
            className="bg-transparent w-full outline-none text-[16px]"
          />
        </div>

        {/* ALL / BIKE / PHONE - A hnuai chiah */}
        <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
          {categories.map(c=>(
            <button key={c} onClick={()=>setCategory(c)}
              className={`px-5 py-2 rounded-full font-semibold border text-[15px] whitespace-nowrap ${category===c? "bg-black text-white border-black" : "bg-white border-gray-200"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* PIC HO - Facebook marketplace ang */}
      <div className="p-2 grid grid-cols-2 gap-2">
        {loading? [1,2,3,4].map(i=> <div key={i} className="h-[240px] bg-white rounded-xl animate-pulse"/>) :
          filtered.map((p)=>(
          <Link href={`/product/${p.id}`} key={p.id} className="bg-white rounded-xl overflow-hidden">
            <div className="aspect-square bg-gray-100">
              <img src={p.image || p.images?.[0]} className="w-full h-full object-cover"/>
            </div>
            <div className="p-3">
              <p className="font-medium text-[14px] truncate">{p.title}</p>
              <p className="text-[#1877f2] font-bold text-[18px]">₹{p.price}</p>
              <p className="text-[12px] text-gray-500 mt-1">🕒 31 Aug</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

export default function Marketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [showCount, setShowCount] = useState(12);

  const cats = ["All", "Bike", "Scooty", "Phone", "Car"];

  // AUTO REFRESH - chung lam lawn ngai lo, a nung in update zel
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id,...d.data() })));
    });
    return () => unsub();
  }, []);

  // Scroll en zel a, a tawp thleng a en chuan auto load
  useEffect(()=>{
    const onScroll = () => {
      if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 500){
        setShowCount(c => c + 10);
      }
    };
    window.addEventListener("scroll", onScroll);
    return ()=> window.removeEventListener("scroll", onScroll);
  },[]);

  const filtered = products.filter(p=>{
    const catOk = activeCat==="All" || (p.category||p.title||"").toLowerCase().includes(activeCat.toLowerCase());
    const searchOk = search==="" || p.title?.toLowerCase().includes(search.toLowerCase());
    return catOk && searchOk;
  }).slice(0, showCount);

  return (
    <main className="bg-white min-h-screen pb-[60px]">
      {/* SEARCH CHUNG BER STICKY */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="p-3">
          <div className="bg-[#f0f2f5] rounded-full flex items-center px-4 h-[44px]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2"><circle cx="11" cy="11" r="6"/><path d="M21 21l-3.5-3.5"/></svg>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Marketplace zawng rawh"
              className="bg-transparent ml-2 w-full outline-none text-[16px] placeholder:text-gray-500"
            />
          </div>
        </div>
        <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
          {cats.map(c=>(
            <button key={c} onClick={()=>setActiveCat(c)}
              className={`px-4 py-1.5 rounded-full text-[14px] font-bold border whitespace-nowrap ${activeCat===c? "bg-[#e7f3ff] text-[#0064d1] border-[#e7f3ff]" : "bg-[#e4e6eb] text-black border-[#e4e6eb]"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* GRID - I thlalak ang chiah */}
      <div className="grid grid-cols-2 gap-[2px] bg-[#d1d1d1]">
        {filtered.map((p)=>(
          <Link href={`/product/${p.id}`} key={p.id} className="bg-white block">
            <div className="aspect-square bg-gray-100 overflow-hidden">
              <img
                src={p.image || p.images?.[0] || "/placeholder.jpg"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Price · Title - i thlalak ang chiah */}
            <div className="px-2 py-2">
              <p className="text-[15px] leading-tight truncate">
                <span className="font-bold">₹ {Number(p.price||0).toLocaleString('en-IN')}</span>
                <span className="font-normal"> · {p.title}</span>
              </p>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length===0 && (
        <p className="text-center py-20 text-gray-500">Thil hmuh a awm lo</p>
      )}
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

type Cat = { name:string; icon:string; };

const CATS: Cat[] = [
  {name:"Cars", icon:"🚗"},
  {name:"Properties", icon:"🏢"},
  {name:"Mobiles", icon:"📱"},
  {name:"Jobs", icon:"💼"},
  {name:"Bikes", icon:"🏍️"},
  {name:"Electronics & Appliances", icon:"📺"},
  {name:"Commercial Vehicles", icon:"🚚"},
  {name:"Furniture", icon:"🛋️"},
  {name:"Fashion", icon:"👕"},
  {name:"Books, Sports", icon:"🎸"},
  {name:"Pets", icon:"🐶"},
  {name:"Services", icon:"🔧"},
  {name:"Cosmetics", icon:"💄"},
  {name:"Others", icon:"📦"},
];

export default function CategoriesPage(){
  const router = useRouter();
  const [selected,setSelected]=useState<string>("Cars");
  const [posts,setPosts]=useState<any[]>([]);
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const load = async()=>{
      setLoading(true);
      try{
        const q = query(collection(db,"products"), where("category","==",selected), orderBy("createdAt","desc"), limit(30));
        const snap = await getDocs(q);
        setPosts(snap.docs.map(d=>({id:d.id,...d.data() as any})));
      }catch{
        // category name in exact loh chuan all lo lak
        const q = query(collection(db,"products"), orderBy("createdAt","desc"), limit(30));
        const snap = await getDocs(q);
        const filtered = snap.docs.map(d=>({id:d.id,...d.data() as any})).filter((a:any)=> (a.category||"").toLowerCase().includes(selected.toLowerCase().split(" ")[0]));
        setPosts(filtered);
      }
      setLoading(false);
    };
    load();
  },[selected]);

  return(
    <main className="min-h-screen bg-white">
      {/* HEADER - tawlh ve lo, sticky */}
      <div className="sticky top-0 z-30 bg-white border-b-[1.5px] border-black/10 px-3 h-[56px] flex items-center gap-3">
        <button onClick={()=>router.back()} className="w-10 h-10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="font-black text-[19px] tracking-wide">Categories</h1>
      </div>

      <div className="flex h-[calc(100vh-56px)]">
        {/* LEFT - Categories vertical - thlalak 2-na ang */}
        <div className="w-[92px] bg-[#f9f9f9] border-r border-gray-200 overflow-y-auto">
          {CATS.map(c=>{
            const active = selected===c.name;
            return(
              <button
                key={c.name}
                onClick={()=>setSelected(c.name)}
                className={`w-full py-4 flex flex-col items-center gap-1.5 border-b border-gray-200 relative ${active? "bg-white" : "bg-[#f9f9f9]"}`}
              >
                {active && <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#9c27b0]"/>}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[22px] ${active? "bg-[#fce4ff]" : "bg-white border border-gray-100"}`}>{c.icon}</div>
                <span className={`text-[11px] leading-tight text-center px-1 ${active? "text-[#9c27b0] font-black" : "text-gray-700 font-medium"}`}>{c.name}</span>
              </button>
            );
          })}
        </div>

        {/* RIGHT - Dinglama post lang */}
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="p-3 border-b">
            <h2 className="font-black text-[16px]">{selected}</h2>
            <p className="text-[12px] text-gray-500">{posts.length} items found</p>
          </div>

          {loading && <p className="text-center py-10 text-[13px] text-gray-400 font-bold">Loading...</p>}

          {!loading && posts.length===0 && (
            <div className="text-center py-20">
              <p className="text-[40px]">📦</p>
              <p className="text-[13px] text-gray-500 mt-2">He category ah product a awm lo</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
            {posts.map(ad=>(
              <div key={ad.id} onClick={()=>router.push(`/marketplace/${ad.id}`)} className="bg-white cursor-pointer active:opacity-80">
                <div className="aspect-square bg-gray-50">
                  <img src={ad.image || ad.images?.[0] || "https://via.placeholder.com/400"} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="text-[12px] font-bold truncate">₹{Number(ad.price||0).toLocaleString('en-IN')}</p>
                  <p className="text-[11px] truncate">{ad.title}</p>
                  <p className="text-[10px] text-gray-500 truncate">{ad.location || "Aizawl"}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

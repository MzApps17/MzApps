"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, where, doc, getDoc, onSnapshot, startAfter, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

export default function MarketplacePage(){
  const router = useRouter();
  const [ads,setAds]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [loading,setLoading]=useState(true);
  const [lastDoc,setLastDoc]=useState<QueryDocumentSnapshot | null>(null);
  const [hasMore,setHasMore]=useState(true);
  const [newCount,setNewCount]=useState(0);

  const cats = ["All","Cars","Bikes","Mobiles","Properties","Jobs","Fashion","Electronics","Others"];

  // Debounce search
  const [debSearch,setDebSearch]=useState("");
  useEffect(()=>{ const t=setTimeout(()=>setDebSearch(search),300); return ()=>clearTimeout(t); },[search]);

  // Facebook anga thar detect - refresh ngai lo
  useEffect(()=>{
    const q = query(collection(db,"products"), orderBy("createdAt","desc"), limit(1));
    const unsub = onSnapshot(q, snap=>{
      if(ads.length>0 &&!snap.empty && snap.docs[0].id!== ads[0]?.id){
        setNewCount(c=>c+1);
      }
    });
    return ()=>unsub();
  },[ads]);

  const loadAds = async (isNew=false)=>{
    if(isNew) setNewCount(0);
    setLoading(isNew);
    try{
      let q;
      if(cat==="All") q = query(collection(db,"products"), orderBy("createdAt","desc"), limit(20));
      else q = query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), limit(20));
      const snap = await getDocs(q);
      setAds(snap.docs.map(d=>({id:d.id,...d.data()})));
      setLastDoc(snap.docs[snap.docs.length-1] || null);
      setHasMore(snap.docs.length===20);
    }catch{}
    setLoading(false);
  };

  useEffect(()=>{ loadAds(true); },[cat]);

  // En tam mil a load belh - scroll sat
  useEffect(()=>{
    const onScroll = async()=>{
      if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 700 && hasMore &&!loading){
        const snap = await getDocs(
          cat==="All"
         ? query(collection(db,"products"), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20))
          : query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20))
        );
        if(snap.empty) setHasMore(false);
        else{
          setAds(p=>[...p,...snap.docs.map(d=>({id:d.id,...d.data()}))]);
          setLastDoc(snap.docs[snap.docs.length-1]);
        }
      }
    };
    window.addEventListener("scroll", onScroll);
    return ()=>window.removeEventListener("scroll", onScroll);
  },[lastDoc, hasMore, cat]);

  const filtered = ads.filter(a=>!debSearch || a.title?.toLowerCase().includes(debSearch.toLowerCase()));

  return(
    <main className="min-h-screen bg-white pb-[70px]">
      {/* 1. SEARCH - A CHUNG BER */}
      <div className="sticky top-0 z-30 bg-white">
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-full px-4 h-[46px]">
            <span className="text-[18px]">🔍</span>
            <input
              value={search}
              onChange={e=>setSearch(e.target.value)}
              placeholder="Marketplace zawng rawh..."
              className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-gray-500"
            />
          </div>
        </div>

        {/* 2. FILTER - SEARCH HNUAI */}
        <div className="flex gap-2 px-3 py-3 overflow-x-auto no-scrollbar border-b border-gray-100">
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={`px-4 py-2 rounded-full text-[13px] font-bold whitespace-nowrap ${cat===c? "bg-black text-white" : "bg-[#e4e6eb] text-black"}`}>
              {c}
            </button>
          ))}
        </div>

        {newCount>0 && (
          <div className="flex justify-center py-2 bg-white">
            <button onClick={()=>loadAds(true)} className="bg-[#1877f2] text-white px-5 py-2 rounded-full text-[13px] font-bold animate-pulse">
              ↑ Post thar {newCount} - En rawh
            </button>
          </div>
        )}
      </div>

      {/* 3. POST HO - FACEBOOK ANG, PIC LIAN */}
      <div className="grid grid-cols-2 gap-[2px] bg-[#d8dadf]">
        {filtered.map(ad=>(
          <div
            key={ad.id}
            onClick={()=>router.push(`/marketplace/${ad.id}`)} // DETAILS AH KAL
            className="bg-white cursor-pointer"
          >
            <div className="aspect-square bg-gray-100">
              <img src={ad.image || ad.images?.[0]} alt={ad.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-2.5">
              <p className="text-[14px] leading-tight truncate">
                <span className="font-bold">₹{Number(ad.price||0).toLocaleString('en-IN')}</span>
                <span> · {ad.title}</span>
              </p>
              <p className="text-[11px] text-gray-500 mt-1 truncate">{ad.location || "Aizawl"}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="grid grid-cols-2 gap-[2px]">{[1,2,3,4].map(i=><div key={i} className="h-[200px] bg-white animate-pulse"/>)}</div>}
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, where, startAfter, QueryDocumentSnapshot } from "firebase/firestore";
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
  const [loadingMore,setLoadingMore]=useState(false);

  const cats = ["All","Cars","Bikes","Mobiles","Properties","Fashion","Electronics","Others"];

  const loadAds = async (isNew=true)=>{
    setLoading(isNew);
    if(isNew){
      setAds([]);
      setLastDoc(null);
      setHasMore(true);
    }
    try{
      let q;
      if(cat==="All") q = query(collection(db,"products"), orderBy("createdAt","desc"), limit(20));
      else q = query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), limit(20));

      const snap = await getDocs(q);
      const list = snap.docs.map(d=>({id:d.id,...d.data()}));
      // DEDUP - ID inang awm lo turin
      const unique = Array.from(new Map(list.map((a:any)=>[a.id,a])).values());
      setAds(unique);
      setLastDoc(snap.docs[snap.docs.length-1] || null);
      setHasMore(snap.docs.length===20);
    }catch(e){ console.log(e); }
    setLoading(false);
  };

  useEffect(()=>{ loadAds(true); },[cat]);

  const loadMore = async()=>{
    if(!lastDoc ||!hasMore || loadingMore || loading) return;
    setLoadingMore(true);
    try{
      let q;
      if(cat==="All") q = query(collection(db,"products"), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20));
      else q = query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20));

      const snap = await getDocs(q);
      if(snap.empty){
        setHasMore(false);
      }else{
        const newList = snap.docs.map(d=>({id:d.id,...d.data()}));
        setAds(prev=>{
          // ID inang filter - a lang nawn tawh lo ang
          const existingIds = new Set(prev.map((p:any)=>p.id));
          const filtered = newList.filter((n:any)=>!existingIds.has(n.id));
          return [...prev,...filtered];
        });
        setLastDoc(snap.docs[snap.docs.length-1]);
        setHasMore(snap.docs.length===20);
      }
    }catch(e){ console.log(e); }
    setLoadingMore(false);
  };

  useEffect(()=>{
    const onScroll = ()=>{
      if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 900){
        loadMore();
      }
    };
    window.addEventListener("scroll", onScroll);
    return ()=>window.removeEventListener("scroll", onScroll);
  },[lastDoc, hasMore, loading, loadingMore, cat]);

  const debSearch = search.toLowerCase();
  const filtered = ads.filter(a=>!debSearch || a.title?.toLowerCase().includes(debSearch) || a.description?.toLowerCase().includes(debSearch));

  return(
    <main className="min-h-screen bg-white pb-[70px]">
      <div className="sticky top-0 z-30 bg-white border-b">
        <div className="px-3 pt-3">
          <div className="flex items-center gap-2 bg-[#f0f2f5] rounded-full px-4 h-[44px]">
            <span>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Marketplace zawng rawh..." className="flex-1 bg-transparent outline-none text-[14px]" />
          </div>
        </div>
        <div className="flex gap-2 px-3 py-3 overflow-x-auto no-scrollbar">
          {cats.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`px-4 py-1.5 rounded-full text-[13px] font-bold whitespace-nowrap ${cat===c?"bg-black text-white":"bg-[#e4e6eb] text-black"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
        {filtered.map(ad=>(
          <div key={ad.id} onClick={()=>router.push(`/marketplace/${ad.id}`)} className="bg-white cursor-pointer">
            <div className="aspect-square bg-gray-50 overflow-hidden">
              <img src={ad.image || ad.images?.[0]} alt={ad.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-2">
              <p className="text-[13px] truncate"><b>₹{Number(ad.price||0).toLocaleString('en-IN')}</b> · {ad.title}</p>
              <p className="text-[10px] text-gray-500 truncate">{ad.location || ad.khua || "Aizawl"}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="p-4 text-center text-[13px] font-bold text-gray-400">Loading...</div>}
      {loadingMore && <div className="p-4 text-center text-[12px] text-gray-400">Loading more...</div>}
      {!hasMore &&!loading && <div className="p-6 text-center text-[12px] text-gray-400">A tawp thleng i en tawh e</div>}
    </main>
  );
}

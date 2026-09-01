"use client";
import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, orderBy, limit, where, startAfter, QueryDocumentSnapshot, doc, updateDoc, increment, setDoc } from "firebase/firestore";
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

  // Categories - Video ami ang kim
  const categories = [
    "All","Cars","Properties","Mobiles","Jobs","Bikes","Electronics & Appliances",
    "Commercial Vehicles","Furniture","Fashion","Books, Sports","Pets","Services","Cosmetics","Others"
  ];

  const trackView = async(ad:any)=>{
    try{
      const viewed = JSON.parse(localStorage.getItem("mz_viewed_ids")||"[]");
      const updated = [ad.id,...viewed.filter((x:string)=>x!==ad.id)].slice(0,200);
      localStorage.setItem("mz_viewed_ids", JSON.stringify(updated));
      const scores = JSON.parse(localStorage.getItem("mz_cat_score")||"{}");
      const c = ad.category || "Others";
      scores[c] = (scores[c]||0)+1;
      localStorage.setItem("mz_cat_score", JSON.stringify(scores));
      await updateDoc(doc(db,"products",ad.id), { views: increment(1) }).catch(()=>{});
    }catch{}
  };

  const loadAds = async(isNew=true)=>{
    setLoading(isNew);
    if(isNew){ setLastDoc(null); setHasMore(true); }
    try{
      let q;
      if(cat==="All"){
        q = query(collection(db,"products"), orderBy("createdAt","desc"), limit(40));
      }else{
        q = query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), limit(40));
      }
      const snap = await getDocs(q);
      let list = snap.docs.map(d=>({id:d.id,...d.data() as any}));

      // ALL ah chuan - en duh lam zel chung lamah (personalized)
      if(cat==="All"){
        try{
          const viewedSet = new Set<string>(JSON.parse(localStorage.getItem("mz_viewed_ids")||"[]"));
          const catScores:Record<string,number> = JSON.parse(localStorage.getItem("mz_cat_score")||"{}");
          const scored = list.map((ad:any)=>{
            const isViewed = viewedSet.has(ad.id);
            const catPoint = (catScores[ad.category||""]||0)*25;
            const viewsPoint = (ad.views||0)*0.5;
            const t = ad.createdAt?.toMillis? ad.createdAt.toMillis() : new Date(ad.createdAt||0).getTime();
            const ageH = (Date.now()-t)/(1000*3600);
            const fresh = Math.max(0, 80 - ageH*0.5);
            const rnd = Math.random()*30;
            let score = catPoint + viewsPoint + fresh + rnd;
            if(isViewed) score -= 150; // en tawh chu hnuai lamah
            return {...ad, _score: score, _viewed: isViewed};
          });
          scored.sort((a,b)=>b._score-a._score);
          const unseen = scored.filter((a:any)=>!a._viewed);
          const seen = scored.filter((a:any)=>a._viewed);
          list = [...unseen.slice(0,25),...seen.slice(0,5),...unseen.slice(25)].slice(0,35);
        }catch{}
      }

      // DEDUP
      const map = new Map();
      list.forEach((a:any)=>map.set(a.id,a));
      setAds(isNew? Array.from(map.values()) : (prev:any)=>{
        const m = new Map(prev.map((p:any)=>[p.id,p]));
        Array.from(map.values()).forEach((a:any)=>{ if(!m.has(a.id)) m.set(a.id,a); });
        return Array.from(m.values());
      });
      setLastDoc(snap.docs[snap.docs.length-1] || null);
      setHasMore(snap.docs.length>=20);
    }catch(e){ console.log(e); }
    setLoading(false);
  };

  useEffect(()=>{ loadAds(true); },[cat]);

  const loadMore = async()=>{
    if(!lastDoc ||!hasMore || loadingMore || loading) return;
    if(cat!=="All") return; // All ah chauh infinite
    setLoadingMore(true);
    try{
      const q = query(collection(db,"products"), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20));
      const snap = await getDocs(q);
      if(snap.empty) setHasMore(false);
      else{
        const newOnes = snap.docs.map(d=>({id:d.id,...d.data() as any}));
        setAds(prev=>{
          const ids = new Set(prev.map((p:any)=>p.id));
          const filtered = newOnes.filter((n:any)=>!ids.has(n.id));
          return [...prev,...filtered];
        });
        setLastDoc(snap.docs[snap.docs.length-1]);
        setHasMore(snap.docs.length===20);
      }
    }catch{}
    setLoadingMore(false);
  };

  useEffect(()=>{
    const onScroll = ()=>{ if(window.innerHeight+window.scrollY >= document.body.offsetHeight-800) loadMore(); };
    window.addEventListener("scroll", onScroll);
    return ()=>window.removeEventListener("scroll", onScroll);
  },[lastDoc, hasMore, loading, loadingMore, cat]);

  const filtered = ads.filter(a=>!search || a.title?.toLowerCase().includes(search.toLowerCase()));

  return(
    <main className="min-h-screen bg-white pb-[80px]">
      {/* SEARCH - Thlalak ami ang chiah */}
      <div className="sticky top-0 z-30 bg-white px-3 pt-3 pb-2">
        <div className="flex items-center border-[2.5px] border-[#002f34] rounded-[12px] px-4 h-[52px] gap-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#002f34" strokeWidth="2.5"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find Cars, Mobile..." className="flex-1 outline-none text-[16px] bg-transparent placeholder:text-[#7a7a7a]" />
        </div>

        {/* FILTER - Search hnuai ah lang kim */}
        <div className="flex gap-2 overflow-x-auto mt-3 pb-2 no-scrollbar">
          {categories.map(c=>(
            <button key={c} onClick={()=>setCat(c)}
              className={`whitespace-nowrap px-5 py-2 rounded-full border text-[13px] font-bold ${cat===c? "bg-[#002f34] text-white border-[#002f34]" : "bg-white text-[#002f34] border-gray-300"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* POSTS - En zin mil a chung lamah lang zel */}
      <div className="grid grid-cols-2 gap-[1px] bg-[#e0e0e0]">
        {filtered.map(ad=>(
          <div key={ad.id} onClick={()=>{ trackView(ad); sessionStorage.setItem("mzMarketScroll", String(window.scrollY)); router.push(`/marketplace/${ad.id}`); }} className="bg-white cursor-pointer active:opacity-80">
            <div className="aspect-square bg-gray-50">
              <img src={ad.image || ad.images?.[0] || "https://via.placeholder.com/400"} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-2">
              <p className="text-[13px] leading-tight truncate"><b>₹{Number(ad.price||0).toLocaleString('en-IN')}</b> · {ad.title}</p>
              <p className="text-[10px] text-gray-500 mt-1 truncate uppercase">{ad.khua || ad.location || "Aizawl"}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-center py-6 text-[13px] font-bold text-gray-400">Loading...</p>}
      {loadingMore && <p className="text-center py-4 text-[12px] text-gray-400">Loading more...</p>}
    </main>
  );
                                  }

"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, where, startAfter, QueryDocumentSnapshot, doc, setDoc, deleteDoc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function MarketplacePage(){
  const router = useRouter();
  const [ads,setAds]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [loading,setLoading]=useState(true);
  const [lastDoc,setLastDoc]=useState<QueryDocumentSnapshot | null>(null);
  const [hasMore,setHasMore]=useState(true);
  const [loadingMore,setLoadingMore]=useState(false);
  const [wishIds,setWishIds]=useState<Set<string>>(new Set());
  const [user,setUser]=useState<any>(null);

  const categories = ["All","Cars","Properties","Mobiles","Jobs","Bikes","Electronics & Appliances","Commercial Vehicles","Furniture","Fashion","Books, Sports","Pets","Services","Cosmetics","Others"];

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async(u)=>{
      setUser(u);
      if(u){
        const snap = await getDocs(collection(db,"users",u.uid,"wishlist"));
        setWishIds(new Set(snap.docs.map(d=>d.data().productId)));
      }
    });
    return ()=>unsub();
  },[]);

  const toggleWish = async(e:any, adId:string)=>{
    e.stopPropagation();
    e.preventDefault();
    if(!user){ router.push("/login"); return; }
    const wishRef = doc(db,"users",user.uid,"wishlist",adId);
    if(wishIds.has(adId)){
      await deleteDoc(wishRef);
      setWishIds(prev=>{ const n=new Set(prev); n.delete(adId); return n; });
    }else{
      await setDoc(wishRef,{productId:adId, createdAt:new Date()});
      setWishIds(prev=>{ const n=new Set(prev); n.add(adId); return n; });
    }
  };

  const trackView = async(ad:any)=>{
    try{
      const viewed = JSON.parse(localStorage.getItem("mz_viewed_ids")||"[]");
      localStorage.setItem("mz_viewed_ids", JSON.stringify([ad.id,...viewed.filter((x:string)=>x!==ad.id)].slice(0,200)));
      const scores = JSON.parse(localStorage.getItem("mz_cat_score")||"{}");
      scores[ad.category||"Others"]=(scores[ad.category||"Others"]||0)+1;
      localStorage.setItem("mz_cat_score", JSON.stringify(scores));
      await updateDoc(doc(db,"products",ad.id), { views: increment(1) }).catch(()=>{});
    }catch{}
  };

  const loadAds = async(isNew=true)=>{
    setLoading(isNew);
    if(isNew){ setLastDoc(null); setHasMore(true); }
    try{
      let q = cat==="All"? query(collection(db,"products"), orderBy("createdAt","desc"), limit(40)) : query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), limit(40));
      const snap = await getDocs(q);
      let list = snap.docs.map(d=>({id:d.id,...d.data() as any}));
      if(cat==="All"){
        try{
          const viewedSet = new Set<string>(JSON.parse(localStorage.getItem("mz_viewed_ids")||"[]"));
          const catScores:Record<string,number> = JSON.parse(localStorage.getItem("mz_cat_score")||"{}");
          const scored = list.map((ad:any)=>{
            const isViewed = viewedSet.has(ad.id);
            let score = (catScores[ad.category||""]||0)*25 + (ad.views||0)*0.5 + Math.random()*30 + Math.max(0,80-((Date.now()-(ad.createdAt?.toMillis?ad.createdAt.toMillis():0))/(1000*3600))*0.5);
            if(isViewed) score-=150;
            return {...ad, _score:score, _viewed:isViewed};
          });
          scored.sort((a,b)=>b._score-a._score);
          list = [...scored.filter((a:any)=>!a._viewed).slice(0,25),...scored.filter((a:any)=>a._viewed).slice(0,5),...scored.filter((a:any)=>!a._viewed).slice(25)].slice(0,35);
        }catch{}
      }
      const map = new Map(list.map((a:any)=>[a.id,a]));
      setAds(Array.from(map.values()));
      setLastDoc(snap.docs[snap.docs.length-1]||null);
      setHasMore(snap.docs.length>=20);
    }catch{}
    setLoading(false);
  };

  useEffect(()=>{ loadAds(true); },[cat]);

  const loadMore = async()=>{
    if(!lastDoc||!hasMore||loadingMore||loading||cat!=="All") return;
    setLoadingMore(true);
    try{
      const q = query(collection(db,"products"), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20));
      const snap = await getDocs(q);
      if(snap.empty) setHasMore(false);
      else{
        setAds(prev=>{
          const ids = new Set(prev.map((p:any)=>p.id));
          const filtered = snap.docs.map(d=>({id:d.id,...d.data()})).filter((n:any)=>!ids.has(n.id));
          return [...prev,...filtered];
        });
        setLastDoc(snap.docs[snap.docs.length-1]);
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
      <div className="sticky top-0 z-30 bg-white px-3 pt-3 pb-2 border-b">
        <div className="flex items-center border-[2.5px] border-[#002f34] rounded-[12px] px-4 h-[52px] gap-3">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#002f34" strokeWidth="2.5"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find Cars, Mobile..." className="flex-1 outline-none text-[16px] bg-transparent" />
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-2 no-scrollbar">
          {categories.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`whitespace-nowrap px-5 py-2 rounded-full border text-[13px] font-bold ${cat===c?"bg-[#002f34] text-white border-[#002f34]":"bg-white text-[#002f34] border-gray-300"}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[1px] bg-[#e0e0e0]">
        {filtered.map(ad=>(
          <div key={ad.id} onClick={()=>{ trackView(ad); router.push(`/marketplace/${ad.id}`); }} className="bg-white cursor-pointer">
            {/* THLALAK CHUNG SIR KIL AH WISHLIST LOVE */}
            <div className="relative aspect-square bg-gray-50">
              <img src={ad.image || ad.images?.[0] || "https://via.placeholder.com/400"} className="w-full h-full object-cover" loading="lazy" />
              <button
                onClick={(e)=>toggleWish(e, ad.id)}
                className="absolute top-2 right-2 w-8 h-8 bg-white/95 backdrop-blur rounded-full shadow-md flex items-center justify-center border border-black/5 active:scale-90"
              >
                <span className="text-[18px] leading-none">
                  {wishIds.has(ad.id)? "❤️" : "🤍"}
                </span>
              </button>
            </div>
            <div className="p-2">
              <p className="text-[13px] truncate"><b>₹{Number(ad.price||0).toLocaleString('en-IN')}</b> · {ad.title}</p>
              <p className="text-[10px] text-gray-500 truncate uppercase">{ad.location || ad.khua || "ZAMUANG, MAMIT"}</p>
            </div>
          </div>
        ))}
      </div>

      {loading && <p className="text-center py-6 text-[13px] font-bold text-gray-400">Loading...</p>}
      {loadingMore && <p className="text-center py-4 text-[12px] text-gray-400">Loading more...</p>}
    </main>
  );
}

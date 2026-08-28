"use client";
import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, where, doc, setDoc, deleteDoc, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import Link from "next/link";

export default function Home(){
  const [ads,setAds]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [loading,setLoading]=useState(true);
  const [lastDoc,setLastDoc]=useState<QueryDocumentSnapshot | null>(null);
  const [hasMore,setHasMore]=useState(true);
  const [isLoadingMore,setIsLoadingMore]=useState(false);
  const [debouncedSearch,setDebouncedSearch]=useState("");
  const [wishIds,setWishIds]=useState<Set<string>>(new Set());
  const [user,setUser]=useState<any>(null);

  // Auth + Wishlist IDs load
  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      setUser(u);
      if(u){
        const snap=await getDocs(collection(db,"users",u.uid,"wishlist"));
        setWishIds(new Set(snap.docs.map(d=>d.data().productId)));
      }
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const t=setTimeout(()=>setDebouncedSearch(search),300);
    return ()=>clearTimeout(t);
  },[search]);

  const loadAds = useCallback(async (isNewCat=false)=>{
    setLoading(isNewCat);
    try{
      let q;
      if(cat==="All"){
        q=query(collection(db,"products"), orderBy("createdAt","desc"), limit(20));
      }else{
        q=query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), limit(20));
      }
      const snap=await getDocs(q);
      setAds(snap.docs.map(d=>({id:d.id,...d.data() as any})));
      setLastDoc(snap.docs[snap.docs.length-1] || null);
      setHasMore(snap.docs.length===20);
    }catch(e){ console.log(e); }
    setLoading(false);
  },[cat]);

  useEffect(()=>{ loadAds(true); },[loadAds]);

  const loadMore = async ()=>{
    if(!lastDoc ||!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try{
      let q;
      if(cat==="All"){
        q=query(collection(db,"products"), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20));
      }else{
        q=query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20));
      }
      const snap=await getDocs(q);
      setAds(prev=>[...prev,...snap.docs.map(d=>({id:d.id,...d.data() as any}))]);
      setLastDoc(snap.docs[snap.docs.length-1] || null);
      setHasMore(snap.docs.length===20);
    }catch{}
    setIsLoadingMore(false);
  };

  useEffect(()=>{
    const handleScroll=()=>{
      if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 800){
        loadMore();
      }
    };
    window.addEventListener("scroll",handleScroll);
    return ()=>window.removeEventListener("scroll",handleScroll);
  },[lastDoc,hasMore]);

  const toggleWish = async(e:any, adId:string)=>{
    e.preventDefault();
    if(!user){ alert("Login phawt rawh Boss!"); return; }
    const wishRef=doc(db,"users",user.uid,"wishlist",adId);
    if(wishIds.has(adId)){
      await deleteDoc(wishRef);
      setWishIds(prev=>{ const n=new Set(prev); n.delete(adId); return n; });
    }else{
      await setDoc(wishRef,{productId:adId, createdAt:new Date()});
      setWishIds(prev=>{ const n=new Set(prev); n.add(adId); return n; });
    }
  };

  const categories=["All","Cars","Properties","Mobiles","Jobs","Bikes","Furniture","Fashion","Electronics"];
  const filtered = ads.filter(a=>{
    if(!debouncedSearch) return true;
    const s=debouncedSearch.toLowerCase();
    return a.title?.toLowerCase().includes(s) || a.location?.toLowerCase().includes(s);
  });

  return (
    <main className="min-h-screen bg-[#f2f2f2]">
      <div className="bg-white sticky top-0 z-20 p-3 border-b">
        <div className="flex items-center border-[1.5px] border-[#002f34] rounded-md px-3 py-[10px] gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002f34" strokeWidth="2.5"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find Cars, Mobile..." className="flex-1 outline-none text-[14px] bg-transparent"/>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
          {categories.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-[13px] font-black ${cat===c?'bg-[#002f34] text-white border-[#002f34]':'bg-white text-[#002f34] border-gray-300'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[1px] bg-gray-200">
        {filtered.map(ad=>(
          <div key={ad.id} className="bg-white p-2 flex flex-col relative group">
            <button onClick={(e)=>toggleWish(e,ad.id)} className="absolute top-3 right-3 z-10 bg-white w-8 h-8 rounded-full shadow flex items-center justify-center text-[16px]">
              {wishIds.has(ad.id)? "❤️" : "🤍"}
            </button>
            <Link href={`/marketplace/${ad.id}`}>
              <div className="w-full h-40 bg-gray-100 overflow-hidden rounded">
                <img src={ad.image || ad.images?.[0] || "https://via.placeholder.com/300"} alt={ad.title} loading="lazy" className="w-full h-full object-cover group-active:scale-105 transition-transform duration-200"/>
              </div>
              <p className="font-black mt-2 text-[16px] text-[#002f34]">₹ {Number(ad.price).toLocaleString("en-IN") || "0"}</p>
              <p className="text-[13px] truncate font-medium text-[#002f34]">{ad.title}</p>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">{ad.location || "MIZORAM"}</p>
                <p className="text-[10px] text-gray-500 font-bold">TODAY</p>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {loading && <div className="grid grid-cols-2 gap-[1px] bg-gray-200">{[1,2,3,4,5,6].map(i=><div key={i} className="bg-white h-56 animate-pulse"/>)}</div>}
      {isLoadingMore && <p className="text-center py-4 text-[12px] font-bold text-gray-400">Loading more...</p>}
    </main>
  );
}

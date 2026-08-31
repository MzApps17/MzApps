"use client";
import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, where, doc, setDoc, deleteDoc, getDoc, QueryDocumentSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CommentPopup from "@/components/CommentPopup";

function timeAgo(ts:any){
  if(!ts) return "today";
  try{
    const d = ts.toDate? ts.toDate() : new Date(ts);
    const diff = Math.floor((Date.now() - d.getTime())/1000);
    if(diff < 60) return "just now";
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)} hrs ago`;
    if(diff < 172800) return "yesterday";
    if(diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return d.toLocaleDateString();
  }catch{ return "today"; }
}

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
  const [showLoginAlert,setShowLoginAlert]=useState(false);
  const [hasNewNoti,setHasNewNoti]=useState(false);
  const [selectedPostId,setSelectedPostId]=useState<string|null>(null);
  const [userMap,setUserMap]=useState<Record<string,any>>({});
  const router = useRouter();

  useEffect(()=>{
    if(ads.length > 0 &&!loading){
      const saved = sessionStorage.getItem("mzHomeScroll");
      if(saved){ setTimeout(()=> window.scrollTo(0, parseInt(saved)), 100); }
    }
  },[ads, loading]);
  useEffect(()=>{
    const onScroll = () => { if(!loading) sessionStorage.setItem("mzHomeScroll", String(window.scrollY)); };
    window.addEventListener("scroll", onScroll);
    return ()=> window.removeEventListener("scroll", onScroll);
  },[loading]);
  const saveScroll = () => { sessionStorage.setItem("mzHomeScroll", String(window.scrollY)); };

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      setUser(u);
      if(u){
        const snap=await getDocs(collection(db,"users",u.uid,"wishlist"));
        setWishIds(new Set(snap.docs.map(d=>d.data().productId)));
        try{
          const notiSnap = await getDocs(query(collection(db,"users",u.uid,"notifications"), where("read","==",false), limit(1)));
          if(!notiSnap.empty) setHasNewNoti(true);
        }catch{}
      }
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const markOnline = async()=>{
      try{
        let anonId = localStorage.getItem("anon_id");
        if(!anonId){ anonId = "anon_" + Math.random().toString(36).slice(2,11); localStorage.setItem("anon_id", anonId); }
        await setDoc(doc(db,"presence", anonId), { lastSeen: new Date(), uid: auth.currentUser?.uid || null, isAnon:!auth.currentUser }, {merge:true});
        if(auth.currentUser){ await setDoc(doc(db,"users", auth.currentUser.uid), { lastSeen: new Date() }, {merge:true}); }
      }catch{}
    };
    markOnline();
    const iv = setInterval(markOnline, 60000);
    return ()=> clearInterval(iv);
  },[user]);

  useEffect(()=>{ const t=setTimeout(()=>setDebouncedSearch(search),300); return ()=>clearTimeout(t); },[search]);

  const fetchUserProfiles = async (adsList:any[]) => {
    const ids = Array.from(new Set(adsList.map((a:any)=>a.userId).filter(Boolean))) as string[];
    const missing = ids.filter((id:string)=>!userMap[id]);
    if(missing.length===0) return;
    try{
      const newMap:any = {...userMap};
      await Promise.all(missing.map(async(uid)=>{
        const snap = await getDoc(doc(db,"users",uid));
        if(snap.exists()) newMap[uid] = snap.data();
      }));
      setUserMap(newMap);
    }catch(e){ console.log(e); }
  };

  const loadAds = useCallback(async (isNewCat=false)=>{
    setLoading(isNewCat);
    try{
      let allAds:any[] = [];
      if(cat==="All"){
        const q1=query(collection(db,"products"), orderBy("createdAt","desc"), limit(15));
        const q2=query(collection(db,"jobs"), orderBy("createdAt","desc"), limit(15));
        const [snap1,snap2]=await Promise.all([getDocs(q1), getDocs(q2).catch(()=>({docs:[]} as any))]);
        const p1=snap1.docs.map(d=>({id:d.id,...d.data() as any, _type:"product"}));
        const p2=(snap2 as any).docs.map((d:any)=>({id:d.id,...d.data() as any, _type:"job"}));
        allAds=[...p1,...p2].sort((a,b)=>{
          const ta=a.createdAt?.toMillis? a.createdAt.toMillis() : new Date(a.createdAt||0).getTime();
          const tb=b.createdAt?.toMillis? b.createdAt.toMillis() : new Date(b.createdAt||0).getTime();
          return tb-ta;
        });
        const uniqueMap = new Map(); allAds.forEach((ad:any)=> uniqueMap.set(ad.id, ad));
        const finalAds = Array.from(uniqueMap.values());
        setAds(finalAds); fetchUserProfiles(finalAds);
        setLastDoc(snap1.docs[snap1.docs.length-1] || null); setHasMore(snap1.docs.length===15);
      }else if(cat==="Jobs"){
        const q=query(collection(db,"jobs"), orderBy("createdAt","desc"), limit(20));
        const snap=await getDocs(q);
        const finalAds = snap.docs.map(d=>({id:d.id,...d.data() as any, _type:"job"}));
        setAds(finalAds); fetchUserProfiles(finalAds);
        setLastDoc(snap.docs[snap.docs.length-1] || null); setHasMore(snap.docs.length===20);
      }else{
        const q=query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), limit(20));
        const snap=await getDocs(q);
        const finalAds = snap.docs.map(d=>({id:d.id,...d.data() as any, _type:"product"}));
        setAds(finalAds); fetchUserProfiles(finalAds);
        setLastDoc(snap.docs[snap.docs.length-1] || null); setHasMore(snap.docs.length===20);
      }
    }catch(e){ console.log(e); }
    setLoading(false);
  },[cat]);

  useEffect(()=>{ loadAds(true); },[loadAds]);

  const loadMore = async ()=>{
    if(!lastDoc ||!hasMore || isLoadingMore) return; if(cat==="Jobs") return;
    setIsLoadingMore(true);
    try{
      let q;
      if(cat==="All"){ q=query(collection(db,"products"), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20)); }
      else{ q=query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20)); }
      const snap=await getDocs(q);
      if(snap.empty){ setHasMore(false); }
      else{
        setAds(prev=>{
          const existingIds = new Set(prev.map((a:any)=>a.id));
          const newOnes = snap.docs.map(d=>({id:d.id,...d.data() as any, _type:"product"})).filter((a:any)=>!existingIds.has(a.id));
          const merged = [...prev,...newOnes];
          fetchUserProfiles(merged);
          return merged;
        });
        setLastDoc(snap.docs[snap.docs.length-1] || null); setHasMore(snap.docs.length===20);
      }
    }catch{} setIsLoadingMore(false);
  };

  useEffect(()=>{
    const handleScroll=()=>{ if(window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) loadMore(); };
    window.addEventListener("scroll",handleScroll);
    return ()=>window.removeEventListener("scroll",handleScroll);
  },[lastDoc,hasMore]);

  const toggleWish = async(e:any, adId:string)=>{
    e.preventDefault(); e.stopPropagation();
    if(!user){ setShowLoginAlert(true); return; }
    const wishRef=doc(db,"users",user.uid,"wishlist",adId);
    if(wishIds.has(adId)){ await deleteDoc(wishRef); setWishIds(prev=>{ const n=new Set(prev); n.delete(adId); return n; }); }
    else{ await setDoc(wishRef,{productId:adId, createdAt:new Date()}); setWishIds(prev=>{ const n=new Set(prev); n.add(adId); return n; }); }
  };

  const categories=["All","Cars","Properties","Mobiles","Jobs","Bikes","Furniture","Fashion","Electronics","Cosmetics","Others"];
  const filtered = ads.filter(a=>{
    if(!debouncedSearch) return true; const s=debouncedSearch.toLowerCase();
    return a.title?.toLowerCase().includes(s) || a.location?.toLowerCase().includes(s);
  });

  return (
    <main className="min-h-screen bg-[#f2f2f2]">
      <div style={{position:'absolute', left:'-9999px', top:'auto', width:'1px', height:'1px', overflow:'hidden'}}>
        <h1>MizoApps - Mizoram No.1 Marketplace</h1>
      </div>
      <div className="bg-white sticky top-0 z-20 p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center border-[1.5px] border-[#002f34] rounded-md px-3 py-[9px] gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002f34" strokeWidth="2.5"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find Cars, Mobile..." className="flex-1 outline-none text-[14px] bg-transparent"/>
          </div>
          <button onClick={()=> router.push(user? "/account" : "/login")} className="h-9 px-4 bg-black rounded-full flex items-center justify-center flex-shrink-0 border border-black">
            <span className="text-white font-black text-[11px] tracking-wide">LOGIN</span>
          </button>
          <button onClick={()=> router.push("/notifications")} className="w-9 h-9 bg-white border-[1.5px] border-black rounded-full flex items-center justify-center flex-shrink-0 relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 6 5 6 10H0s6-3 6-10"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>
            {hasNewNoti && <span className="absolute top-[3px] right-[4px] w-[9px] h-[9px] bg-red-600 rounded-full border border-white"></span>}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
          {categories.map(c=>(
            <button key={c} onClick={()=>setCat(c)} className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-[13px] font-black ${cat===c?'bg-[#002f34] text-white border-[#002f34]':'bg-white text-[#002f34] border-gray-300'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col">
        {filtered.map(ad=>{
          const u = userMap[ad.userId];
          const realName = u?.displayName || u?.name || u?.fullName || u?.userName || ad.userName || "Mizo User";
          const realPic = u?.photoURL || u?.profilePic || u?.avatar || u?.image || ad.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(realName)}&background=002f34&color=fff`;
          return (
            <div key={ad.id} className="bg-white mb-2 w-full cursor-pointer">
              <div className="flex items-center gap-3 p-3">
                <img onClick={(e)=>{ e.stopPropagation(); if(ad.userId){ saveScroll(); router.push(`/user/${ad.userId}`); } }} src={realPic} className="w-10 h-10 rounded-full object-cover border cursor-pointer active:scale-95" alt="profile"/>
                <div className="flex flex-col">
                  <span onClick={(e)=>{ e.stopPropagation(); if(ad.userId){ saveScroll(); router.push(`/user/${ad.userId}`); } }} className="font-bold text-[15px] leading-none cursor-pointer hover:underline active:opacity-60">{realName}</span>
                  <span className="text-[12px] text-gray-500 mt-1">{timeAgo(ad.createdAt)}</span>
                </div>
              </div>
              <div className="px-3 pb-1" onClick={()=>{ saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><h2 className="font-bold text-[16px] text-[#002f34] line-clamp-1">{ad.title}</h2></div>
              <div className="px-3 pb-2" onClick={()=>{ saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><p className="text-[13px] text-gray-700 line-clamp-2">{ad.description || ad.desc || ""}</p></div>
              <div className="relative w-full bg-gray-100" onClick={()=>{ saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}>
                <div className="w-full h-[380px] bg-gray-100 overflow-hidden flex items-center justify-center">
                  {(ad._type==="job" &&!ad.image &&!ad.images?.[0])? (<div className="w-full h-full bg-[#f3f4f6] flex items-center justify-center p-3"><p className="text-[22px] font-black text-[#002f34] text-center leading-tight capitalize">{ad.title || "Job"}</p></div>) : (<img src={ad.image || ad.images?.[0] || "https://via.placeholder.com/300"} alt={ad.title} loading="lazy" className="w-full h-full object-cover"/>)}
                </div>
                <button onClick={(e)=>toggleWish(e,ad.id)} className="absolute top-3 right-3 bg-white/90 backdrop-blur p-2.5 rounded-full shadow-md"><span className="text-[18px]">{wishIds.has(ad.id)? "❤️" : "🤍"}</span></button>
              </div>
              <div className="px-3 pt-2.5" onClick={()=>{ saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><p className="font-black text-[18px] text-[#002f34]">₹ {Number(ad.price || ad.salary || 0).toLocaleString("en-IN") || "0"}</p></div>
              <div className="px-3 pt-1 flex items-center gap-1 text-gray-500" onClick={()=>{ saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span className="text-[11px] font-bold uppercase">{ad.khua || ad.location || "AIZAWL"}, {ad.district || "MIZORAM"}</span></div>
              <div className="flex items-center gap-6 px-3 py-3 mt-2 border-t border-gray-100">
                <button onClick={(e)=>{ e.stopPropagation(); if(!user){ setShowLoginAlert(true); return; } }} className="flex items-center gap-1.5 text-[13px] font-bold">❤️ {ad.likes || 0}</button>
                <button onClick={(e)=>{ e.stopPropagation(); if(!user){ setShowLoginAlert(true); return; } setSelectedPostId(ad.id); }} className="flex items-center gap-1.5 text-[13px] font-bold">💬 {ad.commentsCount || 0} Comment</button>
                <button onClick={(e)=>{ e.stopPropagation(); if(navigator.share) navigator.share({url: `${window.location.origin}/marketplace/${ad.id}`}) }} className="flex items-center gap-1.5 text-[13px] font-bold">↗️ Share</button>
              </div>
            </div>
          );
        })}
      </div>

      {loading && <div className="flex flex-col gap-2">{[1,2,3].map(i=><div key={i} className="bg-white h-[450px] animate-pulse"/>)}</div>}
      {isLoadingMore && <p className="text-center py-4 text-[12px] font-bold text-gray-400">Loading more...</p>}

      {showLoginAlert && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-[300px] p-6 shadow-2xl text-center">
            <p className="font-bold text-[16px] text-[#002f34]">Login hmasa phawt rawh</p>
            <p className="text-[12px] text-gray-500 mt-1">Like, Comment, Wishlist ti tur chuan login a ngai</p>
            <div className="flex gap-2 mt-5">
              <button onClick={()=> setShowLoginAlert(false)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl text-[14px]">Cancel</button>
              <button onClick={()=> router.push("/login")} className="flex-1 bg-black text-white font-black py-3 rounded-xl text-[14px]">LOGIN</button>
            </div>
          </div>
        </div>
      )}
      {selectedPostId && <CommentPopup postId={selectedPostId} onClose={()=>setSelectedPostId(null)} />}
    </main>
  );
}

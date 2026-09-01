"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { collection, getDocs, query, orderBy, limit, startAfter, where, doc, setDoc, deleteDoc, getDoc, updateDoc, increment, QueryDocumentSnapshot, arrayUnion, arrayRemove } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
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
function getPostUserId(ad:any){ return ad.userId || ad.uid || ad.sellerId || ad.ownerId || ad.createdBy || ad.userUid || null; }
function getUserNameFromDoc(u:any){
  if(!u) return null;
  const n = u.displayName || u.fullName || u.name || u.userName || u.username;
  if(n && n.trim()!=="") return n.trim();
  if(u.email) return u.email.split("@")[0];
  return null;
}
function getUserPicFromDoc(u:any){
  if(!u) return null;
  return u.photoURL || u.profilePic || u.avatar || u.image || u.profileImage || u.photo || null;
}
function getLikeCount(ad:any){
  if(Array.isArray(ad.likes)) return ad.likes.length;
  if(Array.isArray(ad.likedBy)) return ad.likedBy.length;
  if(typeof ad.likeCount === 'number') return ad.likeCount;
  if(typeof ad.likesCount === 'number') return ad.likesCount;
  if(typeof ad.likes === 'number') return ad.likes;
  return 0;
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
  const [likeIds,setLikeIds]=useState<Set<string>>(new Set());
  const [likeCounts,setLikeCounts]=useState<Record<string,number>>({});
  const [commentCounts,setCommentCounts]=useState<Record<string,number>>({});
  const scrollPosRef = useRef<number>(0);
  const router = useRouter();
  const isFirstLoad = useRef(true);

  // SCROLL RESTORE - A pawimawh ber
  useEffect(()=>{
    if(ads.length > 0 &&!loading){
      const saved = sessionStorage.getItem("mzHomeScroll");
      if(saved && isFirstLoad.current){
        const y = parseInt(saved);
        // 2 tum scroll - a dik ngei ngei nan
        setTimeout(()=> window.scrollTo(0, y), 100);
        setTimeout(()=> window.scrollTo(0, y), 400);
        setTimeout(()=> window.scrollTo(0, y), 800);
      }
      isFirstLoad.current = false;
    }
  },[ads, loading]);

  useEffect(()=>{
    const onScroll = () => {
      if(!loading &&!selectedPostId && ads.length>0){
        sessionStorage.setItem("mzHomeScroll", String(window.scrollY));
      }
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    return ()=> window.removeEventListener("scroll", onScroll);
  },[loading, selectedPostId, ads]);

  const saveScroll = () => {
    sessionStorage.setItem("mzHomeScroll", String(window.scrollY));
    sessionStorage.setItem("mz_is_back", "1"); // back lo kal tih hriat nan
  };

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      setUser(u);
      if(u){
        const snap=await getDocs(collection(db,"users",u.uid,"wishlist"));
        setWishIds(new Set(snap.docs.map(d=>d.data().productId)));
        const likeSnap=await getDocs(collection(db,"users",u.uid,"likes"));
        setLikeIds(new Set(likeSnap.docs.map(d=>d.data().productId)));
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
    const allIds = adsList.map(getPostUserId).filter(Boolean) as string[];
    const uniqueIds = Array.from(new Set(allIds)) as string[];
    const missing = uniqueIds.filter((id:string)=>!userMap[id]);
    if(missing.length===0) return;
    try{
      const newMap:any = {...userMap};
      await Promise.all(missing.map(async(uid)=>{
        const snap = await getDoc(doc(db,"users",uid));
        if(snap.exists()) newMap[uid] = snap.data();
      }));
      setUserMap(newMap);
    }catch(e){ console.log("user fetch error", e); }
  };

  useEffect(()=>{
    if(ads.length===0) return;
    const loadRealCounts = async()=>{
      const lc:Record<string,number>={};
      const cc:Record<string,number>={};
      for(const ad of ads){
        const colName = ad._type==="job"? "jobs":"products";
        try{
          const likeSnap = await getDocs(collection(db,colName,ad.id,"likes"));
          if(likeSnap.size>0) lc[ad.id]=likeSnap.size;
          else lc[ad.id]=getLikeCount(ad);
        }catch{ lc[ad.id]=getLikeCount(ad); }
        try{
          const comSnap = await getDocs(collection(db,colName,ad.id,"comments"));
          cc[ad.id]=comSnap.size;
        }catch{ cc[ad.id]=ad.commentsCount||ad.commentCount||0; }
      }
      setLikeCounts(prev=>({...prev,...lc}));
      setCommentCounts(prev=>({...prev,...cc}));
    };
    loadRealCounts();
  },[ads.map(a=>a.id).join(",")]);

  const trackView = async (ad:any)=>{
    try{
      const uid = auth.currentUser?.uid || "guest";
      const keyViewed = `mz_viewed_${uid}`;
      const keyScore = `mz_score_${uid}`;
      const viewed = JSON.parse(localStorage.getItem(keyViewed)||"[]");
      const updated = [ad.id,...viewed.filter((x:string)=>x!==ad.id)].slice(0,200);
      localStorage.setItem(keyViewed, JSON.stringify(updated));
      const scores = JSON.parse(localStorage.getItem(keyScore)||"{}");
      const c = ad.category||"Others";
      scores[c]=(scores[c]||0)+1;
      localStorage.setItem(keyScore, JSON.stringify(scores));
      const colName = ad._type==="job"? "jobs":"products";
      const postRef = doc(db,colName,ad.id);
      await updateDoc(postRef, { views: increment(1), viewsCount: increment(1) }).catch(async()=>{
        await setDoc(postRef, { views: 1, viewsCount: 1 }, {merge:true});
      });
    }catch{}
  };
    const createNoti = async(ownerId:string, post:any, type:"like"|"comment", text?:string)=>{
    try{
      if(!ownerId ||!user || ownerId===user.uid) return;
      const ref = doc(collection(db,"users",ownerId,"notifications"));
      await setDoc(ref,{
        type, postId: post.id, postType: post._type || "product",
        fromUid: user.uid, fromName: user.displayName || user.email?.split("@")[0] || "Someone",
        fromPhoto: user.photoURL || "", title: post.title || "your post",
        message: type==="like"? `${user.displayName||"Someone"} liked your post` : `${user.displayName||"Someone"}: ${text?.slice(0,50)}`,
        read: false, createdAt: new Date()
      });
    }catch(e){ console.log("noti err",e); }
  };

  const loadAds = useCallback(async (isNewCat=false)=>{
    setLoading(isNewCat);
    try{
      let allAds:any[] = [];
      if(cat==="All"){
        const q1=query(collection(db,"products"), orderBy("createdAt","desc"), limit(60));
        const q2=query(collection(db,"jobs"), orderBy("createdAt","desc"), limit(20));
        const [snap1,snap2]=await Promise.all([getDocs(q1), getDocs(q2).catch(()=>({docs:[]} as any))]);
        const p1=snap1.docs.map(d=>({id:d.id,...d.data() as any, _type:"product"}));
        const p2=(snap2 as any).docs.map((d:any)=>({id:d.id,...d.data() as any, _type:"job"}));
        allAds=[...p1,...p2];
      }else if(cat==="Jobs"){
        const q=query(collection(db,"jobs"), orderBy("createdAt","desc"), limit(40));
        const snap=await getDocs(q);
        allAds=snap.docs.map(d=>({id:d.id,...d.data() as any, _type:"job"}));
      }else{
        const q=query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), limit(60));
        const snap=await getDocs(q);
        allAds = snap.docs.map(d=>({id:d.id,...d.data() as any, _type:"product"}));
      }

      try{
        const uid = auth.currentUser?.uid || "guest";
        const cacheKey = `mz_feed_cache_${cat}_${uid}`;
        const isBackNav = sessionStorage.getItem("mz_is_back")==="1";
        const cachedStr = sessionStorage.getItem(cacheKey);

        // BACK NAV a nih chuan cache hmang - shuffle lo!
        if(isBackNav && cachedStr &&!isNewCat){
          try{
            const cachedIds: string[] = JSON.parse(cachedStr);
            const mapById = new Map(allAds.map((a:any)=>[a.id,a]));
            const restored = cachedIds.map(id=>mapById.get(id)).filter(Boolean);
            if(restored.length>10){
              setAds(restored);
              fetchUserProfiles(restored);
              setLastDoc(null); setHasMore(true);
              setLoading(false);
              return;
            }
          }catch{}
        }

        // A thar siam - I en tam ber mil
        const viewedSet = new Set<string>(JSON.parse(localStorage.getItem(`mz_viewed_${uid}`)||"[]"));
        const catScores:Record<string,number> = JSON.parse(localStorage.getItem(`mz_score_${uid}`)||"{}");
        const topCats = Object.entries(catScores).sort((a,b)=> (b[1] as number)-(a[1] as number)).slice(0,3).map(x=>x[0]);

        const scored = allAds.map(ad=>{
          const isViewed = viewedSet.has(ad.id);
          const catScore = (catScores[ad.category||""]||0);
          const isTopCat = topCats.length>0? topCats.includes(ad.category) : false;
          let catPoint = catScore * 25;
          if(isTopCat) catPoint += 30;
          const t = ad.createdAt?.toMillis? ad.createdAt.toMillis() : new Date(ad.createdAt||0).getTime();
          const ageH = (Date.now()-t)/(1000*3600);
          const fresh = Math.max(0, 80 - ageH*0.8);
          const randomJitter = Math.random()*40;
          let score = catPoint + fresh + randomJitter;
          if(isViewed) score -= 80;
          if(ageH > 72) score -= 40;
          return {...ad, _score: score, _viewed: isViewed, _isTopCat: isTopCat};
        });

        const topCatPosts = scored.filter((a:any)=>a._isTopCat &&!a._viewed).sort((a,b)=> b._score - a._score);
        const otherUnseen = scored.filter((a:any)=>!a._isTopCat &&!a._viewed).sort((a,b)=> b._score - a._score);
        const seen = scored.filter((a:any)=>a._viewed).sort((a,b)=> b._score - a._score);

        const shuffledTop = topCatPosts.sort(()=>Math.random()-0.5);
        const shuffledOther = otherUnseen.sort(()=>Math.random()-0.5);

        let finalAds:any[] = [];
        if(topCats.length>0){
          finalAds = [...shuffledTop.slice(0,15),...shuffledOther.slice(0,10),...shuffledTop.slice(15,25),...seen.slice(0,5)].slice(0,30);
        }else{
          finalAds = [...scored].sort((a,b)=> b._score - a._score + (Math.random()-0.5)*20).slice(0,30);
        }

        // CACHE SAVE - back hun atan
        sessionStorage.setItem(cacheKey, JSON.stringify(finalAds.map((a:any)=>a.id)));
        sessionStorage.removeItem("mz_is_back"); // back flag clear

        const map = new Map(); finalAds.forEach((ad:any)=> map.set(ad.id, ad));
        const uniqueFinal = Array.from(map.values());
        setAds(uniqueFinal); fetchUserProfiles(uniqueFinal);
        setLastDoc(null); setHasMore(true);
      }catch{
        const map = new Map(); allAds.forEach((ad:any)=> map.set(ad.id, ad));
        setAds(Array.from(map.values())); fetchUserProfiles(Array.from(map.values()));
      }
    }catch(e){ console.log(e); }
    setLoading(false);
  },[cat, user]);

  useEffect(()=>{
    // Category thlak chuan cache thar siam
    if(cat!=="All"){
      sessionStorage.removeItem(`mz_feed_cache_${cat}_${auth.currentUser?.uid || "guest"}`);
    }
    loadAds(true);
  },[loadAds, cat]);

  const loadMore = async ()=>{
    if(!lastDoc ||!hasMore || isLoadingMore) return; if(cat==="Jobs") return;
    setIsLoadingMore(true);
    try{
      let q;
      if(cat==="All"){ q=query(collection(db,"products"), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20)); }
      else{ q=query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), startAfter(lastDoc), limit(20)); }
      const snap=await getDocs(q);
      if(snap.empty) setHasMore(false);
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

  const toggleLike = async(e:any, ad:any)=>{
    e.preventDefault(); e.stopPropagation();
    if(!user){ setShowLoginAlert(true); return; }
    const postId = ad.id;
    const colName = ad._type==="job"? "jobs" : "products";
    const likeRef = doc(db,"users",user.uid,"likes",postId);
    const postRef = doc(db,colName,postId);
    const subLikeRef = doc(db,colName,postId,"likes",user.uid);
    try{
      if(likeIds.has(postId)){
        await deleteDoc(likeRef);
        await deleteDoc(subLikeRef).catch(()=>{});
        await updateDoc(postRef, { likes: arrayRemove(user.uid), likedBy: arrayRemove(user.uid), likeCount: increment(-1), likesCount: increment(-1) }).catch(async()=>{ await updateDoc(postRef, { likes: increment(-1) }).catch(()=>{}); });
        setLikeIds(prev=>{ const n=new Set(prev); n.delete(postId); return n; });
        setLikeCounts(prev=>{ const c={...prev}; c[postId]=Math.max(0,(c[postId]??getLikeCount(ad))-1); return c; });
        setAds(prev=> prev.map(p=> p.id===postId? {...p, likes: Array.isArray(p.likes)? p.likes.filter((id:string)=>id!==user.uid) : Math.max(0,getLikeCount(p)-1), likeCount: Math.max(0,(p.likeCount||getLikeCount(p))-1), likesCount: Math.max(0,(p.likesCount||getLikeCount(p))-1)} : p));
      }else{
        await setDoc(likeRef,{productId:postId, createdAt:new Date()});
        await setDoc(subLikeRef,{userId:user.uid, createdAt:new Date()}).catch(()=>{});
        await updateDoc(postRef, { likes: arrayUnion(user.uid), likedBy: arrayUnion(user.uid), likeCount: increment(1), likesCount: increment(1) }).catch(async()=>{
          await setDoc(postRef, { likes: arrayUnion(user.uid), likeCount: increment(1) }, {merge:true}).catch(async()=>{ await updateDoc(postRef, { likes: increment(1) }).catch(()=>{}); });
        });
        setLikeIds(prev=>{ const n=new Set(prev); n.add(postId); return n; });
        setLikeCounts(prev=>{ const c={...prev}; c[postId]=(c[postId]??getLikeCount(ad))+1; return c; });
        setAds(prev=> prev.map(p=> p.id===postId? {...p, likes: Array.isArray(p.likes)? [...p.likes, user.uid] : (p.likes||0)+1, likeCount: (p.likeCount||getLikeCount(p))+1, likesCount: (p.likesCount||getLikeCount(p))+1} : p));
        const ownerId = getPostUserId(ad);
        if(ownerId) await createNoti(ownerId, ad, "like");
      }
    }catch(err){ console.log(err); }
  };

  const categories=["All","Cars","Properties","Mobiles","Jobs","Bikes","Furniture","Fashion","Electronics","Cosmetics","Others"];
  const filtered = ads.filter(a=>{
    if(!debouncedSearch) return true; const s=debouncedSearch.toLowerCase();
    return a.title?.toLowerCase().includes(s) || a.location?.toLowerCase().includes(s);
  });

  return (
    <main className="min-h-screen bg-[#f2f2f2]">
      <div className="bg-white sticky top-0 z-20 p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center border-[1.5px] border-[#002f34] rounded-md px-3 py-[9px] gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002f34" strokeWidth="2.5"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find Cars, Mobile..." className="flex-1 outline-none text-[14px] bg-transparent"/>
          </div>
          <button onClick={()=> router.push(user? "/account" : "/login")} className="h-9 px-4 bg-black rounded-full flex items-center justify-center flex-shrink-0 border border-black"><span className="text-white font-black text-[11px] tracking-wide">LOGIN</span></button>
          <button onClick={()=> router.push("/notifications")} className="w-9 h-9 bg-white border-[1.5px] border-black rounded-full flex items-center justify-center flex-shrink-0 relative"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 6 5 6 10H0s6-3 6-10"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>{hasNewNoti && <span className="absolute top-[3px] right-[4px] w-[9px] h-[9px] bg-red-600 rounded-full border border-white"></span>}</button>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
          {categories.map(c=>(<button key={c} onClick={()=>{ sessionStorage.setItem("mzHomeScroll","0"); setCat(c); }} className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-[13px] font-black ${cat===c?'bg-[#002f34] text-white border-[#002f34]':'bg-white text-[#002f34] border-gray-300'}`}>{c}</button>))}
        </div>
      </div>

      <div className="flex flex-col">
        {filtered.map(ad=>{
          const postUid = getPostUserId(ad);
          const u = userMap[postUid || ""];
          const realName = getUserNameFromDoc(u) || ad.userName || ad.sellerName || ad.displayName || "Mizo User";
          const realPic = getUserPicFromDoc(u) || ad.userPhoto || ad.userPic || `https://ui-avatars.com/api/?name=${encodeURIComponent(realName)}&background=002f34&color=fff&bold=true`;
          return (
            <div key={ad.id} className="bg-white mb-2 w-full cursor-pointer">
              <div className="flex items-center gap-3 p-3">
                <img onClick={(e)=>{ e.stopPropagation(); if(postUid){ trackView(ad); saveScroll(); router.push(`/seller/${postUid}`); } }} src={realPic} className="w-10 h-10 rounded-full object-cover border cursor-pointer active:scale-95" alt="profile"/>
                <div className="flex flex-col">
                  <span onClick={(e)=>{ e.stopPropagation(); if(postUid){ trackView(ad); saveScroll(); router.push(`/seller/${postUid}`); } }} className="font-bold text-[15px] leading-none cursor-pointer hover:underline active:opacity-60">{realName}</span>
                  <span className="text-[12px] text-gray-500 mt-1">{timeAgo(ad.createdAt)}</span>
                </div>
              </div>
              <div className="px-3 pb-1" onClick={()=>{ trackView(ad); saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><h2 className="font-bold text-[16px] text-[#002f34] line-clamp-1">{ad.title}</h2></div>
              <div className="px-3 pb-3" onClick={()=>{ trackView(ad); saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><p className="text-[16px] font-medium text-[#222] leading-[1.4] line-clamp-3">{ad.description || ad.desc || ""}</p></div>
              <div className="relative w-full bg-gray-100" onClick={()=>{ trackView(ad); saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}>
                <div className="w-full h-[340px] bg-gray-100 overflow-hidden flex items-center justify-center">
                  {(ad._type==="job" &&!ad.image &&!ad.images?.[0])? (<div className="w-full h-full bg-[#f3f4f6] flex items-center justify-center p-3"><p className="text-[22px] font-black text-[#002f34] text-center leading-tight capitalize">{ad.title || "Job"}</p></div>) : (<img src={ad.image || ad.images?.[0] || "https://via.placeholder.com/300"} alt={ad.title} loading="lazy" className="w-full h-full object-cover"/>)}
                </div>
                <button onClick={(e)=>toggleWish(e,ad.id)} className="absolute top-3 right-3 bg-white/90 backdrop-blur p-2.5 rounded-full shadow-md"><span className="text-[18px]">{wishIds.has(ad.id)? "❤️" : "🤍"}</span></button>
              </div>
              <div className="px-3 pt-2.5" onClick={()=>{ trackView(ad); saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><p className="font-black text-[18px] text-[#002f34]">₹ {Number(ad.price || ad.salary || 0).toLocaleString("en-IN") || "0"}</p></div>
              <div className="px-3 pt-1 flex items-center gap-1 text-gray-500" onClick={()=>{ trackView(ad); saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span className="text-[11px] font-bold uppercase">{ad.khua || ad.location || "AIZAWL"}, {ad.district || "MIZORAM"}</span></div>
              <div className="flex items-center gap-7 px-3 py-3 mt-2 border-t border-gray-100">
                <button onClick={(e)=>toggleLike(e,ad)} className="flex items-center gap-2 text-[16px] font-bold">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill={likeIds.has(ad.id)? "black" : "none"} stroke="black" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span>{(likeCounts[ad.id]?? getLikeCount(ad))}</span>
                </button>
                <button onClick={(e)=>{ e.stopPropagation(); if(!user){ setShowLoginAlert(true); return; } scrollPosRef.current = window.scrollY; saveScroll(); setSelectedPostId(ad.id); }} className="flex items-center gap-2 text-[16px] font-bold">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M21 11.5a8.5 8.5 0 0 1-12.5 7.5L3 21l2-5.5A8.5 8.5 0 0 1 21 11.5z"/></svg>
                  <span>{(commentCounts[ad.id]?? ad.commentsCount?? ad.commentCount?? 0)}</span>
                </button>
                <button onClick={(e)=>{ e.stopPropagation(); if(navigator.share) navigator.share({url: `${window.location.origin}/marketplace/${ad.id}`}) }} className="flex items-center gap-2 text-[16px] font-bold ml-auto">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                  <span className="text-[14px]">Share</span>
                </button>
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
            <div className="flex gap-2 mt-5"><button onClick={()=> setShowLoginAlert(false)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl text-[14px]">Cancel</button><button onClick={()=> router.push("/login")} className="flex-1 bg-black text-white font-black py-3 rounded-xl text-[14px]">LOGIN</button></div>
          </div>
        </div>
      )}

      {selectedPostId && (
        <CommentPopup
          postId={selectedPostId}
          onClose={()=>{
            const pos = scrollPosRef.current;
            setSelectedPostId(null);
            setTimeout(()=> window.scrollTo(0, pos), 50);
          }}
          onCommentAdded={async (pid:string)=>{
            try{
              const ad = ads.find((a:any)=>a.id===pid);
              const colName = ad?._type==="job"? "jobs" : "products";
              const snap = await getDocs(collection(db,colName,pid,"comments"));
              setCommentCounts(prev=>({...prev, [pid]: snap.size}));
            }catch{
              setAds(prev=> prev.map(p=> p.id===pid? {...p, commentsCount: (p.commentsCount||0)+1} : p));
            }
            try{
              const post = ads.find((a:any)=>a.id===pid);
              if(post){
                const ownerId = getPostUserId(post);
                const lastSnap = await getDocs(query(collection(db, (post._type==="job"?"jobs":"products"), pid, "comments"), orderBy("createdAt","desc"), limit(1)));
                const lastText = lastSnap.docs[0]?.data()?.text || "New comment";
                if(ownerId) await createNoti(ownerId, post, "comment", lastText);
              }
            }catch{}
          }}
        />
      )}
    </main>
  );
                                                                       }

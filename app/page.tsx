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
function FeedImageSlider({ imgs, title, onImageClick }: { imgs: string[], title: string, onImageClick:(idx:number)=>void }){
  const [idx,setIdx]=useState(0);
  const startX=useRef(0);
  const onTouchStart=(e:React.TouchEvent)=>{ startX.current=e.touches[0].clientX; }
  const onTouchEnd=(e:React.TouchEvent)=>{
    const diff=startX.current - e.changedTouches[0].clientX;
    if(Math.abs(diff)>40){
      if(diff>0 && idx < imgs.length-1) setIdx(idx+1);
      if(diff<0 && idx>0) setIdx(idx-1);
    }
  }
  if(!imgs || imgs.length===0) return null;
  return (
    <div className="relative w-full h-[380px] bg-black overflow-hidden" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="flex h-full w-full transition-transform duration-300 ease-out" style={{transform:`translateX(-${idx*100}%)`}}>
        {imgs.map((src,i)=>(<img key={i} onClick={()=>onImageClick(i)} src={src} alt={title} className="w-full h-full object-contain bg-black flex-shrink-0 cursor-pointer"/>))}
      </div>
      {imgs.length>1 && (
        <>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 px-2.5 py-1.5 rounded-full">
            {imgs.map((_,i)=>(<div key={i} className={`h-1.5 rounded-full transition-all ${i===idx?'w-4 bg-white':'w-1.5 bg-white/60'}`}/>))}
          </div>
          <div className="absolute top-2.5 right-2 bg-black/70 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">{idx+1}/{imgs.length}</div>
        </>
      )}
    </div>
  )
}
function ImageViewer({ images, startIndex, onClose }:{ images:string[], startIndex:number, onClose:()=>void }){
  const [idx,setIdx]=useState(startIndex);
  const sX=useRef(0);
  const onS=(e:React.TouchEvent)=>{ sX.current=e.touches[0].clientX; }
  const onE=(e:React.TouchEvent)=>{
    const diff=sX.current - e.changedTouches[0].clientX;
    if(Math.abs(diff)>50){ if(diff>0 && idx < images.length-1) setIdx(idx+1); if(diff<0 && idx>0) setIdx(idx-1); }
  }
  return (
    <div className="fixed inset-0 bg-black z-[2000] flex flex-col">
      <div className="flex justify-between items-center p-4 text-white"><button onClick={onClose} className="text-[28px]">✕</button><span className="text-[14px] font-bold">{idx+1} / {images.length}</span><div className="w-7"/></div>
      <div className="flex-1 flex items-center justify-center overflow-hidden" onTouchStart={onS} onTouchEnd={onE}>
        <img src={images[idx]} className="max-w-full max-h-[80vh] object-contain"/>
      </div>
      <div className="p-4 flex justify-center gap-2">{images.map((_,i)=><div key={i} onClick={()=>setIdx(i)} className={`w-12 h-12 rounded-md overflow-hidden border-2 ${i===idx?'border-white':'border-transparent opacity-60'}`}><img src={images[i]} className="w-full h-full object-cover"/></div>)}</div>
    </div>
  )
}
function LikersPopup({ postId, colName, onClose }:{ postId:string, colName:string, onClose:()=>void }){
  const [likers,setLikers]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    const fetchLikers=async()=>{
      try{
        const snap=await getDocs(collection(db,colName,postId,"likes"));
        const ids=snap.docs.map(d=>d.id);
        const users:any[]=[];
        for(const uid of ids.slice(0,30)){
          const uDoc=await getDoc(doc(db,"users",uid));
          if(uDoc.exists()) users.push({uid,...uDoc.data()});
          else users.push({uid, displayName:"Mizo User"});
        }
        setLikers(users);
      }catch(e){} setLoading(false);
    }; fetchLikers();
  },[postId]);
  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-[380px] rounded-t-[20px] sm:rounded-[20px] max-h-[70vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center"><p className="font-black text-[16px]">Likes</p><button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">✕</button></div>
        <div className="overflow-y-auto flex-1 p-2">
          {loading? <p className="text-center py-8 text-gray-400 text-[13px]">Loading...</p> : likers.length===0? <p className="text-center py-8 text-gray-400">No likes yet</p> :
          likers.map(u=><div key={u.uid} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl"><img src={u.photoURL || u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName||"Mizo User")}&background=002f34&color=fff`} className="w-10 h-10 rounded-full object-cover"/><span className="font-bold text-[14px]">{u.displayName || u.name || "Mizo User"}</span></div>)}
        </div>
      </div>
    </div>
  )
}
export default function Home(){
  const [ads,setAds]=useState<any[]>([]);
  const [allAdsForSearch,setAllAdsForSearch]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");
  const [loading,setLoading]=useState(true);
  const [lastDoc,setLastDoc]=useState<QueryDocumentSnapshot | null>(null);
  const [hasMore,setHasMore]=useState(true);
  const [isLoadingMore,setIsLoadingMore]=useState(false);
  const [debouncedSearch,setDebouncedSearch]=useState("");
  const [user,setUser]=useState<any>(null);
  const [showLoginAlert,setShowLoginAlert]=useState(false);
  const [selectedPostId,setSelectedPostId]=useState<string|null>(null);
  const [userMap,setUserMap]=useState<Record<string,any>>({});
  const [likeIds,setLikeIds]=useState<Set<string>>(new Set());
  const [likeCounts,setLikeCounts]=useState<Record<string,number>>({});
  const [commentCounts,setCommentCounts]=useState<Record<string,number>>({});
  const [viewerImgs,setViewerImgs]=useState<string[]|null>(null);
  const [viewerStart,setViewerStart]=useState(0);
  const [likersPost,setLikersPost]=useState<{id:string, type:string}|null>(null);
  const scrollPosRef = useRef<number>(0);
  const router = useRouter();
  const isFirstLoad = useRef(true);

  useEffect(()=>{
    if(ads.length > 0 &&!loading){
      const saved = sessionStorage.getItem("mzHomeScroll");
      if(saved && isFirstLoad.current){
        const y = parseInt(saved);
        setTimeout(()=> window.scrollTo(0, y), 100);
        setTimeout(()=> window.scrollTo(0, y), 400);
      }
      isFirstLoad.current = false;
    }
  },[ads, loading]);
    useEffect(()=>{
    const onScroll = () => {
      if(!loading &&!selectedPostId &&!viewerImgs &&!likersPost && ads.length>0){
        sessionStorage.setItem("mzHomeScroll", String(window.scrollY));
      }
    };
    window.addEventListener("scroll", onScroll, {passive:true});
    return ()=> window.removeEventListener("scroll", onScroll);
  },[loading, selectedPostId, ads, viewerImgs, likersPost]);

  const saveScroll = () => {
    sessionStorage.setItem("mzHomeScroll", String(window.scrollY));
    sessionStorage.setItem("mz_is_back", "1");
  };

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      setUser(u);
      if(u){
        const likeSnap=await getDocs(collection(db,"users",u.uid,"likes"));
        setLikeIds(new Set(likeSnap.docs.map(d=>d.data().productId)));
      }
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{ const t=setTimeout(()=>setDebouncedSearch(search.trim()),350); return ()=>clearTimeout(t); },[search]);

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
    }catch(e){}
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
        }catch{ cc[ad.id]=ad.commentsCount||0; }
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
      const updated = [ad.id,...viewed.filter((x:string)=>x!==ad.id)].slice(0,300);
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
    }catch(e){}
  };

  const loadAds = useCallback(async (isNewCat=false)=>{
    setLoading(isNewCat);
    try{
      let allAds:any[] = [];
      if(cat==="All"){
        const q1=query(collection(db,"products"), orderBy("createdAt","desc"), limit(80));
        const q2=query(collection(db,"jobs"), orderBy("createdAt","desc"), limit(30));
        const [snap1,snap2]=await Promise.all([getDocs(q1), getDocs(q2).catch(()=>({docs:[]} as any))]);
        const p1=snap1.docs.map(d=>({id:d.id,...d.data() as any, _type:"product"}));
        const p2=(snap2 as any).docs.map((d:any)=>({id:d.id,...d.data() as any, _type:"job"}));
        allAds=[...p1,...p2];
      }else if(cat==="Jobs"){
        const q=query(collection(db,"jobs"), orderBy("createdAt","desc"), limit(60));
        const snap=await getDocs(q);
        allAds=snap.docs.map(d=>({id:d.id,...d.data() as any, _type:"job"}));
      }else{
        const q=query(collection(db,"products"), where("category","==",cat), orderBy("createdAt","desc"), limit(80));
        const snap=await getDocs(q);
        allAds = snap.docs.map(d=>({id:d.id,...d.data() as any, _type:"product"}));
      }
      const uid = auth.currentUser?.uid || "guest";
      const cacheKey = `mz_feed_cache_${cat}_${uid}`;
      const isBackNav = sessionStorage.getItem("mz_is_back")==="1";
      const cachedStr = sessionStorage.getItem(cacheKey);
      if(isBackNav && cachedStr &&!isNewCat && cat==="All"){
        try{
          const cachedIds: string[] = JSON.parse(cachedStr);
          const mapById = new Map(allAds.map((a:any)=>[a.id,a]));
          const restored = cachedIds.map(id=>mapById.get(id)).filter(Boolean);
          if(restored.length>10){
            setAds(restored); fetchUserProfiles(restored);
            if(allAdsForSearch.length===0) setAllAdsForSearch(allAds);
            setLoading(false); sessionStorage.removeItem("mz_is_back"); return;
          }
        }catch{}
      }
      // INSTAGRAM STYLE: i en ngun category kha a lang hmasa
      const viewedSet = new Set<string>(JSON.parse(localStorage.getItem(`mz_viewed_${uid}`)||"[]"));
      const catScores:Record<string,number> = JSON.parse(localStorage.getItem(`mz_score_${uid}`)||"{}");
      const topCats = Object.entries(catScores).sort((a,b)=> (b[1] as number)-(a[1] as number)).slice(0,4).map(x=>x[0]);
      const scored = allAds.map(ad=>{
        const isViewed = viewedSet.has(ad.id);
        const catScore = (catScores[ad.category||""]||0);
        const isTopCat = topCats.includes(ad.category);
        let catPoint = catScore * 35; if(isTopCat) catPoint += 50;
        const t = ad.createdAt?.toMillis? ad.createdAt.toMillis() : new Date(ad.createdAt||0).getTime();
        const ageH = (Date.now()-t)/(1000*3600);
        const fresh = Math.max(0, 100 - ageH*0.6);
        let score = catPoint + fresh + Math.random()*30;
        if(isViewed) score -= 100; if(ageH > 96) score -= 60;
        return {...ad, _score: score, _viewed: isViewed, _isTopCat: isTopCat};
      });
      let finalAds:any[];
      if(cat==="All"){
        const favUnseen = scored.filter((a:any)=>a._isTopCat &&!a._viewed).sort((a,b)=> b._score - a._score);
        const otherUnseen = scored.filter((a:any)=>!a._isTopCat &&!a._viewed).sort((a,b)=> b._score - a._score);
        const seen = scored.filter((a:any)=>a._viewed).sort((a,b)=> b._score - a._score);
        finalAds = [...favUnseen.slice(0,12),...otherUnseen.slice(0,8),...favUnseen.slice(12,20),...seen.slice(0,8)].slice(0,40);
        // shuffle fav slightly like insta
        finalAds = [...finalAds].sort(()=> Math.random()-0.4).slice(0,40).sort((a,b)=> b._score - a._score + (Math.random()*20-10));
      }else{
        finalAds = scored.sort((a,b)=> b._score - a._score).slice(0,40);
      }
      sessionStorage.setItem(cacheKey, JSON.stringify(finalAds.map((a:any)=>a.id)));
      sessionStorage.removeItem("mz_is_back");
      const map = new Map(); finalAds.forEach((ad:any)=> map.set(ad.id, ad));
      setAds(Array.from(map.values()));
      fetchUserProfiles(Array.from(map.values()));
      if(cat==="All" && allAdsForSearch.length===0) setAllAdsForSearch(allAds);
      setLastDoc(null); setHasMore(true);
    }catch(e){ console.log(e); }
    setLoading(false);
  },[cat, user]);

  useEffect(()=>{ loadAds(true); },[loadAds]);

  const toggleLike = async(e:any, ad:any)=>{
    e.preventDefault(); e.stopPropagation();
    if(!user){ setShowLoginAlert(true); return; }
    const postId = ad.id; const colName = ad._type==="job"? "jobs" : "products";
    const likeRef = doc(db,"users",user.uid,"likes",postId);
    const postRef = doc(db,colName,postId);
    const subLikeRef = doc(db,colName,postId,"likes",user.uid);
    try{
      if(likeIds.has(postId)){
        await deleteDoc(likeRef); await deleteDoc(subLikeRef).catch(()=>{});
        await updateDoc(postRef, { likes: arrayRemove(user.uid), likeCount: increment(-1) }).catch(()=>{});
        setLikeIds(prev=>{ const n=new Set(prev); n.delete(postId); return n; });
        setLikeCounts(prev=>{ const c={...prev}; c[postId]=Math.max(0,(c[postId]??getLikeCount(ad))-1); return c; });
      }else{
        await setDoc(likeRef,{productId:postId, createdAt:new Date()});
        await setDoc(subLikeRef,{userId:user.uid, createdAt:new Date()}).catch(()=>{});
        await updateDoc(postRef, { likes: arrayUnion(user.uid), likeCount: increment(1) }).catch(async()=>{ await setDoc(postRef, { likes: arrayUnion(user.uid), likeCount: increment(1) }, {merge:true}); });
        setLikeIds(prev=>{ const n=new Set(prev); n.add(postId); return n; });
        setLikeCounts(prev=>{ const c={...prev}; c[postId]=(c[postId]??getLikeCount(ad))+1; return c; });
        const ownerId = getPostUserId(ad); if(ownerId) await createNoti(ownerId, ad, "like");
      }
    }catch(err){ console.log(err); }
  };  const categories=["All","Cars","Properties","Mobiles","Jobs","Bikes","Furniture","Fashion","Electronics","Cosmetics","Others"];

  // SEARCH: post zawng zawng search thei
  const baseList = debouncedSearch? (allAdsForSearch.length>0? allAdsForSearch : ads) : ads;
  const filtered = baseList.filter(a=>{
    if(!debouncedSearch) return true;
    const s=debouncedSearch.toLowerCase();
    return (a.title?.toLowerCase().includes(s) || a.description?.toLowerCase().includes(s) || a.desc?.toLowerCase().includes(s) || a.location?.toLowerCase().includes(s) || a.category?.toLowerCase().includes(s) || a.khua?.toLowerCase().includes(s));
  }).sort((a:any,b:any)=>{
    if(!debouncedSearch) return 0;
    // search ah chuan relevance
    const s=debouncedSearch.toLowerCase();
    const aTitle = a.title?.toLowerCase().includes(s)? 2 : 0;
    const bTitle = b.title?.toLowerCase().includes(s)? 2 : 0;
    return bTitle - aTitle;
  });

  // cat filter for search results
  const finalFiltered = cat==="All" || debouncedSearch? filtered : filtered.filter(a=> a.category===cat || (cat==="Jobs" && a._type==="job"));

  return (
    <main className="min-h-screen bg-[#f2f2f2]">
      <div className="bg-white sticky top-0 z-20 p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center border-[1.5px] border-[#002f34] rounded-md px-3 py-[9px] gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#002f34" strokeWidth="2.5"><circle cx="11" cy="11" r="6"/><path d="M21 21l-4.3-4.3"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find Cars, Mobile..." className="flex-1 outline-none text-[14px] bg-transparent"/>
          </div>
          <button onClick={()=> router.push(user? "/account" : "/login")} className="h-9 px-5 bg-white border-[1.5px] border-black rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-black font-black text-[11px] tracking-wide">LOGIN</span>
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
          {categories.map(c=>(<button key={c} onClick={()=>{ sessionStorage.setItem("mzHomeScroll","0"); if(!debouncedSearch) setCat(c); else { setCat(c); setSearch(""); } }} className={`whitespace-nowrap px-4 py-1.5 rounded-full border text-[13px] font-black ${cat===c &&!debouncedSearch?'bg-[#002f34] text-white border-[#002f34]':'bg-white text-[#002f34] border-gray-300'}`}>{c}</button>))}
        </div>
        {debouncedSearch && <p className="text-[12px] text-gray-500 mt-2 font-bold">{filtered.length} results for "{debouncedSearch}"</p>}
      </div>

      <div className="flex flex-col">
        {finalFiltered.map(ad=>{
          const postUid = getPostUserId(ad);
          const u = userMap[postUid || ""];
          const realName = getUserNameFromDoc(u) || ad.userName || "Mizo User";
          const realPic = getUserPicFromDoc(u) || ad.userPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(realName)}&background=002f34&color=fff&bold=true`;
          const allImages = ad.images && ad.images.length>0? ad.images : (ad.image? [ad.image] : []);
          const phone = ad.phone || ad.mobile || ad.whatsapp || ad.contact || ad.sellerPhone || u?.phone || "";
          const colName = ad._type==="job"? "jobs":"products";
          const likeCount = (likeCounts[ad.id]?? getLikeCount(ad));
          const commentCount = (commentCounts[ad.id]?? ad.commentsCount?? 0);
          return (
            <div key={ad.id} className="bg-white mb-2 w-full">
              <div className="flex items-center gap-3 p-3">
                <img onClick={(e)=>{ e.stopPropagation(); if(postUid){ trackView(ad); saveScroll(); router.push(`/seller/${postUid}`); } }} src={realPic} className="w-10 h-10 rounded-full object-cover border cursor-pointer active:scale-95" alt="profile"/>
                <div className="flex flex-col">
                  <span onClick={(e)=>{ e.stopPropagation(); if(postUid){ trackView(ad); saveScroll(); router.push(`/seller/${postUid}`); } }} className="font-bold text-[15px] leading-none cursor-pointer">{realName}</span>
                  <span className="text-[12px] text-gray-500 mt-1">{timeAgo(ad.createdAt)} {ad._isTopCat && cat==="All" &&!debouncedSearch? "• For you" : ""}</span>
                </div>
              </div>
              <div className="px-3 pb-1" onClick={()=>{ trackView(ad); saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><h2 className="font-bold text-[16px] text-[#002f34] line-clamp-1">{ad.title}</h2></div>
              <div className="px-3 pb-3" onClick={()=>{ trackView(ad); saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}><p className="text-[15px] font-medium text-[#222] leading-[1.4] line-clamp-3">{ad.description || ad.desc || ""}</p></div>

              <div className="relative w-full bg-black">
                {(ad._type==="job" && allImages.length===0)? (
                  <div onClick={()=>{ trackView(ad); saveScroll(); router.push(`/jobs/${ad.id}`); }} className="w-full h-[340px] bg-[#f3f4f6] flex items-center justify-center p-3"><p className="text-[22px] font-black text-[#002f34] text-center leading-tight capitalize">{ad.title || "Job"}</p></div>
                ) : (<FeedImageSlider imgs={allImages} title={ad.title} onImageClick={(i)=>{ setViewerImgs(allImages); setViewerStart(i); }} />)}
              </div>

              <div className="px-3 pt-2.5 pb-1 flex items-center justify-between">
                <div className="flex flex-col" onClick={()=>{ trackView(ad); saveScroll(); router.push(ad._type==="job"? `/jobs/${ad.id}` : `/marketplace/${ad.id}`); }}>
                  <p className="font-black text-[18px] text-[#002f34]">₹ {Number(ad.price || ad.salary || 0).toLocaleString("en-IN") || "0"}</p>
                  <div className="flex items-center gap-1 text-gray-500 mt-[2px]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span className="text-[11px] font-bold uppercase">{ad.khua || ad.location || "AIZAWL"}, {ad.district || "MIZORAM"}</span></div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e)=>{ e.stopPropagation(); if(phone){ const num = phone.replace(/\D/g,'').slice(-10); window.open(`https://wa.me/91${num}?text=Hi, ka lo hmu che ${ad.title} chungchang ah`, '_blank'); } }} className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center shadow active:scale-90">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19.05 4.9A9.82 9.82 0 0 0 12.04 2C6.51 2 2.04 6.48 2.04 12c0 1.76.46 3.47 1.33 4.98L2 22l5.15-1.34A9.82 9.82 0 0 0 12.04 22c5.53 0 10-4.47 10-10 0-2.67-1.04-5.18-2.99-7.1zM12.04 20a7.8 7.8 0 0 1-3.98-1.08l-.28-.17-3.06.8.82-2.98-.18-.3a7.9 7.9 0 0 1-1.22-4.27c0-4.37 3.56-7.93 7.93-7.93a7.88 7.88 0 0 1 5.62 2.33 7.86 7.86 0 0 1 2.31 5.59c0 4.38-3.56 7.94-7.94 7.94zm4.35-5.94c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.01-.37-1.92-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.39-.4-.54-.4h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.69 2.58 4.1 3.62.57.25 1.02.4 1.37.51.58.18 1.1.16 1.51.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28z"/></svg>
                  </button>
                  <button onClick={(e)=>{ e.stopPropagation(); if(phone){ window.location.href=`tel:${phone}`; } }} className="w-9 h-9 rounded-full bg-[#002f34] flex items-center justify-center shadow active:scale-90">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.68A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0.7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.03 12.03 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-5 px-3 py-3 mt-1 border-t border-gray-100">
                <button onClick={(e)=>toggleLike(e,ad)} className="flex items-center gap-1.5 active:scale-90">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill={likeIds.has(ad.id)? "#ff3040" : "none"} stroke={likeIds.has(ad.id)? "#ff3040" : "black"} strokeWidth={likeIds.has(ad.id)? 2 : 1.6}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className={`text-[15px] font-bold ${likeIds.has(ad.id)? 'text-[#ff3040]' : 'text-black'}`}>{likeCount}</span>
                </button>
                <button onClick={(e)=>{ e.stopPropagation(); if(!user){ setShowLoginAlert(true); return; } scrollPosRef.current = window.scrollY; saveScroll(); setSelectedPostId(ad.id); }} className="flex items-center gap-1.5 active:scale-90">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.6"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 7.9 5.3 8.38 8.38 0 0 1.1 2.2Z"/></svg>
                  <span className="text-[15px] font-bold text-black">{commentCount}</span>
                </button>
                <button onClick={(e)=>{ e.stopPropagation(); if(navigator.share) navigator.share({url: `${window.location.origin}/marketplace/${ad.id}`, title: ad.title}) }} className="flex items-center active:scale-90 ml-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>
                </button>
              </div>

              {/* LIKE LIST - FB ANG */}
              {likeCount>0 && (
                <div className="px-3 pb-3">
                  <button onClick={()=> setLikersPost({id:ad.id, type:colName})} className="text-[13px] font-bold text-gray-600 text-left">
                    {likeCount===1? "1 like" : `${likeCount} likes`} {likeIds.has(ad.id) && likeCount>1? "• You and others" : likeIds.has(ad.id)? "• You liked" : ""}
                  </button>
                  <button onClick={()=> setLikersPost({id:ad.id, type:colName})} className="block text-[12px] text-gray-500 mt-0.5">
                    Liked by • View all likers
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {loading && <div className="flex flex-col gap-2">{[1,2,3].map(i=><div key={i} className="bg-white h-[420px] animate-pulse"/>)}</div>}
      {finalFiltered.length===0 &&!loading && <p className="text-center py-10 text-gray-400 font-bold">No posts found</p>}

      {viewerImgs && <ImageViewer images={viewerImgs} startIndex={viewerStart} onClose={()=> setViewerImgs(null)} />}
      {likersPost && <LikersPopup postId={likersPost.id} colName={likersPost.type} onClose={()=> setLikersPost(null)} />}

      {showLoginAlert && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-[300px] p-6 shadow-2xl text-center">
            <p className="font-bold text-[16px] text-[#002f34]">Login hmasa phawt rawh</p>
            <p className="text-[12px] text-gray-500 mt-1">Like, Comment ti tur chuan login a ngai</p>
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
              const colName = ads.find((a:any)=>a.id===pid)?._type==="job"? "jobs":"products";
              const snap = await getDocs(collection(db,colName,pid,"comments"));
              setCommentCounts(prev=>({...prev, [pid]: snap.size}));
            }catch{}
          }}
        />
      )}
    </main>
  );
}

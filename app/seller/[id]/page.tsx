"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, addDoc, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

function timeAgo(ts:any){
  if(!ts) return "";
  try{
    const d = ts.toDate? ts.toDate() : new Date(ts.seconds? ts.seconds*1000 : ts);
    const diff = Math.floor((Date.now() - d.getTime())/1000);
    if(diff < 60) return "just now";
    if(diff < 3600) return Math.floor(diff/60)+"m ago";
    if(diff < 86400) return Math.floor(diff/3600)+" hrs ago";
    if(diff < 172800) return "yesterday";
    if(diff < 604800) return Math.floor(diff/86400)+"d ago";
    return d.toLocaleDateString();
  }catch{ return ""; }
}
function formatMemberSince(ts:any){
  if(!ts) return "Set ve loh";
  try{
    const d = ts.toDate? ts.toDate() : new Date(ts.seconds? ts.seconds*1000 : ts);
    return d.toLocaleDateString('en-GB', { month:'short', year:'numeric' });
  }catch{ return "Set ve loh"; }
}
function formatDob(dob:any){
  if(!dob) return "Set ve loh";
  try{
    if(typeof dob === 'string' && dob.includes('-')){
      const dt = new Date(dob);
      if(!isNaN(dt.getTime())) return dt.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
      return dob;
    }
    const d = dob.toDate? dob.toDate() : new Date(dob.seconds? dob.seconds*1000 : dob);
    return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  }catch{ return typeof dob==='string'? dob : "Set ve loh"; }
}
function getDisplayName(seller:any, fallbackPost:any){
  if(seller?.displayName?.trim()) return seller.displayName.trim();
  if(seller?.fullName?.trim()) return seller.fullName.trim();
  if(seller?.name?.trim()) return seller.name.trim();
  if(seller?.userName?.trim()) return seller.userName.trim();
  if(seller?.email) return seller.email.split('@')[0];
  if(fallbackPost?.sellerName) return fallbackPost.sellerName;
  if(fallbackPost?.userName) return fallbackPost.userName;
  return "Mizo User";
}
function getPhotoURL(seller:any){
  if(!seller) return null;
  return seller.photoURL || seller.profilePic || seller.avatar || seller.image || seller.profileImage || seller.photo || null;
}

export default function SellerProfile(){
  const params = useParams();
  const sid = params.id as string;
  const router = useRouter();
  const [seller,setSeller] = useState<any>(null);
  const [posts,setPosts] = useState<any[]>([]);
  const [currentUser,setCurrentUser] = useState<any>(null);
  const [wished,setWished] = useState<Set<string>>(new Set());
  const [liked,setLiked] = useState<Set<string>>(new Set());
  const [likeCounts,setLikeCounts] = useState<Record<string,number>>({});
  const [commentCounts,setCommentCounts] = useState<Record<string,number>>({});
  const [showMenu,setShowMenu] = useState(false);
  const [showReport,setShowReport] = useState(false);
  const [reportMsg,setReportMsg] = useState("");
  const [reporting,setReporting] = useState(false);
  const [showSuccess,setShowSuccess] = useState(false);
  const [errorMsg,setErrorMsg] = useState("");
  const [showPic,setShowPic] = useState(false);
  const [commentPostId,setCommentPostId] = useState<string|null>(null);
  const [comments,setComments] = useState<any[]>([]);
  const [commentText,setCommentText] = useState("");
  const [commenting,setCommenting] = useState(false);
  const [loadingComments,setLoadingComments] = useState(false);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth,(u)=>setCurrentUser(u));
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const loadComments = async()=>{
      if(!commentPostId) return;
      setLoadingComments(true);
      try{
        const q = query(collection(db,"products",commentPostId,"comments"), orderBy("createdAt","asc"));
        const snap = await getDocs(q);
        const list:any[]=[];
        snap.forEach(d=>{ list.push({id:d.id,...d.data()}); });
        setComments(list);
      }catch{
        const snap = await getDocs(collection(db,"products",commentPostId,"comments"));
        const list:any[]=[];
        snap.forEach(d=>{ list.push({id:d.id,...d.data()}); });
        setComments(list);
      }
      setLoadingComments(false);
    };
    loadComments();
  },[commentPostId]);

  useEffect(()=>{
    const load = async()=>{
      if(!sid) return;
      const sSnap = await getDoc(doc(db,"users",sid));
      let sData:any=null;
      if(sSnap.exists()){ sData=sSnap.data(); setSeller(sData); }
      const map = new Map();
      const tryQ = async(f:string,v:any)=>{
        if(!v) return;
        try{
          const q = query(collection(db,"products"), where(f,"==",v));
          const snap = await getDocs(q);
          snap.docs.forEach(d=>{ map.set(d.id,{id:d.id,...d.data()}); });
        }catch{}
      };
      await tryQ("userId",sid);
      await tryQ("uid",sid);
      await tryQ("sellerId",sid);
      if(sData?.email) await tryQ("userEmail",sData.email);
      const all = Array.from(map.values());
      setPosts(all);
      const lc:Record<string,number>={};
      const cc:Record<string,number>={};
      const lSet = new Set<string>();
      for(const p of all){
        const snap = await getDoc(doc(db,"products",p.id));
        const fd = snap.exists()? snap.data() as any : p;
        let likeNum = 0;
        if(typeof fd.likeCount==='number') likeNum=fd.likeCount;
        else if(typeof fd.likesCount==='number') likeNum=fd.likesCount;
        else if(Array.isArray(fd.likes)) likeNum=fd.likes.length;
        else if(Array.isArray(fd.likedBy)) likeNum=fd.likedBy.length;
        if(auth.currentUser){
          const uid=auth.currentUser.uid;
          if(Array.isArray(fd.likes)&&fd.likes.includes(uid)) lSet.add(p.id);
          if(Array.isArray(fd.likedBy)&&fd.likedBy.includes(uid)) lSet.add(p.id);
        }
        lc[p.id]=likeNum;
        let cNum = typeof fd.commentCount==='number'? fd.commentCount : typeof fd.commentsCount==='number'? fd.commentsCount : 0;
        if(cNum===0){
          try{ const cs=await getDocs(collection(db,"products",p.id,"comments")); cNum=cs.size; }catch{}
        }
        cc[p.id]=cNum;
      }
      setLikeCounts(lc);
      setCommentCounts(cc);
      setLiked(lSet);
    };
    load();
  },[sid]);

  const toggleWish = async(e:any,pid:string)=>{
    e.preventDefault(); e.stopPropagation();
    const u = auth.currentUser || currentUser;
    if(!u){ router.push("/login"); return; }
    const ref = doc(db,"users",u.uid,"wishlist",pid);
    if(wished.has(pid)){
      await deleteDoc(ref);
      setWished(prev=>{ const n=new Set(prev); n.delete(pid); return n; });
    }else{
      await setDoc(ref,{productId:pid,createdAt:serverTimestamp()});
      setWished(prev=>{ const n=new Set(prev); n.add(pid); return n; });
    }
  };

  const toggleLike = async(e:any,pid:string)=>{
    e.preventDefault(); e.stopPropagation();
    const u = auth.currentUser || currentUser;
    if(!u){ router.push("/login"); return; }
    const prodRef = doc(db,"products",pid);
    const likeRef = doc(db,"products",pid,"likes",u.uid);
    if(liked.has(pid)){
      setLiked(prev=>{ const n=new Set(prev); n.delete(pid); return n; });
      setLikeCounts(prev=>{ const c={...prev}; c[pid]=Math.max(0,(c[pid]||1)-1); return c; });
      try{ await deleteDoc(likeRef); await updateDoc(prodRef,{likes:arrayRemove(u.uid),likedBy:arrayRemove(u.uid),likeCount:increment(-1),likesCount:increment(-1)}); }catch{}
    }else{
      setLiked(prev=>{ const n=new Set(prev); n.add(pid); return n; });
      setLikeCounts(prev=>{ const c={...prev}; c[pid]=(c[pid]||0)+1; return c; });
      try{ await setDoc(likeRef,{userId:u.uid,createdAt:serverTimestamp()}); await updateDoc(prodRef,{likes:arrayUnion(u.uid),likedBy:arrayUnion(u.uid),likeCount:increment(1),likesCount:increment(1)}); }catch{
        try{ await setDoc(prodRef,{likes:arrayUnion(u.uid),likeCount:increment(1)},{merge:true}); }catch{}
      }
    }
  };

  const submitComment = async()=>{
    if(!commentPostId ||!commentText.trim()) return;
    const u = auth.currentUser || currentUser;
    if(!u){ router.push("/login"); return; }
    setCommenting(true);
    try{
      await addDoc(collection(db,"products",commentPostId,"comments"),{text:commentText.trim(),userId:u.uid,userName:u.displayName||u.email?.split('@')[0]||"User",userPhoto:u.photoURL||"",createdAt:serverTimestamp()});
      await updateDoc(doc(db,"products",commentPostId),{commentCount:increment(1),commentsCount:increment(1)});
      setCommentCounts(prev=>{ const c={...prev}; c[commentPostId]=(c[commentPostId]||0)+1; return c; });
      setCommentText("");
      const snap = await getDocs(collection(db,"products",commentPostId,"comments"));
      const list:any[]=[];
      snap.forEach(d=>{ list.push({id:d.id,...d.data()}); });
      setComments(list);
    }catch{} finally{ setCommenting(false); }
  };

  const doReport = async()=>{
    if(!reportMsg.trim()){ setErrorMsg("Chhan ziak rawh"); return; }
    setReporting(true);
    try{
      const fp = posts.length>0? posts[0] : null;
      const nm = getDisplayName(seller, fp);
      await addDoc(collection(db,"reports"),{reportedUserId:sid,reporterId:currentUser?.uid||"anonymous",message:reportMsg.trim(),sellerName:nm||"",createdAt:serverTimestamp()});
      setShowReport(false); setReportMsg(""); setShowMenu(false); setShowSuccess(true);
    }catch(e:any){ setErrorMsg(e.message); } finally{ setReporting(false); }
  };

  if(!seller && posts.length===0) return <div className="p-10 text-center font-black">Loading...</div>;

  const fp = posts.length>0? posts[0] : null;
  const displayName = getDisplayName(seller, fp);
  const photoURL = getPhotoURL(seller);

  const memberSince = seller?.createdAt || seller?.joinedAt || seller?.memberSince || null;
  const dob = seller?.dob || seller?.dateOfBirth || seller?.birthDate || null;
  const khua = seller?.khua || seller?.village || seller?.hometown || null;
  const locationFull = seller?.location || seller?.address || seller?.district || null;
  const district = seller?.district || null;
  const gender = seller?.gender || null;

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-24">
      <div className="flex items-center justify-between p-3 pt-4 bg-[#f5f5f7] sticky top-0 z-50">
        <button onClick={()=>{ if(window.history.length>1) router.back(); else router.push("/"); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border active:scale-90">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19L5 12L12 5"/></svg>
        </button>
        <div className="relative">
          <button onClick={()=>setShowMenu(!showMenu)} className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-sm border active:scale-90">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="black"><circle cx="12" cy="5" r="2.5"/><circle cx="12" cy="12" r="2.5"/><circle cx="12" cy="19" r="2.5"/></svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-14 bg-white border rounded-2xl shadow-xl w-44 z-50 overflow-hidden">
              <button onClick={()=>{ setShowReport(true); setShowMenu(false); }} className="w-full text-left px-4 py-3.5 text-[13px] font-bold">🚩 Report User</button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-3 mt-1 bg-[#111111] rounded-[32px] p-6 text-white">
        <div className="flex items-center gap-5">
          <button onClick={()=>{ if(photoURL) setShowPic(true); }} className="w-[92px] h-[92px] rounded-full bg-white flex items-center justify-center font-black text-3xl overflow-hidden border-[3px] border-white/20">
            {photoURL? <img src={photoURL} className="w-full h-full object-cover" alt="" /> : displayName?.[0]?.toUpperCase()}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[22px] capitalize truncate">{displayName}</p>
            <p className="text-[13px] text-white/60 mt-1.5">{posts.length} Ads • Member since {formatMemberSince(memberSince)}</p>
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3">
        <div className="bg-white rounded-[26px] p-2 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-black px-4 pt-3 pb-1 text-gray-400 tracking-widest">PERSONAL INFO</p>

          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M4 4h16c1.1 0 2.9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div className="flex-1 min-w-0"><p className="text-[11px] text-gray-400">Email</p><p className="text-[13px] font-bold truncate">{seller?.email||seller?.userEmail||"Private"}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>

          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.68A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0.7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            </div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Phone</p><p className="text-[13px] font-bold">{seller?.phone||seller?.phoneNumber||"Set ve loh"}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>

          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Khua / Village</p><p className="text-[13px] font-bold">{khua || locationFull || "Aizawl"}{district? `, ${district}`: ""}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>

          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Date of Birth</p><p className="text-[13px] font-bold">{formatDob(dob)}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>

          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11v2"/><path d="M17 11v2"/></svg>
            </div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Gender</p><p className="text-[13px] font-bold capitalize">{gender || "Set ve loh"}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>

          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Member Since</p><p className="text-[13px] font-bold">{formatMemberSince(memberSince)}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>

          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 8 9"/></svg>
            </div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Total Ads</p><p className="text-[13px] font-bold">{posts.length} Active Ads</p></div><span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full font-black">{posts.length}</span>
          </div>
        </div>

        <div className="bg-white rounded-[26px] p-4 border border-gray-100 shadow-sm">
          <h2 className="font-black text-[16px] mb-3 flex items-center gap-2">{displayName} Ads <span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full">{posts.length}</span></h2>
          <div className="flex flex-col gap-3">
            {posts.map((p:any)=>(
              <div key={p.id} className="bg-[#fafafa] border border-gray-100 rounded-[20px] p-2.5 flex gap-3 relative">
                <Link href={`/marketplace/${p.id}`} className="w-[108px] h-[108px] flex-shrink-0"><img src={p.image||p.images?.[0]} className="w-full h-full object-cover rounded-[16px]" alt="" /></Link>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link href={`/marketplace/${p.id}`}><p className="font-bold text-[14px] line-clamp-2">{p.title}</p><p className="font-black text-[18px] mt-2">₹{Number(p.price).toLocaleString("en-IN")}</p><p className="text-[11px] text-gray-500 mt-1 truncate">{p.village||p.location?.split(",")[0]||khua||"Aizawl"} • {timeAgo(p.createdAt)}</p></Link>
                  </div>
                  <div className="flex items-center gap-2.5 mt-2.5">
                    <button type="button" onClick={(e)=>toggleLike(e,p.id)} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full shadow-sm border-2 ${liked.has(p.id)?"bg-black text-white border-black":"bg-white border-gray-200"}`}><span>{liked.has(p.id)?"❤️":"🤍"}</span><span className="text-[13px] font-black">{likeCounts[p.id]??0}</span></button>
                    <button type="button" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setCommentPostId(p.id); }} className="flex items-center gap-1.5 bg-white border-2 border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm"><span>💬</span><span className="text-[13px] font-black">{commentCounts[p.id]??0}</span></button>
                  </div>
                </div>
                <button type="button" onClick={(e)=>toggleWish(e,p.id)} className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border">{wished.has(p.id)?"❤️":"🤍"}</button>
           

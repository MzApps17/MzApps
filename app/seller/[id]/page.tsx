"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, addDoc, serverTimestamp, updateDoc, increment, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

function timeAgo(ts:any){
  if(!ts) return "";
  try{
    const d = ts.toDate? ts.toDate() : new Date(ts.seconds? ts.seconds*1000 : ts);
    const diff = Math.floor((Date.now() - d.getTime())/1000);
    if(diff < 60) return "just now";
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)} hrs ago`;
    if(diff < 172800) return "yesterday";
    if(diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return d.toLocaleDateString();
  }catch{ return ""; }
}
function getDisplayName(seller:any, fallbackPost:any = null){
  if(seller?.displayName && seller.displayName.trim()!=="") return seller.displayName.trim();
  if(seller?.fullName && seller.fullName.trim()!=="") return seller.fullName.trim();
  if(seller?.name && seller.name.trim()!=="") return seller.name.trim();
  if(seller?.userName && seller.userName.trim()!=="") return seller.userName.trim();
  if(seller?.username && seller.username.trim()!=="") return seller.username.trim();
  if(seller?.email) return seller.email.split('@')[0];
  if(seller?.userEmail) return seller.userEmail.split('@')[0];
  if(fallbackPost){
    if(fallbackPost.sellerName) return fallbackPost.sellerName;
    if(fallbackPost.userName) return fallbackPost.userName;
    if(fallbackPost.displayName) return fallbackPost.displayName;
    if(fallbackPost.userEmail) return fallbackPost.userEmail.split('@')[0];
    if(fallbackPost.email) return fallbackPost.email.split('@')[0];
  }
  return "Mizo User";
}
function getPhotoURL(seller:any){
  if(!seller) return null;
  return seller.photoURL || seller.profilePic || seller.avatar || seller.image || seller.profileImage || seller.photo || null;
}

export default function SellerProfile(){
  const {id}=useParams();
  const router=useRouter();
  const [seller,setSeller]=useState<any>(null);
  const [posts,setPosts]=useState<any[]>([]);
  const [currentUser,setCurrentUser]=useState<any>(null);
  const [wished,setWished]=useState<Set<string>>(new Set());
  const [liked,setLiked]=useState<Set<string>>(new Set());
  const [likeCounts,setLikeCounts]=useState<Record<string,number>>({});
  const [commentCounts,setCommentCounts]=useState<Record<string,number>>({});
  const [showMenu,setShowMenu]=useState(false);
  const [showReport,setShowReport]=useState(false);
  const [reportMsg,setReportMsg]=useState("");
  const [reporting,setReporting]=useState(false);
  const [showSuccess,setShowSuccess]=useState(false);
  const [errorMsg,setErrorMsg]=useState("");
  const [showLoginAlert,setShowLoginAlert]=useState(false);
  const [showPic,setShowPic]=useState(false);
  // comment modal
  const [commentPostId,setCommentPostId]=useState<string|null>(null);
  const [commentText,setCommentText]=useState("");
  const [commenting,setCommenting]=useState(false);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,(u)=>setCurrentUser(u));
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const load=async()=>{
      const sSnap=await getDoc(doc(db,"users",id as string));
      let sellerData:any=null;
      if(sSnap.exists()){ sellerData=sSnap.data(); setSeller(sellerData); }

      let allMap = new Map();
      const tryQuery = async (field:string, value:any)=>{
        if(!value) return;
        try{
          const q=query(collection(db,"products"), where(field,"==",value));
          const snap=await getDocs(q);
          snap.docs.forEach(d=> allMap.set(d.id, {id:d.id,...d.data()}));
        }catch{}
      };
      await tryQuery("userId", id);
      await tryQuery("uid", id);
      await tryQuery("userUid", id);
      await tryQuery("sellerId", id);
      if(sellerData?.email) await tryQuery("userEmail", sellerData.email);
      if(sellerData?.email) await tryQuery("email", sellerData.email);

      const allPosts = Array.from(allMap.values());
      setPosts(allPosts);

      const lCounts:Record<string,number>={};
      const cCounts:Record<string,number>={};
      const likedSet=new Set<string>();
      for(const p of allPosts){
        try{
          const freshSnap = await getDoc(doc(db,"products", p.id));
          const freshData = freshSnap.exists()? freshSnap.data() as any : p;

          let lc = 0;
          if(typeof freshData.likeCount === 'number') lc = freshData.likeCount;
          else if(typeof freshData.likesCount === 'number') lc = freshData.likesCount;
          else if(Array.isArray(freshData.likes)) lc = freshData.likes.length;
          else if(Array.isArray(freshData.likedBy)) lc = freshData.likedBy.length;
          else { try{ const ls = await getDocs(collection(db,"products",p.id,"likes")); lc = ls.size; }catch{} }

          if(auth.currentUser){
            const uid = auth.currentUser.uid;
            if(Array.isArray(freshData.likes) && freshData.likes.includes(uid)) likedSet.add(p.id);
            if(Array.isArray(freshData.likedBy) && freshData.likedBy.includes(uid)) likedSet.add(p.id);
            if(Array.isArray(freshData.likedUsers) && freshData.likedUsers.includes(uid)) likedSet.add(p.id);
            try{ const ld = await getDoc(doc(db,"products",p.id,"likes",uid)); if(ld.exists()) likedSet.add(p.id); }catch{}
          }
          lCounts[p.id]=lc;

          let cc = 0;
          if(typeof freshData.commentCount === 'number') cc = freshData.commentCount;
          else if(typeof freshData.commentsCount === 'number') cc = freshData.commentsCount;
          else if(Array.isArray(freshData.comments)) cc = freshData.comments.length;
          else { try{ const cs = await getDocs(collection(db,"products",p.id,"comments")); cc = cs.size; }catch{} }
          cCounts[p.id]=cc;
        }catch{}
      }
      setLikeCounts(lCounts);
      setCommentCounts(cCounts);
      setLiked(likedSet);

      if(auth.currentUser){
        const ws=await getDocs(collection(db,"users",auth.currentUser.uid,"wishlist"));
        const set=new Set<string>();
        ws.forEach(d=>{ const pid=d.data().productId || d.data().jobId || d.id; if(pid) set.add(pid); });
        setWished(set);
      }
    };
    if(id) load();
  },[id, currentUser]);

  const toggleWish=async(e:any, pid:string)=>{
    e.preventDefault(); e.stopPropagation();
    const u = auth.currentUser || currentUser;
    if(!u){ router.push("/login"); return; }
    const wishRef=doc(db,"users",u.uid,"wishlist",pid);
    if(wished.has(pid)){
      await deleteDoc(wishRef);
      setWished(prev=>{ const n=new Set(prev); n.delete(pid); return n; });
    }else{
      await setDoc(wishRef,{productId:pid, createdAt:serverTimestamp()});
      setWished(prev=>{ const n=new Set(prev); n.add(pid); return n; });
    }
  };

  // ✅ HOME LEH PROFILE SYNC 100% - FIELD ZAWNG ZAWNG UPDATE
  const toggleLike=async(e:any, pid:string)=>{
    e.preventDefault(); e.stopPropagation();
    // @ts-ignore
    if(e.nativeEvent) e.nativeEvent.stopImmediatePropagation();
    const u = auth.currentUser || currentUser;
    if(!u){ router.push("/login"); return; }

    const prodRef=doc(db,"products",pid);
    const likeRef=doc(db,"products",pid,"likes",u.uid);

    if(liked.has(pid)){
      setLiked(prev=>{ const n=new Set(prev); n.delete(pid); return n; });
      setLikeCounts(prev=>({...prev, [pid]: Math.max(0,(prev[pid]||1)-1)}));
      try{
        await deleteDoc(likeRef);
        await updateDoc(prodRef,{
          likes: arrayRemove(u.uid),
          likedBy: arrayRemove(u.uid),
          likedUsers: arrayRemove(u.uid),
          likeCount: increment(-1),
          likesCount: increment(-1)
        });
      }catch{ try{ await updateDoc(prodRef,{ likeCount: increment(-1) }); }catch{} }
    }else{
      setLiked(prev=>{ const n=new Set(prev); n.add(pid); return n; });
      setLikeCounts(prev=>({...prev, [pid]: (prev[pid]||0)+1}));
      try{
        await setDoc(likeRef,{userId:u.uid, createdAt:serverTimestamp()});
        await updateDoc(prodRef,{
          likes: arrayUnion(u.uid),
          likedBy: arrayUnion(u.uid),
          likedUsers: arrayUnion(u.uid),
          likeCount: increment(1),
          likesCount: increment(1)
        });
      }catch{
        try{ await setDoc(prodRef,{ likes: arrayUnion(u.uid), likeCount: increment(1), likesCount: increment(1) }, {merge:true}); await setDoc(likeRef,{userId:u.uid, createdAt:serverTimestamp()}); }catch{}
      }
    }
  };

  const handleCommentSubmit=async()=>{
    if(!commentPostId ||!commentText.trim()) return;
    const u = auth.currentUser || currentUser;
    if(!u){ router.push("/login"); return; }
    setCommenting(true);
    try{
      await addDoc(collection(db,"products",commentPostId,"comments"),{
        text: commentText.trim(),
        userId: u.uid,
        userName: u.displayName || u.email?.split('@')[0] || "User",
        userPhoto: u.photoURL || "",
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db,"products",commentPostId),{
        commentCount: increment(1),
        commentsCount: increment(1)
      });
      setCommentCounts(prev=>({...prev, [commentPostId]: (prev[commentPostId]||0)+1}));
      setCommentText("");
      setCommentPostId(null);
    }catch(err){ console.log(err); }
    finally{ setCommenting(false); }
  };

  const handleReport=async()=>{
    if(!reportMsg.trim()){ setErrorMsg("Chhan ziak rawh"); return; }
    setReporting(true);
    try{
      const firstPost = posts.length > 0? posts[0] : null;
      const nameForReport = getDisplayName(seller, firstPost);
      await addDoc(collection(db,"reports"),{
        reportedUserId:id,
        reporterId: currentUser?.uid || "anonymous",
        message: reportMsg.trim(),
        sellerName: nameForReport || "",
        createdAt: serverTimestamp()
      });
      setShowReport(false); setReportMsg(""); setShowMenu(false);
      setShowSuccess(true);
    }catch(e:any){ setErrorMsg(e.message); }
    finally{ setReporting(false); }
  };

  if(!seller && posts.length===0) return <div className="p-10 text-center font-black">Loading...</div>;

  const firstPost = posts.length > 0? posts[0] : null;
  const displayName = getDisplayName(seller, firstPost);
  const photoURL = getPhotoURL(seller);

  return (
    <main className="min-h-screen bg-[#f5f5f7] pb-24">
      <div className="flex items-center justify-between p-3 pt-4 bg-[#f5f5f7] sticky top-0 z-50">
        <button onClick={()=>{ if(window.history.length>1) router.back(); else router.push("/"); }} className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">←</button>
        <div className="relative">
          <button onClick={()=>setShowMenu(!showMenu)} className="w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100">⋮</button>
          {showMenu && (
            <div className="absolute right-0 top-12 bg-white border rounded-2xl shadow-xl w-44 z-50 overflow-hidden">
              <button onClick={()=>{ if(!currentUser){ setShowMenu(false); setShowLoginAlert(true); return; } setShowReport(true); setShowMenu(false); }} className="w-full text-left px-4 py-3.5 text-[13px] font-bold">🚩 Report User</button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-3 mt-1 bg-[#111111] rounded-[32px] p-6 text-white">
        <div className="flex items-center gap-5">
          <button onClick={()=> photoURL && setShowPic(true)} className="w-[92px] h-[92px] rounded-full bg-white flex items-center justify-center font-black text-3xl overflow-hidden border-[3px] border-white/20">{photoURL? <img src={photoURL} className="w-full h-full object-cover"/> : displayName?.[0]?.toUpperCase()}</button>
          <div className="flex-1 min-w-0"><p className="font-black text-[22px] capitalize truncate">{displayName}</p><p className="text-[13px] text-white/60 mt-1.5">{posts.length} Ads</p></div>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3">
        <div className="bg-white rounded-[26px] p-2 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-black px-4 pt-2 pb-1 text-gray-400 tracking-widest">PERSONAL INFO</p>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">📧</div><div className="flex-1 min-w-0"><p className="text-[11px] text-gray-400">Email</p><p className="text-[13px] font-bold truncate">{seller?.email || seller?.userEmail || "Private"}</p></div></div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">📱</div><div className="flex-1"><p className="text-[11px] text-gray-400">Phone</p><p className="text-[13px] font-bold">{seller?.phone || "Set ve loh"}</p></div></div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">📍</div><div className="flex-1"><p className="text-[11px] text-gray-400">Khua</p><p className="text-[13px] font-bold">{seller?.khua || seller?.village || seller?.location || "Aizawl, Mizoram"}</p></div></div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">🎂</div><div className="flex-1"><p className="text-[11px] text-gray-400">Date of Birth</p><p className="text-[13px] font-bold">{seller?.dob? new Date(seller.dob).toLocaleDateString('en-GB') : "Set ve loh"}</p></div></div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center">📦</div><div className="flex-1"><p className="text-[11px] text-gray-400">Total Ads</p><p className="text-[13px] font-bold">{posts.length} Active Ads</p></div><span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full font-black">{posts.length}</span></div>
        </div>

        <div className="bg-white rounded-[26px] p-4 border border-gray-100 shadow-sm">
          <h2 className="font-black text-[16px] mb-3 flex items-center gap-2">{displayName} Ads <span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full">{posts.length}</span></h2>

          <div className="flex flex-col gap-3">
            {posts.map((p:any)=>(
              <div key={p.id} className="bg-[#fafafa] border border-gray-100 rounded-[20px] p-2.5 flex gap-3 relative">
                <Link href={`/marketplace/${p.id}`} className="w-[108px] h-[108px] flex-shrink-0"><img src={p.image || p.images?.[0]} className="w-full h-full object-cover rounded-[16px]"/></Link>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link href={`/marketplace/${p.id}`}><p className="font-bold text-[14px] line-clamp-2">{p.title}</p><p className="font-black text-[18px] mt-2">₹{Number(p.price).toLocaleString("en-IN")}</p><p className="text-[11px] text-gray-500 mt-1 truncate">{p.village || p.location?.split(",")[0] || "Aizawl"} • {timeAgo(p.createdAt)}</p></Link>
                  </div>
                  <div className="flex items-center gap-2.5 mt-2.5">
                    <button type="button" onClick={(e)=>toggleLike(e,p.id)} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full shadow-sm border-2 active:scale-90 transition ${liked.has(p.id)? "bg-black text-white border-black" : "bg-white border-gray-200"}`}>
                      <span>{liked.has(p.id)? "❤️":"🤍"}</span><span className="text-[13px] font-black">{likeCounts[p.id]?? 0}</span>
                    </button>
                    {/* ✅ COMMENT - POST DETAILS AH A KAL LO, HELAI AH NGEI COMMENT THEIH */}
                    <button type="button" onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); setCommentPostId(p.id); }} className="flex items-center gap-1.5 bg-white border-2 border-gray-200 px-3.5 py-1.5 rounded-full shadow-sm active:scale-90 transition">
                      <span>💬</span><span className="text-[13px] font-black">{commentCounts[p.id]?? 0}</span>
                    </button>
                  </div>
                </div>
                <button type="button" onClick={(e)=>toggleWish(e,p.id)} className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-[18px]">{wished.has(p.id)? "❤️":"🤍"}</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ COMMENT MODAL - HELAI VEK AH COMMENT THEIH */}
      {commentPostId && (
        <div className="fixed inset-0 bg-black/60 z-[1500] flex items-end sm:items-center justify-center p-0 sm:p-6 backdrop-blur-sm">
          <div className="bg-white rounded-t-[28px] sm:rounded-[26px] w-full sm:max-w-[420px] p-5 pb-8 shadow-2xl">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 sm:hidden"></div>
            <h3 className="font-black text-[16px]">Comment ziak rawh</h3>
            <p className="text-[12px] text-gray-400 mt-1">Home leh Profile ah a inthlun zawm vek ang</p>
            <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Comment tha tak ziak rawh..." autoFocus className="w-full mt-4 border-2 border-gray-200 p-3 rounded-2xl outline-none focus:border-black h-24 text-[14px] resize-none"/>
            <div className="flex gap-2 mt-4">
              <button onClick={()=>{ setCommentPostId(null); setCommentText(""); }} className="flex-1 bg-gray-100 font-bold py-3.5 rounded-xl">Cancel</button>
              <button onClick={handleCommentSubmit} disabled={commenting ||!commentText.trim()} className="flex-1 bg-black text-white font-black py-3.5 rounded-xl disabled:opacity-50">{commenting? "Posting...":"Post Comment"}</button>
            </div>
          </div>
        </div>
      )}

      {showReport && (<div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm"><div className="bg-white rounded-[22px] p-6 w-full max-w-[340px]"><h3 className="font-black">Report {displayName}</h3><textarea value={reportMsg} onChange={e=>setReportMsg(e.target.value)} placeholder="Report chhan..." className="w-full mt-4 border-2 p-3 rounded-xl h-28"/><div className="flex gap-2 mt-5"><button onClick={()=>setShowReport(false)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl">Cancel</button><button onClick={handleReport} className="flex-1 bg-black text-white font-bold py-3 rounded-xl">Report</button></div></div></div>)}
      {showSuccess && (<div className="fixed inset-0 bg-black/70 z-[1100] flex items-center justify-center p-6"><div className="bg-white rounded-[26px] p-7 w-full max-w-[340px] text-center"><h3 className="font-black mt-4">Report i thawn ta e</h3><button onClick={()=>setShowSuccess(false)} className="w-full bg-black text-white font-black py-3.5 rounded-xl mt-6">OK</button></div></div>)}
      {showPic && (<div onClick={()=>setShowPic(false)} className="fixed inset-0 bg-black/90 z-[1300] flex items-center justify-center p-4"><img src={photoURL || ""} className="max-w-full max-h-[85vh] rounded-[22px]"/></div>)}
      {showMenu && <div className="fixed inset-0 z-40" onClick={()=>setShowMenu(false)}></div>}
    </main>
  )
    }

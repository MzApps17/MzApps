"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
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

      // ✅ LIKE & COMMENT COUNT - HOME PAGE NEN INTHLUN ZAWM
      const lCounts:Record<string,number>={};
      const cCounts:Record<string,number>={};
      const likedSet=new Set<string>();
      for(const p of allPosts){
        try{
          const likeSnap=await getDocs(collection(db,"products",p.id,"likes"));
          lCounts[p.id]=likeSnap.size;
          if(auth.currentUser){
            likeSnap.forEach(ld=>{ if(ld.id===auth.currentUser?.uid) likedSet.add(p.id); });
          }
          // product doc ah likeCount a awm chuan chu pawh la tel
          if(p.likes?.length) lCounts[p.id]=p.likes.length;
          if(p.likeCount) lCounts[p.id]=p.likeCount;
          if(p.likesCount) lCounts[p.id]=p.likesCount;

          const commentSnap=await getDocs(collection(db,"products",p.id,"comments"));
          cCounts[p.id]=commentSnap.size;
          if(p.commentCount) cCounts[p.id]=p.commentCount;
          if(p.commentsCount) cCounts[p.id]=p.commentsCount;
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
  },[id]);

  const toggleWish=async(e:any, pid:string)=>{
    e.preventDefault(); e.stopPropagation();
    if(!currentUser) return router.push("/login");
    const wishRef=doc(db,"users",currentUser.uid,"wishlist",pid);
    if(wished.has(pid)){
      await deleteDoc(wishRef);
      setWished(prev=>{ const n=new Set(prev); n.delete(pid); return n; });
    }else{
      await setDoc(wishRef,{productId:pid, createdAt:serverTimestamp()});
      setWished(prev=>{ const n=new Set(prev); n.add(pid); return n; });
    }
  };

  // ✅ LIKE - HOME PAGE NEN INTHLUN ZAWM
  const toggleLike=async(e:any, pid:string)=>{
    e.preventDefault(); e.stopPropagation();
    if(!currentUser) return router.push("/login");
    const likeRef=doc(db,"products",pid,"likes",currentUser.uid);
    if(liked.has(pid)){
      await deleteDoc(likeRef);
      setLiked(prev=>{ const n=new Set(prev); n.delete(pid); return n; });
      setLikeCounts(prev=>({...prev, [pid]: Math.max(0,(prev[pid]||1)-1)}));
    }else{
      await setDoc(likeRef,{userId:currentUser.uid, createdAt:serverTimestamp()});
      setLiked(prev=>{ const n=new Set(prev); n.add(pid); return n; });
      setLikeCounts(prev=>({...prev, [pid]: (prev[pid]||0)+1}));
    }
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
        <button onClick={()=>{ if(window.history.length>1) router.back(); else router.push("/"); }} className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="relative">
          <button onClick={()=>setShowMenu(!showMenu)} className="w-11 h-11 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="black"><circle cx="12" cy="5" r="2.8"/><circle cx="12" cy="12" r="2.8"/><circle cx="12" cy="19" r="2.8"/></svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 bg-white border border-gray-100 rounded-2xl shadow-xl w-44 z-50 overflow-hidden">
              <button onClick={()=>{
                if(!currentUser){ setShowMenu(false); setShowLoginAlert(true); return; }
                setShowReport(true); setShowMenu(false);
              }} className="w-full text-left px-4 py-3.5 text-[13px] font-bold hover:bg-gray-50">🚩 Report User</button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-3 mt-1 bg-[#111111] rounded-[32px] p-6 text-white relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-5 relative z-10">
          <button onClick={()=> photoURL && setShowPic(true)} className="w-[92px] h-[92px] rounded-full bg-white flex items-center justify-center font-black text-3xl overflow-hidden flex-shrink-0 border-[3px] border-white/20 shadow-xl active:scale-95 transition">
            {photoURL? <img src={photoURL} className="w-full h-full object-cover"/> : displayName?.[0]?.toUpperCase()}
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-black text-[22px] leading-6 capitalize truncate">{displayName}</p>
            <p className="text-[13px] text-white/60 mt-1.5">{posts.length} Ads • Joined {seller?.createdAt? timeAgo(seller.createdAt) : "2026"}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="bg-white/15 backdrop-blur px-3 py-1.5 rounded-full text-[11px] font-bold border border-white/10">✅ Verified Seller</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-3">
        <div className="bg-white rounded-[26px] p-2 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-black px-4 pt-2 pb-1 text-gray-400 tracking-widest">PERSONAL INFO</p>
          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">📧</div>
            <div className="flex-1 min-w-0"><p className="text-[11px] text-gray-400">Email</p><p className="text-[13px] font-bold truncate">{seller?.email || seller?.userEmail || "Private"}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">📱</div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Phone</p><p className="text-[13px] font-bold">{seller?.phone || "Set ve loh"}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">📍</div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Khua / Location</p><p className="text-[13px] font-bold">{seller?.khua || seller?.village || seller?.location || "Aizawl, Mizoram"}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">🎂</div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Date of Birth</p><p className="text-[13px] font-bold">{seller?.dob? new Date(seller.dob).toLocaleDateString('en-GB',{day:'2-digit', month:'short', year:'numeric'}) : "Set ve loh"}</p></div>
          </div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5">
            <div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">📦</div>
            <div className="flex-1"><p className="text-[11px] text-gray-400">Total Ads</p><p className="text-[13px] font-bold">{posts.length} Active Ads</p></div>
            <span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full font-black">{posts.length}</span>
          </div>
        </div>

        {/* ADS - LIKE & COMMENT */}
        <div className="bg-white rounded-[26px] p-4 border border-gray-100 shadow-sm">
          <h2 className="font-black text-[16px] mb-3 flex items-center gap-2">{displayName} Ads <span className="bg-black text-white text-[11px] px-2.5 py-1 rounded-full">{posts.length}</span></h2>

          {posts.length===0? (
            <p className="text-center text-gray-400 text-[13px] py-10 bg-gray-50 rounded-2xl">Ads a la awm lo</p>
          ):(
            <div className="flex flex-col gap-3">
              {posts.map((p:any)=>(
                <div key={p.id} className="bg-[#fafafa] border border-gray-100 rounded-[20px] overflow-hidden flex gap-3 p-2.5 relative active:scale-[0.98] transition">
                  <Link href={`/marketplace/${p.id}`} className="w-[108px] h-[108px] flex-shrink-0">
                    <img src={p.image || p.images?.[0]} className="w-full h-full object-cover rounded-[16px]"/>
                  </Link>
                  <div className="flex-1 py-1 pr-12 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link href={`/marketplace/${p.id}`}>
                        <p className="font-bold text-[14px] leading-4 line-clamp-2">{p.title}</p>
                        <p className="font-black text-[18px] mt-2">₹{Number(p.price).toLocaleString("en-IN")}</p>
                        <p className="text-[11px] text-gray-500 mt-1 truncate">{p.village || p.location?.split(",")[0] || "Aizawl"} • {timeAgo(p.createdAt)}</p>
                      </Link>
                    </div>
                    {/* ✅ LIKE & COMMENT - HOME PAGE ANG */}
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={(e)=>toggleLike(e,p.id)} className="flex items-center gap-1.5 bg-white border border-gray-100 px-2.5 py-1 rounded-full shadow-sm active:scale-90 transition">
                        <span className={`text-[14px] ${liked.has(p.id)? "" : "grayscale opacity-60"}`}>❤️</span>
                        <span className="text-[12px] font-black">{likeCounts[p.id]||0}</span>
                      </button>
                      <Link href={`/marketplace/${p.id}`} className="flex items-center gap-1.5 bg-white border border-gray-100 px-2.5 py-1 rounded-full shadow-sm active:scale-90 transition">
                        <span className="text-[14px]">💬</span>
                        <span className="text-[12px] font-black">{commentCounts[p.id]||0}</span>
                      </Link>
                    </div>
                  </div>
                  <button onClick={(e)=>toggleWish(e,p.id)} className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-[18px] active:scale-90 transition">
                    {wished.has(p.id)? "❤️":"🤍"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[22px] p-6 w-full max-w-[340px] shadow-2xl">
            <h3 className="font-black text-[18px]">Report {displayName}</h3>
            <textarea value={reportMsg} onChange={e=>setReportMsg(e.target.value)} placeholder="Report chhan ziak rawh..." className="w-full mt-4 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-black h-28 text-[14px] resize-none"/>
            {errorMsg && <p className="text-red-500 text-[12px] mt-2 font-bold">{errorMsg}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={()=>{setShowReport(false); setErrorMsg("");}} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl">Cancel</button>
              <button onClick={handleReport} disabled={reporting} className="flex-1 bg-black text-white font-bold py-3 rounded-xl">{reporting?"...":"Report"}</button>
            </div>
          </div>
        </div>
      )}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 z-[1100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[26px] p-7 w-full max-w-[340px] shadow-2xl text-center">
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto"><span className="text-white text-2xl">✓</span></div>
            <h3 className="font-black text-[18px] mt-4">Report i thawn ta e</h3>
            <button onClick={()=>setShowSuccess(false)} className="w-full bg-black text-white font-black py-3.5 rounded-xl mt-6">OK</button>
          </div>
        </div>
      )}
      {showLoginAlert && (
        <div className="fixed inset-0 bg-black/60 z-[1200] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] w-full max-w-[300px] p-6 text-center">
            <p className="font-bold">Login hmasa phawt rawh</p>
            <button onClick={()=> setShowLoginAlert(false)} className="w-full mt-5 bg-black text-white font-black py-3 rounded-xl">OK</button>
          </div>
        </div>
      )}
      {showPic && (
        <div onClick={()=>setShowPic(false)} className="fixed inset-0 bg-black/90 z-[1300] flex items-center justify-center p-4">
          <img src={photoURL || ""} className="max-w-full max-h-[85vh] object-contain rounded-[22px]"/>
        </div>
      )}
      {showMenu && <div className="fixed inset-0 z-40" onClick={()=>setShowMenu(false)}></div>}
    </main>
  )
        }

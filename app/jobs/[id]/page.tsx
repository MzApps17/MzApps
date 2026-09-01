"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, serverTimestamp, query, where, limit, updateDoc, increment, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import Link from "next/link";
import CommentPopup from "@/components/CommentPopup";

export default function JobDetail(){
  const {id}=useParams();
  const router=useRouter();
  const [job,setJob]=useState<any>(null);
  const [seller,setSeller]=useState<any>(null);
  const [currentUser,setCurrentUser]=useState<any>(null);
  const [wished,setWished]=useState(false);
  // ✅ THAR BELH
  const [liked,setLiked]=useState(false);
  const [likeCount,setLikeCount]=useState(0);
  const [commentCount,setCommentCount]=useState(0);
  const [showComment,setShowComment]=useState(false);
  const [related,setRelated]=useState<any[]>([]);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,(u)=>setCurrentUser(u));
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const getJob=async()=>{
      let snap=await getDoc(doc(db,"jobs",id as string));
      if(!snap.exists()) snap=await getDoc(doc(db,"jobPosts",id as string));
      if(snap.exists()){
        const data=snap.data();
        setJob(data);
        const uid=(data as any).userId || (data as any).uid;
        if(uid){
          const uSnap=await getDoc(doc(db,"users",uid));
          if(uSnap.exists()) setSeller(uSnap.data());
          // ✅ RELATED JOBS
          try{
            const q = query(collection(db,"jobs"), where("userId","==",uid), limit(10));
            let qs = await getDocs(q);
            let rel = qs.docs.map(d=>({id:d.id,...d.data()})).filter((p:any)=>p.id!==id);
            if(rel.length===0){
              const q2 = query(collection(db,"jobPosts"), where("userId","==",uid), limit(10));
              const qs2 = await getDocs(q2);
              rel = qs2.docs.map(d=>({id:d.id,...d.data()})).filter((p:any)=>p.id!==id);
            }
            setRelated(rel.slice(0,6));
          }catch{}
        }
        // ✅ LIKE / COMMENT COUNT
        let lc = 0;
        if(typeof (data as any).likeCount==='number') lc=(data as any).likeCount;
        else if(typeof (data as any).likesCount==='number') lc=(data as any).likesCount;
        else if(Array.isArray((data as any).likes)) ) lc=(data as any).likes.length;
        try{
          const likeSnap = await getDocs(collection(db,"jobs",id as string,"likes"));
          if(likeSnap.size>0) lc = likeSnap.size;
          else{
            const likeSnap2 = await getDocs(collection(db,"jobPosts",id as string,"likes"));
            if(likeSnap2.size>0) lc = likeSnap2.size;
          }
          const u = auth.currentUser;
          if(u){
            const check = await getDoc(doc(db,"jobs",id as string,"likes",u.uid));
            if(check.exists()) setLiked(true);
            else{
              const check2 = await getDoc(doc(db,"jobPosts",id as string,"likes",u.uid));
              if(check2.exists()) setLiked(true);
            }
          }
        }catch{}
        if(auth.currentUser && Array.isArray((data as any).likes) && (data as any).likes.includes(auth.currentUser.uid)) setLiked(true);
        setLikeCount(lc);
        try{
          let cs = await getDocs(collection(db,"jobs",id as string,"comments"));
          if(cs.size===0) cs = await getDocs(collection(db,"jobPosts",id as string,"comments"));
          setCommentCount(cs.size);
        }catch{
          setCommentCount((data as any).commentCount||0);
        }
      }
    };
    if(id) getJob();
  },[id]);

  // FIX CHIAH - currentUser lo load hnuah wishlist check nawn leh
  useEffect(()=>{
    const checkWish=async()=>{
      if(currentUser && id){
        const wSnap=await getDoc(doc(db,"users",currentUser.uid,"wishlist",id as string));
        setWished(wSnap.exists());
      }
    };
    checkWish();
  },[currentUser, id]);

  const toggleWish=async()=>{
    if(!currentUser) return router.push("/login");
    const wishRef=doc(db,"users",currentUser.uid,"wishlist",id as string);
    if(wished){
      await deleteDoc(wishRef);
      setWished(false);
    }else{
      await setDoc(wishRef,{productId:id, jobId:id, type:"job", createdAt:serverTimestamp()});
      setWished(true);
    }
  };

  // ✅ THAR BELH
  const sendNoti = async(type:"like"|"comment", text?:string)=>{
    try{
      const u = auth.currentUser || currentUser;
      if(!u ||!job) return;
      const ownerId = job.userId || job.uid;
      if(!ownerId || ownerId===u.uid) return;
      const notiRef = doc(collection(db,"users",ownerId,"notifications"));
      await setDoc(notiRef,{
        type,
        postId: id,
        postType: "job",
        fromUid: u.uid,
        fromName: u.displayName || u.email?.split("@")[0] || "Someone",
        fromPhoto: u.photoURL || "",
        postTitle: job.title || job.jobTitle || "your job",
        message: type==="like"? `${u.displayName||"Someone"} liked your job` : text || "commented",
        read:false,
        createdAt: new Date()
      });
    }catch{}
  };

  const toggleLike = async()=>{
    const u = auth.currentUser || currentUser;
    if(!u){ router.push("/login"); return; }
    const prodRef = doc(db,"jobs",id as string);
    const prodRef2 = doc(db,"jobPosts",id as string);
    const likeRef = doc(db,"jobs",id as string,"likes",u.uid);
    const likeRef2 = doc(db,"jobPosts",id as string,"likes",u.uid);
    if(liked){
      setLiked(false);
      setLikeCount(c=>Math.max(0,c-1));
      try{ await deleteDoc(likeRef); await deleteDoc(likeRef2); await updateDoc(prodRef,{likes:arrayRemove(u.uid),likeCount:increment(-1)}).catch(()=>{}); await updateDoc(prodRef2,{likes:arrayRemove(u.uid),likeCount:increment(-1)}).catch(()=>{});}catch{}
    }else{
      setLiked(true);
      setLikeCount(c=>c+1);
      try{ await setDoc(likeRef,{userId:u.uid,createdAt:new Date()}); await setDoc(likeRef2,{userId:u.uid,createdAt:new Date()}); await updateDoc(prodRef,{likes:arrayUnion(u.uid),likeCount:increment(1)}).catch(()=>{ setDoc(prodRef,{likes:arrayUnion(u.uid),likeCount:increment(1)},{merge:true}).catch(()=>{}); }); }catch{}
      sendNoti("like");
    }
  };

  const handleShare = async()=>{
    const url = window.location.href;
    try{
      if(navigator.share){ await navigator.share({title: job?.title||job?.jobTitle, text: job?.title, url}); }
      else{ await navigator.clipboard.writeText(url); alert("Link copied!"); }
    }catch{}
  };

  if(!job) return <div className="p-10 text-center font-black">Loading...</div>;

  const phone=job.phone?.toString().replace(/\D/g,"").slice(-10) || job.contact?.toString().replace(/\D/g,"").slice(-10);
  const waLink=`https://wa.me/91${phone}?text=Ka%20dil%20duh%20e%20-%20${job.title || job.jobTitle}`;
  const callLink=`tel:+91${phone}`;
  const getPostTime=()=>{
    const t=job.createdAt||job.created_at||job.timestamp;
    if(!t) return "";
    let d:Date|null=null;
    try{ if(t.toDate) d=t.toDate(); else if(t.seconds) d=new Date(t.seconds*1000); else d=new Date(t); }catch{ return ""; }
    if(!d||isNaN(d.getTime())) return "";
    return d.toLocaleString("en-GB",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true});
  };

  const displayName=seller?.displayName || job.company || job.companyName || "Employer";
  const displayPic=seller?.photoURL;
  const sellerUid=job.userId || job.uid;

  return (
    <main className="bg-white min-h-screen pb-[140px]">
      <div className="flex items-center justify-between p-3 pt-4 bg-white sticky top-0 z-50">
        <button onClick={()=>{ if(window.history.length>1) router.back(); else router.push("/jobs"); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <button onClick={toggleWish} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg border text-[22px]">
          {wished? "❤️":"🤍"}
        </button>
      </div>

      <div className="p-4 pt-2">
        <h1 className="font-black text-[26px] text-[#002f34]">{job.title || job.jobTitle}</h1>
        <h2 className="font-medium text-[15px] text-gray-600 mt-1">{job.company || job.store || ""}{job.location? ` • ${job.location}`:""}{job.village? ` • ${job.village}`:""}, {job.district || "Aizawl"}</h2>
        <h1 className="font-black text-[26px] text-[#008a3d] mt-3">₹{typeof job.salary==='number'? Number(job.salary).toLocaleString("en-IN"):job.salary}/month</h1>
        <p className="text-[13px] text-gray-500 mt-2">Jobs • {getPostTime()}</p>

        {/* ✅ THAR BELH - SALARY HNUAIAH LIKE/COMMENT/SHARE */}
        <div className="flex items-center gap-2.5 mt-4">
          <button onClick={toggleLike} className={`flex items-center gap-2 px-5 py-2.5 rounded-full border-2 font-black text-[14px] active:scale-95 ${liked?"bg-black text-white border-black":"bg-white border-gray-200 text-black"}`}>
            <span className="text-[18px]">{liked?"❤️":"🤍"}</span> {likeCount}
          </button>
          <button onClick={()=>setShowComment(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 bg-white border-gray-200 font-black text-[14px] active:scale-95 text-black">
            <span className="text-[18px]">💬</span> {commentCount}
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 px-5 py-2.5 rounded-full border-2 bg-white border-gray-200 font-black text-[14px] active:scale-95 text-black">
            <span className="text-[18px]">↗️</span> Share
          </button>
        </div>

        <div className="bg-[#f8f9fa] rounded-2xl p-4 mt-5">
          <h3 className="font-black text-[15px] mb-2">Description</h3>
          <p className="text-[14px] whitespace-pre-wrap leading-6">{job.description || job.jobDescription}</p>
        </div>

        <div onClick={()=>{ if(sellerUid) router.push(`/seller/${sellerUid}`); }} className="bg-[#f8f9fa] rounded-2xl p-4 mt-4 flex items-center gap-3 cursor-pointer">
          <div className="w-[56px] h-[56px] bg-black text-white rounded-full flex items-center justify-center font-black overflow-hidden flex-shrink-0">
            {displayPic? <img src={displayPic} className="w-full h-full object-cover"/> : <span className="text-[20px]">{displayName[0]?.toUpperCase()}</span>}
          </div>
          <div className="flex-1">
            <p className="font-bold text-[17px] capitalize">{displayName}</p>
            <p className="text-[13px] text-gray-500">Verified Employer • View Profile</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
        </div>

        {/* ✅ THAR BELH - RELATED JOBS */}
        {related.length>0 && (
          <div className="mt-5">
            <h3 className="font-black text-[15px] mb-3">More Jobs from {displayName}</h3>
            <div className="grid grid-cols-1 gap-3">
              {related.map((p:any)=>(
                <Link key={p.id} href={`/jobs/${p.id}`} className="bg-[#f8f9fa] border border-gray-100 rounded-[18px] p-4">
                  <p className="font-bold text-[14px]">{p.title||p.jobTitle}</p>
                  <p className="font-black text-[14px] mt-1 text-[#008a3d]">₹{typeof p.salary==='number'? Number(p.salary).toLocaleString("en-IN"):p.salary}/month</p>
                  <p className="text-[12px] text-gray-500 mt-1">{p.location||p.village} • {p.company||""}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3 z-[100]">
        <a href={waLink} target="_blank" className="flex-1 border-2 border-black rounded-xl py-3.5 font-black text-[16px] flex items-center justify-center gap-2 bg-white text-black">
          <span className="text-[#25D366] text-[20px]">●</span> WhatsApp
        </a>
        <a href={callLink} className="flex-1 bg-[#002f34] text-white rounded-xl py-3.5 font-black text-[16px] flex items-center justify-center">Call</a>
      </div>

      {showComment && (
        <CommentPopup
          postId={id as string}
          collectionName={job.title?"jobs":"jobPosts"}
          onClose={()=>setShowComment(false)}
          onCommentAdded={()=>{
            setCommentCount(c=>c+1);
            sendNoti("comment","commented on your job");
          }}
        />
      )}
    </main>
  );
  }

"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export default function JobDetail(){
  const {id}=useParams();
  const router=useRouter();
  const [job,setJob]=useState<any>(null);
  const [seller,setSeller]=useState<any>(null);
  const [currentUser,setCurrentUser]=useState<any>(null);
  const [wished,setWished]=useState(false);

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
      </div>

      <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3 z-[100]">
        <a href={waLink} target="_blank" className="flex-1 border-2 border-black rounded-xl py-3.5 font-black text-[16px] flex items-center justify-center gap-2 bg-white text-black">
          <span className="text-[#25D366] text-[20px]">●</span> WhatsApp
        </a>
        <a href={callLink} className="flex-1 bg-[#002f34] text-white rounded-xl py-3.5 font-black text-[16px] flex items-center justify-center">Call</a>
      </div>
    </main>
  );
}

"use client";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, increment, arrayUnion, arrayRemove, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import CommentPopup from "@/components/CommentPopup";

export default function MyAdsPage(){
  const {user}=useAuth();
  const router=useRouter();
  const [ads,setAds]=useState<any[]>([]);
  const [filter,setFilter]=useState<"all"|"products"|"jobs">("all");
  const [deleteItem,setDeleteItem]=useState<{id:string,type:string}|null>(null);
  const [loadingDelete,setLoadingDelete]=useState(false);
  const [selectedPostId,setSelectedPostId]=useState<string|null>(null);
  const [liked,setLiked]=useState<Set<string>>(new Set());
  const [likeCounts,setLikeCounts]=useState<Record<string,number>>({});
  const [commentCounts,setCommentCounts]=useState<Record<string,number>>({});

  const formatDate = (ts:any)=>{
    if(!ts) return "";
    try{
      const d = ts.toDate? ts.toDate() : new Date(ts.seconds? ts.seconds*1000 : ts);
      return d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }catch{ return ""; }
  };

  useEffect(()=>{
    if(!user) return;
    const q1 = query(collection(db,"products"), where("uid","==",user.uid));
    const q2 = query(collection(db,"products"), where("userId","==",user.uid));
    const unsub1 = onSnapshot(q1, (snap)=>{
      const list = snap.docs.map(d=>({id:d.id, type:"product",...d.data() as any}));
      setAds(prev=>{ const merged=[...prev.filter(p=>!(p.type==="product"))]; list.forEach(i=>{ if(!merged.find(m=>m.id===i.id)) merged.push(i);}); return merged; });
    });
    const unsub2 = onSnapshot(q2, (snap)=>{
      const list = snap.docs.map(d=>({id:d.id, type:"product",...d.data() as any}));
      setAds(prev=>{ const merged=[...prev]; list.forEach(i=>{ if(!merged.find(m=>m.id===i.id)) merged.push(i);}); return merged; });
    });
    return ()=>{unsub1(); unsub2();};
  },[user]);

  useEffect(()=>{
    if(!user) return;
    const q1 = query(collection(db,"jobs"), where("uid","==",user.uid));
    const q2 = query(collection(db,"jobs"), where("userId","==",user.uid));
    const unsub1 = onSnapshot(q1, (snap)=>{
      const list = snap.docs.map(d=>({id:d.id, type:"job",...d.data() as any}));
      setAds(prev=>{ const merged=[...prev]; list.forEach(i=>{ if(!merged.find(m=>m.id===i.id)) merged.push(i);}); return merged; });
    });
    const unsub2 = onSnapshot(q2, (snap)=>{
      const list = snap.docs.map(d=>({id:d.id, type:"job",...d.data() as any}));
      setAds(prev=>{ const merged=[...prev]; list.forEach(i=>{ if(!merged.find(m=>m.id===i.id)) merged.push(i);}); return merged; });
    });
    return ()=>{unsub1(); unsub2();};
  },[user]);

  useEffect(()=>{
    if(ads.length===0) return;
    const loadCounts = async()=>{
      const lc:Record<string,number>={};
      const cc:Record<string,number>={};
      const lSet = new Set<string>();
      const uid = auth.currentUser?.uid || user?.uid;
      for(const ad of ads){
        const colName = ad.type==="job"? "jobs" : "products";
        try{
          const snap = await getDoc(doc(db,colName,ad.id));
          const fd = snap.exists()? snap.data() as any : ad;
          let likeNum = 0;
          if(typeof fd.likeCount==='number') likeNum=fd.likeCount;
          else if(typeof fd.likesCount==='number') likeNum=fd.likesCount;
          else if(Array.isArray(fd.likes)) likeNum=fd.likes.length;
          else if(Array.isArray(fd.likedBy)) likeNum=fd.likedBy.length;
          try{
            const likeSnap = await getDocs(collection(db,colName,ad.id,"likes"));
            if(likeSnap.size>0) likeNum = likeSnap.size;
          }catch{}
          lc[ad.id]=likeNum;
          if(uid){
            if(Array.isArray(fd.likes)&&fd.likes.includes(uid)) lSet.add(ad.id);
            if(Array.isArray(fd.likedBy)&&fd.likedBy.includes(uid)) lSet.add(ad.id);
          }
          let cNum = 0;
          try{
            const cs=await getDocs(collection(db,colName,ad.id,"comments"));
            cNum=cs.size;
          }catch{
            cNum = typeof fd.commentsCount==='number'? fd.commentsCount : typeof fd.commentCount==='number'? fd.commentCount : 0;
          }
          cc[ad.id]=cNum;
        }catch{
          const fallbackLikes = Array.isArray(ad.likes)? ad.likes.length : typeof ad.likeCount==='number'? ad.likeCount : 0;
          lc[ad.id]=fallbackLikes;
          cc[ad.id]=ad.commentsCount||0;
        }
      }
      setLikeCounts(lc);
      setCommentCounts(cc);
      setLiked(lSet);
    };
    loadCounts();
  },[ads.length]);

  const toggleLike = async(e:any, ad:any)=>{
    e.preventDefault(); e.stopPropagation();
    const u = auth.currentUser;
    if(!u){ router.push("/login"); return; }
    const colName = ad.type==="job"? "jobs" : "products";
    const prodRef = doc(db,colName,ad.id);
    const likeRef = doc(db,colName,ad.id,"likes",u.uid);
    const isLiked = liked.has(ad.id);
    if(isLiked){
      setLiked(prev=>{ const n=new Set(prev); n.delete(ad.id); return n; });
      setLikeCounts(prev=>{ const c={...prev}; c[ad.id]=Math.max(0,(c[ad.id]||1)-1); return c; });
      try{ await deleteDoc(likeRef); await updateDoc(prodRef,{likes:arrayRemove(u.uid),likedBy:arrayRemove(u.uid),likeCount:increment(-1),likesCount:increment(-1)}); }catch{}
    }else{
      setLiked(prev=>{ const n=new Set(prev); n.add(ad.id); return n; });
      setLikeCounts(prev=>{ const c={...prev}; c[ad.id]=(c[ad.id]||0)+1; return c; });
      try{ await setDoc(likeRef,{userId:u.uid,createdAt:serverTimestamp()}); await updateDoc(prodRef,{likes:arrayUnion(u.uid),likedBy:arrayUnion(u.uid),likeCount:increment(1),likesCount:increment(1)}); }catch{
        try{ await setDoc(prodRef,{likes:arrayUnion(u.uid),likeCount:increment(1)},{merge:true}); }catch{}
      }
    }
  };

  const filtered = ads.filter(a=>{
    if(filter==="all") return true;
    if(filter==="products") return a.type==="product";
    if(filter==="jobs") return a.type==="job";
    return true;
  }).sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));

  const handleDelete = async ()=>{
    if(!deleteItem) return;
    setLoadingDelete(true);
    try{
      const colName = deleteItem.type==="job"? "jobs" : "products";
      const adToDelete = ads.find(a => a.id === deleteItem.id);
      if (adToDelete && adToDelete.type === "product") {
        try {
          await fetch("/api/delete-imgbb", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageIds: adToDelete.imageIds || [],
              deleteUrls: adToDelete.deleteUrls || []
            })
          });
        } catch(e) {}
      }
      await deleteDoc(doc(db,colName,deleteItem.id));
      setDeleteItem(null);
    }catch(e){ alert("Delete failed"); }
    setLoadingDelete(false);
  };

  const handleEdit = (ad:any)=>{
    if(ad.type==="job"){ router.push(`/jobs/edit/${ad.id}`); }else{ router.push(`/marketplace/edit/${ad.id}`); }
  };

  return(
    <main className="bg-[#f5f5f5] min-h-screen pb-24">
      <div className="bg-white p-4 sticky top-0 z-10 border-b">
        <h1 className="font-black text-[24px] text-black">My Ads ({filtered.length})</h1>
        <div className="flex gap-2 mt-3">
          <button onClick={()=>setFilter("all")} className={`px-5 py-2.5 rounded-full font-black text-[13px] ${filter==="all"?"bg-black text-white":"bg-gray-100 text-black"}`}>All</button>
          <button onClick={()=>setFilter("products")} className={`px-5 py-2.5 rounded-full font-black text-[13px] ${filter==="products"?"bg-black text-white":"bg-gray-100 text-black"}`}>Products</button>
          <button onClick={()=>setFilter("jobs")} className={`px-5 py-2.5 rounded-full font-black text-[13px] ${filter==="jobs"?"bg-black text-white":"bg-gray-100 text-black"}`}>Jobs</button>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3">
        {filtered.map((ad)=>(
          <div key={ad.id} className="bg-white rounded-[20px] p-3 flex gap-3 shadow-sm">
            {ad.type==="job"? (
              <div className="w-28 h-28 rounded-xl bg-[#f1f1f1] flex items-center justify-center text-black font-black text-[12px] text-center p-2 border">{ad.company||"JOB"}</div>
            ) : (
              <img src={ad.image || ad.images?.[0]} className="w-28 h-28 rounded-xl object-cover bg-gray-100"/>
            )}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="font-black text-[18px] text-black">{ad.type==="job"? `₹ ${Number(ad.salary).toLocaleString('en-IN')}` : `₹ ${ad.price?.toLocaleString('en-IN')}`}</p>
                <p className="font-bold text-[16px] -mt-1 line-clamp-1 text-black">{ad.title}</p>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <p className="text-[13px] text-gray-500">{ad.village} • {ad.type==="job"? ad.company : ad.category}</p>
                  <span className="bg-[#eeeeee] text-black px-2.5 py-[2px] rounded-full text-[10px] font-black border">{ad.type==="job"?"JOB":"PRODUCT"}</span>
                </div>
                <p className="text-[11px] text-gray-400 mt-[2px] font-medium">{formatDate(ad.createdAt)}</p>
                <div className="flex items-center gap-3 mt-2">
                  <button onClick={(e)=>toggleLike(e, ad)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-black border active:scale-95 ${liked.has(ad.id)?"bg-black text-white border-black":"bg-white text-black border-gray-200"}`}>
                    <span>{liked.has(ad.id)?"❤️":"🤍"}</span> {(likeCounts[ad.id]?? (Array.isArray(ad.likes)? ad.likes.length : (ad.likeCount || 0)))} likes
                  </button>
                  <button onClick={()=>setSelectedPostId(ad.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[12px] font-black text-black active:opacity-60">
                    💬 {(commentCounts[ad.id]?? (ad.commentsCount || 0))} comments
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-2 justify-end">
                <button onClick={()=>handleEdit(ad)} className="px-5 py-2 bg-[#f0f0f0] text-black font-black text-[11px] rounded-full border border-gray-200 active:scale-95">EDIT</button>
                <button onClick={()=>setDeleteItem({id:ad.id,type:ad.type})} className="px-5 py-2 bg-black text-white font-black text-[11px] rounded-full active:scale-95">DELETE</button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0 && <p className="text-center p-10 font-bold text-gray-400">Ads a awm lo</p>}
      </div>

      {deleteItem && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-7 w-full max-w-[320px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">!</div>
            <h2 className="font-black text-[18px] mb-1 text-black">Delete duh tak tak em?</h2>
            <p className="text-[13px] text-gray-500 mb-5">He thil hi i delete chuan a bo hlen tawh ang.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteItem(null)} className="flex-1 bg-[#f0f0f0] border border-gray-200 text-black font-black py-3 rounded-xl">Cancel</button>
              <button onClick={handleDelete} disabled={loadingDelete} className="flex-1 bg-black text-white font-black py-3 rounded-xl disabled:opacity-50">
                {loadingDelete?"Deleting...":"Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedPostId && <CommentPopup postId={selectedPostId} onClose={()=>setSelectedPostId(null)} onCommentAdded={async (pid)=>{
        try{
          const colName = ads.find(a=>a.id===pid)?.type==="job"? "jobs":"products";
          const cs=await getDocs(collection(db,colName,pid,"comments"));
          setCommentCounts(prev=>{ const c={...prev}; c[pid]=cs.size; return c; });
        }catch{
          setAds(prev=> prev.map(p=> p.id===pid? {...p, commentsCount: (p.commentsCount||0)+1} : p));
        }
      }} />}
    </main>
  );
                                                }

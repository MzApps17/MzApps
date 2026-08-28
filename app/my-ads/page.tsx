"use client";
import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function MyAdsPage(){
  const {user}=useAuth();
  const router=useRouter();
  const [ads,setAds]=useState<any[]>([]);
  const [filter,setFilter]=useState<"all"|"products"|"jobs">("all");
  const [deleteItem,setDeleteItem]=useState<{id:string,type:string}|null>(null);
  const [loadingDelete,setLoadingDelete]=useState(false);

  const formatDate = (ts:any)=>{
    if(!ts) return "";
    try{
      const d = ts.toDate? ts.toDate() : new Date(ts.seconds? ts.seconds*1000 : ts);
      return d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }catch{ return ""; }
  };

  // Products
  useEffect(()=>{
    if(!user) return;
    const q1 = query(collection(db,"products"), where("uid","==",user.uid));
    const q2 = query(collection(db,"products"), where("userId","==",user.uid));
    const unsub1 = onSnapshot(q1, (snap)=>{
      const list = snap.docs.map(d=>({id:d.id, type:"product",...d.data() as any}));
      setAds(prev=>{
        const others = prev.filter(p=>p.type!=="product" || p.uid!==user.uid && p.userId!==user.uid);
        const merged = [...others];
        list.forEach(item=>{ if(!merged.find(m=>m.id===item.id)) merged.push(item); });
        return merged;
      });
    });
    const unsub2 = onSnapshot(q2, (snap)=>{
      const list = snap.docs.map(d=>({id:d.id, type:"product",...d.data() as any}));
      setAds(prev=>{
        const merged = [...prev];
        list.forEach(item=>{ if(!merged.find(m=>m.id===item.id)) merged.push(item); });
        return merged;
      });
    });
    return ()=>{unsub1(); unsub2();};
  },[user]);

  // Jobs
  useEffect(()=>{
    if(!user) return;
    const q1 = query(collection(db,"jobs"), where("uid","==",user.uid));
    const q2 = query(collection(db,"jobs"), where("userId","==",user.uid));
    const unsub1 = onSnapshot(q1, (snap)=>{
      const list = snap.docs.map(d=>({id:d.id, type:"job",...d.data() as any}));
      setAds(prev=>{
        const merged = [...prev];
        list.forEach(item=>{ if(!merged.find(m=>m.id===item.id)) merged.push(item); });
        return merged;
      });
    });
    const unsub2 = onSnapshot(q2, (snap)=>{
      const list = snap.docs.map(d=>({id:d.id, type:"job",...d.data() as any}));
      setAds(prev=>{
        const merged = [...prev];
        list.forEach(item=>{ if(!merged.find(m=>m.id===item.id)) merged.push(item); });
        return merged;
      });
    });
    return ()=>{unsub1(); unsub2();};
  },[user]);

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
      await deleteDoc(doc(db,colName,deleteItem.id));
      setDeleteItem(null);
    }catch(e){ alert("Delete failed"); }
    setLoadingDelete(false);
  };

  const handleEdit = (ad:any)=>{
    if(ad.type==="job"){
      router.push(`/jobs/edit/${ad.id}`);
    }else{
      router.push(`/marketplace/edit/${ad.id}`);
    }
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
              <div className="w-28 h-28 rounded-xl bg-black flex items-center justify-center text-white font-black text-[12px] text-center p-2">{ad.company||"JOB"}</div>
            ) : (
              <img src={ad.image || ad.images?.[0]} className="w-28 h-28 rounded-xl object-cover bg-gray-100"/>
            )}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="font-black text-[18px]">{ad.type==="job"? `₹ ${Number(ad.salary).toLocaleString('en-IN')}` : `₹ ${ad.price?.toLocaleString('en-IN')}`}</p>
                <p className="font-bold text-[16px] -mt-1 line-clamp-1">{ad.title}</p>
                <p className="text-[13px] text-gray-500">{ad.village} • {ad.type==="job"? ad.company : ad.category} • <span className="bg-black text-white px-2 py-[1px] rounded-full text-[10px] font-black">{ad.type.toUpperCase()}</span></p>
                <p className="text-[11px] text-gray-400 mt-[2px] font-medium">{formatDate(ad.createdAt)}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={()=>handleEdit(ad)} className="flex-1 bg-black text-white font-black text-[12px] py-3 rounded-xl active:scale-95">EDIT</button>
                <button onClick={()=>setDeleteItem({id:ad.id,type:ad.type})} className="flex-1 bg-black text-white font-black text-[12px] py-3 rounded-xl active:scale-95">DELETE</button>
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
            <h2 className="font-black text-[18px] mb-1">Delete duh tak tak em?</h2>
            <p className="text-[13px] text-gray-500 mb-5">He thil hi i delete chuan a bo hlen tawh ang.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteItem(null)} className="flex-1 bg-white border-2 border-black text-black font-black py-3.5 rounded-xl">Cancel</button>
              <button onClick={handleDelete} disabled={loadingDelete} className="flex-1 bg-black text-white font-black py-3.5 rounded-xl disabled:opacity-50">
                {loadingDelete?"Deleting...":"Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

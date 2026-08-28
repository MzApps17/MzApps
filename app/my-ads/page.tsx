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
  const [deleteId,setDeleteId]=useState<string|null>(null);
  const [loadingDelete,setLoadingDelete]=useState(false);

  const formatDate = (ts:any)=>{
    if(!ts) return "";
    try{
      const d = ts.toDate? ts.toDate() : new Date(ts.seconds? ts.seconds*1000 : ts);
      return d.toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
    }catch{ return ""; }
  };

  useEffect(()=>{
    if(!user) return;
    const q = query(collection(db,"products"), where("uid","==",user.uid));
    return onSnapshot(q, (snap)=>{
      setAds(snap.docs.map(d=>({id:d.id,...d.data() as any})));
    });
  },[user]);

  useEffect(()=>{
    if(!user) return;
    const q2 = query(collection(db,"products"), where("userId","==",user.uid));
    return onSnapshot(q2, (snap)=>{
      const list2 = snap.docs.map(d=>({id:d.id,...d.data() as any}));
      setAds(prev=>{
        const merged = [...prev];
        list2.forEach(item=>{
          if(!merged.find(m=>m.id===item.id)) merged.push(item);
        });
        return merged;
      });
    });
  },[user]);

  const handleDelete = async ()=>{
    if(!deleteId) return;
    setLoadingDelete(true);
    try{
      await deleteDoc(doc(db,"products",deleteId));
      setDeleteId(null);
    }catch(e){ alert("Delete failed"); }
    setLoadingDelete(false);
  };

  return(
    <main className="bg-[#f5f5f5] min-h-screen pb-24">
      <h1 className="font-black text-[24px] p-4 text-black">My Ads ({ads.length})</h1>
      <div className="flex flex-col gap-3 p-3">
        {ads.map((ad)=>(
          <div key={ad.id} className="bg-white rounded-[20px] p-3 flex gap-3 shadow-sm">
            <img src={ad.image || ad.images?.[0]} className="w-28 h-28 rounded-xl object-cover bg-gray-100"/>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="font-black text-[18px]">₹ {ad.price?.toLocaleString('en-IN')}</p>
                <p className="font-bold text-[16px] -mt-1">{ad.title}</p>
                <p className="text-[13px] text-gray-500">{ad.village} • {ad.category}</p>
                <p className="text-[11px] text-gray-400 mt-[2px] font-medium">{formatDate(ad.createdAt)}</p>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={()=>router.push(`/marketplace/edit/${ad.id}`)} className="flex-1 bg-black text-white font-black text-[12px] py-3 rounded-xl active:scale-95">EDIT</button>
                <button onClick={()=>setDeleteId(ad.id)} className="flex-1 bg-black text-white font-black text-[12px] py-3 rounded-xl active:scale-95">DELETE</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/60 z-[999] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[24px] p-7 w-full max-w-[320px] text-center shadow-2xl">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-black">!</div>
            <h2 className="font-black text-[18px] mb-1">Delete duh tak tak em?</h2>
            <p className="text-[13px] text-gray-500 mb-5">He thil hi i delete chuan a bo hlen tawh ang.</p>
            <div className="flex gap-3">
              <button onClick={()=>setDeleteId(null)} className="flex-1 bg-white border-2 border-black text-black font-black py-3.5 rounded-xl">Cancel</button>
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

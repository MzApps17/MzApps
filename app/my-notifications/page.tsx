"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

export default function MyPostNotifications(){
  const [notis,setNotis]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const router = useRouter();

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async(u)=>{
      if(!u){ setLoading(false); return; }
      try{
        const q = query(collection(db,"users",u.uid,"notifications"), orderBy("createdAt","desc"));
        const snap = await getDocs(q);
        setNotis(snap.docs.map(d=>({id:d.id,...d.data()})));
        snap.docs.forEach(async(d)=>{
          if(!d.data().read){
            await updateDoc(doc(db,"users",u.uid,"notifications",d.id), {read:true}).catch(()=>{});
          }
        });
      }catch{}
      setLoading(false);
    });
    return ()=>unsub();
  },[]);

  const formatTime = (t:any)=>{
    if(!t) return "";
    let d:Date|null=null;
    try{ if(t.toDate) d=t.toDate(); else if(t.seconds) d=new Date(t.seconds*1000); else d=new Date(t); }catch{ return ""; }
    if(!d||isNaN(d.getTime())) return "";
    const day = d.toLocaleDateString("en-GB");
    let h = d.getHours();
    const m = d.getMinutes().toString().padStart(2,"0");
    const ampm = h>=12? "pm":"am";
    h = h%12; if(h===0) h=12;
    return `${day}, ${h}:${m}${ampm}`;
  };

  if(loading) return <div className="p-10 text-center font-black">Loading...</div>;

  return (
    <main className="min-h-screen bg-[#f2f2f2]">
      <div className="bg-white p-4 sticky top-0 z-10 border-b flex items-center gap-3">
        <button onClick={()=>router.back()} className="w-10 h-10 flex items-center justify-center active:scale-90">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="font-black text-[18px]">My Posts Notifications</h1>
      </div>
      <div className="flex flex-col gap-2 p-3">
        {notis.length===0 && <div className="bg-white rounded-2xl p-10 text-center mt-4"><p className="text-gray-400 text-[14px]">I post ah like/comment a la awm lo</p></div>}
        {notis.map((n:any)=>(
          <div key={n.id} onClick={()=> router.push(n.postType==="job"? `/jobs/${n.postId}` : `/marketplace/${n.postId}`)} className="bg-white rounded-2xl p-4 flex gap-3 items-center cursor-pointer border">
            <img src={n.fromPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.fromName||"U")}&background=002f34&color=fff`} className="w-12 h-12 rounded-full object-cover border" alt=""/>
            <div className="flex-1 min-w-0">
              <p className="text-[14px]"><span className="font-black">{n.fromName}</span> {n.type==="like"? "liked your post":"commented on your post"}</p>
              <p className="text-[12px] text-gray-500 truncate mt-1">{n.postTitle || n.title || ""}</p>
              {n.type==="comment" && <p className="text-[12px] text-gray-700 mt-1 italic truncate">"{n.message}"</p>}
              <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        ))}
      </div>
    </main>
  );
}

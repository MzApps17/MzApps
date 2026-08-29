"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

function timeAgo(ts:any){
  if(!ts) return "just now";
  try{
    const d = ts.toDate? ts.toDate() : new Date(ts.seconds? ts.seconds*1000 : ts);
    const diff = Math.floor((Date.now() - d.getTime())/1000);
    if(diff < 60) return "just now";
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)} hrs ago`;
    if(diff < 172800) return "yesterday";
    if(diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return d.toLocaleDateString();
  }catch{ return "just now"; }
}

export default function NotificationsPage(){
  const router = useRouter();
  const [notis,setNotis]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    const load = async()=>{
      try{
        const q1 = query(collection(db,"products"), orderBy("createdAt","desc"), limit(25));
        const q2 = query(collection(db,"jobs"), orderBy("createdAt","desc"), limit(25));
        const [snap1, snap2] = await Promise.all([
          getDocs(q1).catch(()=>({docs:[]} as any)),
          getDocs(q2).catch(()=>({docs:[]} as any))
        ]);
        const p1 = snap1.docs.map((d:any)=>({id:d.id,...d.data(), _type:"product"}));
        const p2 = (snap2 as any).docs.map((d:any)=>({id:d.id,...d.data(), _type:"job"}));
        let merged = [...p1,...p2].sort((a:any,b:any)=>{
          const ta = a.createdAt?.toMillis? a.createdAt.toMillis() : new Date(a.createdAt||0).getTime();
          const tb = b.createdAt?.toMillis? b.createdAt.toMillis() : new Date(b.createdAt||0).getTime();
          return tb - ta;
        });

        const allIds = merged.map((m:any)=> m.userId || m.uid || m.createdBy || m.sellerId).filter(Boolean);
        const userIds = Array.from(new Set(allIds));
        const userMap: any = {};
        await Promise.all(userIds.map(async (uid:any)=>{
          try{
            const uSnap = await getDoc(doc(db,"users",uid));
            if(uSnap.exists()){
              const uData:any = uSnap.data();
              userMap[uid] = uData.displayName || uData.name || uData.userName || uData.fullName || "";
            }
          }catch{}
        }));

        merged = merged.map((m:any)=>{
          const uid = m.userId || m.uid || m.createdBy || m.sellerId;
          const realName = userMap[uid] || m.userName || m.sellerName || m.postedByName || m.authorName || m.name || "";
          return {...m, _realSellerName: realName};
        });

        setNotis(merged);
      }catch(e){ console.log(e); }
      setLoading(false);
    };
    load();
  },[]);

  return (
    <main className="min-h-screen bg-white">
      <div className="sticky top-0 bg-white z-20 border-b border-gray-100 px-3 py-3 flex items-center gap-4">
        <button onClick={()=> router.back()} className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className="font-black text-[20px] text-[#002f34]">Notifications</h1>
      </div>

      {loading && (
        <div className="p-3 space-y-3">
          {[1,2,3,4,5].map(i=>(
            <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-2xl animate-pulse">
              <div className="w-14 h-14 bg-gray-200 rounded-xl"/>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4"/>
                <div className="h-3 bg-gray-200 rounded w-1/2"/>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && notis.length===0 && (
        <div className="flex flex-col items-center justify-center mt-20">
          <p className="text-[50px]">🔔</p>
          <p className="font-black mt-2">Notification a la awm lo</p>
          <p className="text-[13px] text-gray-500 mt-1">Thil thar post a awm hun ah hetah a lang ang</p>
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {notis.map((n:any)=>{
          const img = n.image || n.images?.[0] || "";
          const village = n.village || n.location?.split(",")[0] || "";
          const district = n.district || n.location?.split(",")[1] || n.location || "";
          const category = n.category || (n._type==="job"? "Job" : "Product");
          const isJob = n._type==="job";
          const sellerName = n._realSellerName;

          return (
            <div
              key={n.id}
              onClick={()=> router.push(isJob? `/jobs/${n.id}` : `/marketplace/${n.id}`)}
              className="flex gap-3 p-3.5 active:bg-gray-50 cursor-pointer"
            >
              <div className="w-[58px] h-[58px] rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                {img? (
                  <img src={img} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[#f3f4f6]">
                    <span className="font-black text-[11px] text-center leading-tight px-1">{n.title?.slice(0,15)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[13.5px] leading-[18px] text-[#002f34]">
                  <span className="font-black">{n.title || "Thil thar"}</span>
                  <span className="text-gray-700"> • </span>
                  <span className="font-medium text-gray-700">
                    {sellerName}{village? `, ${village}` : ""}{district? `, ${district} Dist` : ""} chuan Post thar a siam e
                  </span>
                  <span className="text-gray-500"> • {category}</span>
                </p>
                <p className="text-[11px] text-gray-500 font-bold mt-1">{timeAgo(n.createdAt)}</p>
              </div>

              <div className="flex items-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-[80px]"/>
    </main>
  );
}

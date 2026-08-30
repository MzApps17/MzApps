// app/admin/reports/page.tsx - UPDATE - presence atangin Users Online + Delete User/Post
"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ReportsPage(){
  const [reports,setReports]=useState<any[]>([]);
  const [onlineCount,setOnlineCount]=useState(0);
  const [showDeleteId,setShowDeleteId]=useState<string|null>(null);
  const [deleting,setDeleting]=useState(false);
  const [actionId,setActionId]=useState<string|null>(null);
  const adminEmails=["mizochatapps@gmail.com"];
  const router=useRouter();

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      if(!u){ router.push("/login"); return; }
      if(!adminEmails.includes(u.email||"")){
        alert("Admin chiah lut thei");
        router.push("/");
        return;
      }
      const q=query(collection(db,"reports"), orderBy("createdAt","desc"));
      const snap=await getDocs(q);
      const list:any[]=[];
      for(const d of snap.docs){
        const data=d.data();
        let reportedUser:any=null;
        let reporterUser:any=null;
        try{
          const uSnap=await getDoc(doc(db,"users",data.reportedUserId));
          if(uSnap.exists()) reportedUser=uSnap.data();
        }catch{}
        try{
          if(data.reporterId && data.reporterId!=="anonymous"){
            const rSnap=await getDoc(doc(db,"users",data.reporterId));
            if(rSnap.exists()) reporterUser=rSnap.data();
          }
        }catch{}
        list.push({id:d.id,...data, reportedUser, reporterUser});
      }
      setReports(list);

      // --- Presence atanga Online count ---
      try{
        const twoMinAgo = new Date(Date.now() - 2*60*1000);
        const onlineQ = query(collection(db,"presence"), where("lastSeen",">", twoMinAgo));
        const onlineSnap = await getDocs(onlineQ);
        setOnlineCount(onlineSnap.size);
      }catch{ setOnlineCount(0); }
    });

    // Live update 30 sec tin
    const iv = setInterval(async()=>{
      try{
        const twoMinAgo = new Date(Date.now() - 2*60*1000);
        const onlineQ = query(collection(db,"presence"), where("lastSeen",">", twoMinAgo));
        const onlineSnap = await getDocs(onlineQ);
        setOnlineCount(onlineSnap.size);
      }catch{}
    }, 30000);

    return ()=>{ unsub(); clearInterval(iv); };
  },[]);

  const confirmDelete=async()=>{
    if(!showDeleteId) return;
    setDeleting(true);
    await deleteDoc(doc(db,"reports",showDeleteId));
    setReports(r=>r.filter(x=>x.id!==showDeleteId));
    setDeleting(false);
    setShowDeleteId(null);
  };

  const handleDeletePosts = async (reportedUserId: string, reportId: string) => {
    if(!confirm("He User post zawng zawng DELETE vek ang em?")) return;
    setActionId(reportId);
    try{
      // posts collection - i post collection hming kha 'products' emaw 'posts' emaw a ni thei, pahnih ka check
      const collectionsToCheck = ["posts", "products", "ads", "listings"];
      let totalDeleted = 0;
      for(const colName of collectionsToCheck){
        try{
          const pq = query(collection(db, colName), where("uid","==", reportedUserId));
          const psnap = await getDocs(pq);
          for(const pd of psnap.docs){
            await deleteDoc(doc(db, colName, pd.id));
            totalDeleted++;
          }
          // userId hmangin check leh
          const pq2 = query(collection(db, colName), where("userId","==", reportedUserId));
          const psnap2 = await getDocs(pq2);
          for(const pd of psnap2.docs){
            await deleteDoc(doc(db, colName, pd.id));
            totalDeleted++;
          }
        }catch{}
      }
      alert(`${totalDeleted} post delete a ni e!`);
    }catch(e){
      alert("Error: "+e);
    }
    setActionId(null);
  };

  const handleBanUser = async (reportedUserId: string, reportId: string) => {
    if(!confirm("He User hi B AN / DELETE vek ang em? A account leh post zawng zawng a bo ang!")) return;
    setActionId(reportId);
    try{
      // 1. users doc delete
      await deleteDoc(doc(db,"users",reportedUserId));
      // 2. presence delete
      try{ await deleteDoc(doc(db,"presence",reportedUserId)); }catch{}
      // 3. a post te delete - handleDeletePosts ang tho
      const collectionsToCheck = ["posts", "products", "ads", "listings"];
      for(const colName of collectionsToCheck){
        try{
          const pq = query(collection(db, colName), where("uid","==", reportedUserId));
          const psnap = await getDocs(pq);
          for(const pd of psnap.docs) await deleteDoc(doc(db, colName, pd.id));
          const pq2 = query(collection(db, colName), where("userId","==", reportedUserId));
          const psnap2 = await getDocs(pq2);
          for(const pd of psnap2.docs) await deleteDoc(doc(db, colName, pd.id));
        }catch{}
      }
      alert("User Banned & Deleted!");
      // report pawh delete nghal
      await deleteDoc(doc(db,"reports",reportId));
      setReports(r=>r.filter(x=>x.id!==reportId));
    }catch(e){
      alert("Error ban: "+e);
    }
    setActionId(null);
  };

  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>router.back()} className="w-12 h-12 bg-white rounded-full flex items-center justify-center border shadow-sm active:scale-95">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className="font-black text-[19px] text-[#002f34]">🚩 Reports ({reports.length})</h1>
        </div>
        <div className="bg-black text-white px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide flex-shrink-0">
          Users Online ({onlineCount})
        </div>
      </div>

      <div className="p-3 max-w-md mx-auto">
        {reports.length===0 && <p className="text-gray-400 text-center mt-20 font-bold">Report a awm lo</p>}
        <div className="flex flex-col gap-3 mt-2">
          {reports.map(r=>(
            <div key={r.id} className="border-2 rounded-2xl p-4 bg-white">
              <div className="flex justify-between">
                <p className="font-black">{r.sellerName || r.reportedUser?.displayName} </p>
                <p className="text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded-full">{r.createdAt?.toDate? r.createdAt.toDate().toLocaleDateString() : "new"}</p>
              </div>
              <p className="text-[13px] mt-2 bg-gray-50 p-3 rounded-xl">"{r.message}"</p>
              <p className="text-[11px] text-gray-400 mt-2">Reported ID: {r.reportedUserId}</p>
              <p className="text-[11px] text-gray-400">Reporter: {r.reporterUser?.displayName || r.reporterId} <span className="text-gray-300">({r.reporterId})</span></p>

              {/* ACTION BUTTONS THAR */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button onClick={()=>handleDeletePosts(r.reportedUserId, r.id)} disabled={actionId===r.id} className="bg-orange-500 text-white py-2.5 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50">
                  {actionId===r.id? "..." : "🗑️ POST DELETE"}
                </button>
                <button onClick={()=>handleBanUser(r.reportedUserId, r.id)} disabled={actionId===r.id} className="bg-red-600 text-white py-2.5 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50">
                  {actionId===r.id? "..." : "🚫 BAN USER"}
                </button>
                <button onClick={()=>setShowDeleteId(r.id)} className="bg-gray-200 py-2.5 rounded-xl text-[11px] font-bold">Delete Report</button>
              </div>

            </div>
          ))}
        </div>
      </div>

      {showDeleteId && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[22px] p-6 w-full max-w-[320px] shadow-2xl text-center">
            <p className="font-black text-[17px] text-[#002f34]">Delete report?</p>
            <p className="text-[12px] text-gray-500 mt-1">He report hi i delete duh tak tak em?</p>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setShowDeleteId(null)} className="flex-1 bg-[#e5e7eb] text-black font-bold py-3 rounded-xl text-[14px]">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 bg-black text-white font-black py-3 rounded-xl text-[14px]">{deleting?"...":"OK"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
                                                          }

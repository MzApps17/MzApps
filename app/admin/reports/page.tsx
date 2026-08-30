// app/admin/reports/page.tsx - MODAL MAWI TAK
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

  // MODAL THAR
  const [confirmModal,setConfirmModal]=useState<{type:'post'|'ban'|null, reportId:string, userId:string, userName:string} | null>(null);
  const [successModal,setSuccessModal]=useState<string|null>(null);

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
      try{
        const twoMinAgo = new Date(Date.now() - 2*60*1000);
        const onlineQ = query(collection(db,"presence"), where("lastSeen",">", twoMinAgo));
        const onlineSnap = await getDocs(onlineQ);
        setOnlineCount(onlineSnap.size);
      }catch{ setOnlineCount(0); }
    });
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
    setSuccessModal("Report delete a ni e!");
  };

  const executePostDelete = async () => {
    if(!confirmModal) return;
    setActionId(confirmModal.reportId);
    const reportedUserId = confirmModal.userId;
    try{
      const collectionsToCheck = ["posts", "products", "ads", "listings"];
      let totalDeleted = 0;
      for(const colName of collectionsToCheck){
        try{
          const pq = query(collection(db, colName), where("uid","==", reportedUserId));
          const psnap = await getDocs(pq);
          for(const pd of psnap.docs){ await deleteDoc(doc(db, colName, pd.id)); totalDeleted++; }
          const pq2 = query(collection(db, colName), where("userId","==", reportedUserId));
          const psnap2 = await getDocs(pq2);
          for(const pd of psnap2.docs){ await deleteDoc(doc(db, colName, pd.id)); totalDeleted++; }
        }catch{}
      }
      setSuccessModal(`${totalDeleted} post delete a ni e! ✅`);
    }catch(e:any){ setSuccessModal("Error: "+e.message); }
    setActionId(null);
    setConfirmModal(null);
  };

  const executeBan = async () => {
    if(!confirmModal) return;
    setActionId(confirmModal.reportId);
    const reportedUserId = confirmModal.userId;
    const reportId = confirmModal.reportId;
    try{
      await deleteDoc(doc(db,"users",reportedUserId));
      try{ await deleteDoc(doc(db,"presence",reportedUserId)); }catch{}
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
      await deleteDoc(doc(db,"reports",reportId));
      setReports(r=>r.filter(x=>x.id!==reportId));
      setSuccessModal(`User ${confirmModal.userName} BAN a ni e! 🚫`);
    }catch(e:any){ setSuccessModal("Error ban: "+e.message); }
    setActionId(null);
    setConfirmModal(null);
  };

  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>router.back()} className="w-12 h-12 bg-white rounded-full flex items-center justify-center border shadow-sm active:scale-95">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="font-black text-[19px] text-[#002f34]">🚩 Reports ({reports.length})</h1>
        </div>
        <div className="bg-black text-white px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide flex-shrink-0">Users Online ({onlineCount})</div>
      </div>

      <div className="p-3 max-w-md mx-auto">
        {reports.length===0 && <p className="text-gray-400 text-center mt-20 font-bold">Report a awm lo</p>}
        <div className="flex flex-col gap-3 mt-2">
          {reports.map(r=>(
            <div key={r.id} className="border-2 rounded-2xl p-4 bg-white">
              <div className="flex justify-between">
                <p className="font-black text-[16px]">{r.reportedUser?.displayName || r.reportedUser?.name || r.sellerName || "Hming awm lo"}</p>
                <p className="text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded-full h-fit">{r.createdAt?.toDate? r.createdAt.toDate().toLocaleDateString() : "new"}</p>
              </div>
              <p className="text-[13px] mt-2 bg-gray-50 p-3 rounded-xl">"{r.message}"</p>
              <div className="mt-3 bg-gray-50 p-2.5 rounded-xl space-y-1">
                <p className="text-[12px]"><span className="text-gray-500">🚩 Reported:</span> <span className="font-black text-black">{r.reportedUser?.displayName || r.reportedUser?.name || r.sellerName || "Unknown"}</span> <span className="text-[10px] text-gray-400">({r.reportedUserId?.slice(0,6)}...)</span></p>
                <p className="text-[12px]"><span className="text-gray-500">👤 Reporter:</span> <span className="font-black text-black">{r.reporterUser?.displayName || r.reporterUser?.name || "Anonymous"}</span> <span className="text-[10px] text-gray-400">({r.reporterId?.slice(0,6)}...)</span></p>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                <button onClick={()=>setConfirmModal({type:'post', reportId:r.id, userId:r.reportedUserId, userName: r.reportedUser?.displayName || "User"})} disabled={actionId===r.id} className="bg-orange-500 text-white py-2.5 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50">{actionId===r.id? "..." : "🗑️ POST DELETE"}</button>
                <button onClick={()=>setConfirmModal({type:'ban', reportId:r.id, userId:r.reportedUserId, userName: r.reportedUser?.displayName || "User"})} disabled={actionId===r.id} className="bg-red-600 text-white py-2.5 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50">{actionId===r.id? "..." : "🚫 BAN USER"}</button>
                <button onClick={()=>setShowDeleteId(r.id)} className="bg-gray-200 py-2.5 rounded-xl text-[11px] font-bold">Delete Report</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showDeleteId && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-[320px] shadow-2xl text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">🗑️</div>
            <p className="font-black text-[18px] text-[#002f34]">Delete report?</p>
            <p className="text-[13px] text-gray-500 mt-1 leading-5">He report hi i delete duh tak tak em? A bo hlen ang.</p>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setShowDeleteId(null)} className="flex-1 bg-[#f3f4f6] text-black font-bold py-3.5 rounded-2xl text-[14px] active:scale-95">Cancel</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 bg-black text-white font-black py-3.5 rounded-2xl text-[14px] active:scale-95">{deleting?"...":"OK"}</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-[340px] shadow-2xl text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${confirmModal.type==='ban'? 'bg-red-100' : 'bg-orange-100'}`}>
              {confirmModal.type==='ban'? '🚫' : '🗑️'}
            </div>
            <p className="font-black text-[18px] text-[#002f34] leading-tight">
              {confirmModal.type==='ban'? `Ban ${confirmModal.userName}?` : `Delete ${confirmModal.userName} posts?`}
            </p>
            <p className="text-[13px] text-gray-500 mt-2 leading-5">
              {confirmModal.type==='ban'
               ? `He user ${confirmModal.userName} hi i BAN duh tak tak em? A account leh post zawng zawng a bo vek ang!`
                : `He User ${confirmModal.userName} post zawng zawng DELETE vek ang em? A bo hlen ang!`}
            </p>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setConfirmModal(null)} className="flex-1 bg-[#f3f4f6] text-black font-bold py-3.5 rounded-2xl text-[14px] active:scale-95">Cancel</button>
              <button onClick={confirmModal.type==='ban'? executeBan : executePostDelete} disabled={!!actionId} className={`flex-1 text-white font-black py-3.5 rounded-2xl text-[14px] active:scale-95 ${confirmModal.type==='ban'? 'bg-red-600' : 'bg-orange-500'}`}>
                {actionId? "..." : confirmModal.type==='ban'? "BAN" : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {successModal && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-[320px] shadow-2xl text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
            <p className="font-black text-[17px] text-[#002f34]">{successModal}</p>
            <button onClick={()=>setSuccessModal(null)} className="w-full mt-5 bg-black text-white font-black py-3.5 rounded-2xl text-[14px] active:scale-95">OK</button>
          </div>
        </div>
      )}

    </main>
  );
        }

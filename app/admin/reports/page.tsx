"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ReportsPage(){
  const [reports,setReports]=useState<any[]>([]);
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
        try{
          const uSnap=await getDoc(doc(db,"users",data.reportedUserId));
          if(uSnap.exists()) reportedUser=uSnap.data();
        }catch{}
        list.push({id:d.id,...data, reportedUser});
      }
      setReports(list);
    });
    return ()=>unsub();
  },[]);

  const deleteReport=async(id:string)=>{
    if(!confirm("Delete report?")) return;
    await deleteDoc(doc(db,"reports",id));
    setReports(r=>r.filter(x=>x.id!==id));
  };

  return (
    <main className="p-4 max-w-md mx-auto bg-white min-h-screen">
      <button onClick={()=>router.back()} className="mb-4 font-bold">← Back</button>
      <h1 className="font-black text-2xl mb-4">🚩 Reports ({reports.length})</h1>
      {reports.length===0 && <p className="text-gray-400 text-center mt-10">Report a awm lo</p>}
      <div className="flex flex-col gap-3">
        {reports.map(r=>(
          <div key={r.id} className="border-2 rounded-2xl p-4 bg-white">
            <div className="flex justify-between">
              <p className="font-black">{r.sellerName || r.reportedUser?.displayName} </p>
              <p className="text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded-full">{r.createdAt?.toDate? r.createdAt.toDate().toLocaleDateString() : "new"}</p>
            </div>
            <p className="text-[13px] mt-2 bg-gray-50 p-3 rounded-xl">"{r.message}"</p>
            <p className="text-[11px] text-gray-400 mt-2">Reported ID: {r.reportedUserId}</p>
            <p className="text-[11px] text-gray-400">Reporter: {r.reporterId}</p>
            <button onClick={()=>deleteReport(r.id)} className="w-full mt-3 bg-gray-200 py-2 rounded-xl text-[13px] font-bold">Delete Report</button>
          </div>
        ))}
      </div>
    </main>
  );
            }

"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

function formatTime(ts:any){
  if(!ts) return "";
  try{
    const d = ts.toDate? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime())/1000);
    if(diff < 60) return "Tunah chiah";
    if(diff < 3600) return `${Math.floor(diff/60)} min ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)} hr ago`;
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'}) + " " + d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  }catch{ return ""; }
}

export default function Jobs(){
  const [jobs,setJobs]=useState<any[]>([]);
  useEffect(()=>{ (async()=>{
    const q=query(collection(db,"jobs"), orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    setJobs(snap.docs.map(d=>({id:d.id,...d.data()})));
  })()},[]);
  return <main className="p-4 max-w-md mx-auto">
    <div className="flex justify-between items-center mb-4">
      <h1 className="font-bold text-xl">Jobs - Hnaruak</h1>
      <Link href="/jobs/new" className="bg-black text-white px-4 py-2 rounded-full text-sm">+ Hnaruak Post</Link>
    </div>
    <div className="flex flex-col gap-3">
      {jobs.map(j=><Link key={j.id} href={`/jobs/${j.id}`} className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="font-bold text-lg">{j.title}</p>
          <span className="text-[11px] bg-gray-100 px-2 py-1 rounded-full text-gray-600">{formatTime(j.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-500">{j.company} • {j.location}</p>
        <p className="text-green-600 font-bold mt-1">₹{j.salary}</p>
        <p className="text-[11px] text-gray-400 mt-2">Posted: {j.createdAt?.toDate? j.createdAt.toDate().toLocaleString() : ""}</p>
      </Link>)}
    </div>
  </main>
}

"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

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
      {jobs.map(j=><Link key={j.id} href={`/jobs/${j.id}`} className="bg-white border rounded-2xl p-4">
        <p className="font-bold">{j.title}</p>
        <p className="text-sm text-gray-500">{j.company} • {j.location}</p>
        <p className="text-green-600 font-bold mt-1">₹{j.salary}</p>
      </Link>)}
      {jobs.length===0 && <p className="text-center text-gray-400 mt-10">Hnaruak a la awm lo</p>}
    </div>
  </main>
}

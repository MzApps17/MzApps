"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";
export default function Jobs(){
  const [jobs,setJobs]=useState<any[]>([]);
  useEffect(()=>{(async()=>{const q=query(collection(db,"jobs"), orderBy("createdAt","desc")); const s=await getDocs(q); setJobs(s.docs.map(d=>({id:d.id,...d.data()})))})()},[]);
  return <main className="p-4"><div className="flex justify-between mb-4"><h1 className="font-bold text-xl">MzJobs</h1><Link href="/jobs/new" className="bg-black text-white px-4 py-2 rounded-full text-sm">+ Hnaruak</Link></div><div className="flex flex-col gap-3">{jobs.map(j=><Link key={j.id} href={`/jobs/${j.id}`} className="bg-white p-4 rounded-xl border"><p className="font-bold">{j.title}</p><p className="text-sm text-gray-500">{j.company} • {j.location}</p></Link>)}</div></main>
}

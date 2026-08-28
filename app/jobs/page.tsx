"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import Link from "next/link";

function formatTime(ts:any){
  if(!ts) return "";
  try{
    const d = ts.toDate? ts.toDate() : new Date(ts);
    const diff = Math.floor((new Date().getTime() - d.getTime())/1000);
    if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return d.toLocaleDateString('en-GB',{day:'2-digit',month:'short'});
  }catch{ return ""; }
}

export default function Jobs(){
  const [jobs,setJobs]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [cat,setCat]=useState("All");

  useEffect(()=>{ (async()=>{
    const q=query(collection(db,"jobs"), orderBy("createdAt","desc"));
    const snap=await getDocs(q);
    setJobs(snap.docs.map(d=>({id:d.id,...d.data()})));
  })()},[]);

  const filtered = jobs.filter(j=>{
    const s = search.toLowerCase();
    const matches = j.title?.toLowerCase().includes(s) || j.company?.toLowerCase().includes(s) || j.location?.toLowerCase().includes(s);
    const matchCat = cat==="All" || j.title?.toLowerCase().includes(cat.toLowerCase());
    return matches && matchCat;
  });

  const cats=["All","Sales","Driver","Teacher","Computer","Hnathawh"];

  return <main className="p-4 max-w-md mx-auto">
    <div className="flex justify-between items-center mb-4">
      <Link href="/" className="font-bold">← MZ</Link>
      <Link href="/jobs/new" className="bg-black text-white px-4 py-2 rounded-full text-sm">+ Post</Link>
    </div>
    <h1 className="font-bold text-2xl mb-3">Hnaruak</h1>

    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Hna zawng - Sales, Driver..." className="w-full border-2 p-3 rounded-2xl mb-3"/>

    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      {cats.map(c=><button key={c} onClick={()=>setCat(c)} className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap border ${cat===c?'bg-black text-white':'bg-white'}`}>{c}</button>)}
    </div>

    <div className="flex flex-col gap-3">
      {filtered.map(j=><Link key={j.id} href={`/jobs/${j.id}`} className="bg-white border rounded-2xl p-4">
        <div className="flex justify-between">
          <p className="font-bold">{j.title}</p>
          <span className="text-[11px] bg-gray-100 px-2 py-1 rounded-full">{formatTime(j.createdAt)}</span>
        </div>
        <p className="text-sm text-gray-500">{j.company} • {j.location}</p>
        <p className="text-green-600 font-bold mt-1">₹{j.salary}</p>
      </Link>)}
      {filtered.length===0 && <p className="text-center text-gray-400 mt-10">Hna a awm lo - "{search}"</p>}
    </div>
  </main>
}

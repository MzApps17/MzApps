"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

export default function JobDetail(){
  const {id}=useParams(); const {user}=useAuth(); const router=useRouter();
  const [j,setJ]=useState<any>(null);
  useEffect(()=>{(async()=>{
    const snap=await getDoc(doc(db,"jobs",id as string));
    if(snap.exists()) setJ({id:snap.id,...snap.data()});
  })()},[id]);
  if(!j) return <p className="p-6 text-center">Loading...</p>;
  return <div className="p-4 max-w-md mx-auto">
    <Link href="/jobs" className="text-sm">← Back</Link>
    <h1 className="text-2xl font-bold mt-3">{j.title}</h1>
    <p className="text-gray-600">{j.company} • {j.location}</p>
    <p className="text-xl font-black text-green-600 mt-2">₹{j.salary}/month</p>
    <p className="mt-4 whitespace-pre-wrap bg-gray-50 p-4 rounded-xl">{j.desc}</p>
    <div className="grid grid-cols-2 gap-3 mt-6">
      <a href={`https://wa.me/91${j.phone}?text=Hei ${j.title} hna hi ka dil duh e`} target="_blank" className="bg-green-600 text-white p-4 rounded-2xl text-center font-bold">WhatsApp</a>
      <a href={`tel:+91${j.phone}`} className="bg-blue-600 text-white p-4 rounded-2xl text-center font-bold">Call</a>
    </div>
    {user?.uid===j.uid && <button onClick={async()=>{if(confirm("Delete?")){await deleteDoc(doc(db,"jobs",id as string)); router.push("/jobs");}}} className="w-full mt-4 bg-red-50 text-red-600 p-3 rounded-xl">Delete</button>}
  </div>
}

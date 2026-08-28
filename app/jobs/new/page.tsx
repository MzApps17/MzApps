"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
export default function NewJob(){
  const {user}=useAuth(); const r=useRouter();
  const [title,setTitle]=useState(""); const [company,setCompany]=useState(""); const [location,setLocation]=useState(""); const [wa,setWa]=useState("");
  const submit=async(e:any)=>{e.preventDefault(); if(!user) return alert("Login"); await addDoc(collection(db,"jobs"),{title,company,location,whatsapp:wa,uid:user.uid,createdAt:serverTimestamp()}); r.push("/jobs")};
  return <form onSubmit={submit} className="p-4 max-w-md mx-auto flex flex-col gap-3"><h1 className="font-bold text-xl">Hnaruak Post</h1><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Hna hming (e.g. Sales Staff)" className="border p-3 rounded-xl"/><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company hming" className="border p-3 rounded-xl"/><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Hmun (e.g. Aizawl)" className="border p-3 rounded-xl"/><input value={wa} onChange={e=>setWa(e.target.value)} placeholder="WhatsApp Number" className="border p-3 rounded-xl"/><button className="bg-black text-white p-3 rounded-xl font-bold">Post rawh</button></form>
}

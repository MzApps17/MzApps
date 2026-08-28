"use client";
import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function NewJob(){
  const {user}=useAuth(); const router=useRouter();
  const [title,setTitle]=useState(""); const [company,setCompany]=useState("");
  const [location,setLocation]=useState(""); const [salary,setSalary]=useState("");
  const [phone,setPhone]=useState(""); const [desc,setDesc]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async(e:any)=>{
    e.preventDefault(); setLoading(true);
    try{
      await addDoc(collection(db,"jobs"),{title, company, location, salary, phone:phone.replace(/\D/g,""), desc, uid:user?.uid, createdAt:serverTimestamp()});
      alert("Job Post hlawhtling!"); router.push("/jobs");
    }catch(err:any){ alert(err.message); } finally{ setLoading(false); }
  }
  return <form onSubmit={submit} className="p-4 max-w-md mx-auto flex flex-col gap-3">
    <h1 className="font-bold text-xl">Hnaruak Post</h1>
    <input required value={title} onChange={e=>setTitle(e.target.value)} placeholder="Hna hming - e.g. Sales Boy" className="border-2 p-3 rounded-xl"/>
    <input required value={company} onChange={e=>setCompany(e.target.value)} placeholder="Company/Dawr hming" className="border p-3 rounded-xl"/>
    <input required value={location} onChange={e=>setLocation(e.target.value)} placeholder="Khawiah - Aizawl" className="border p-3 rounded-xl"/>
    <input required value={salary} onChange={e=>setSalary(e.target.value)} placeholder="Hlawh - 15000" className="border p-3 rounded-xl"/>
    <textarea required value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Hna chungchang..." className="border p-3 rounded-xl h-20"/>
    <input required value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Contact No. 9612XXXXXX" type="tel" className="border-2 border-green-600 p-3 rounded-xl bg-green-50"/>
    <button disabled={loading} className="bg-black text-white p-4 rounded-xl font-bold">{loading?"Posting...":"Post rawh"}</button>
  </form>
}

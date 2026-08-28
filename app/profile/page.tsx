"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Profile(){
  const {user}=useAuth();
  const router=useRouter();
  const [myProducts,setMyProducts]=useState<any[]>([]);
  const [myJobs,setMyJobs]=useState<any[]>([]);

  useEffect(()=>{
    if(!user) return;
    (async()=>{
      const q1=query(collection(db,"products"), where("uid","==",user.uid));
      const s1=await getDocs(q1);
      setMyProducts(s1.docs.map(d=>({id:d.id,...d.data()})));

      const q2=query(collection(db,"jobs"), where("uid","==",user.uid));
      const s2=await getDocs(q2);
      setMyJobs(s2.docs.map(d=>({id:d.id,...d.data()})));
    })();
  },[user]);

  if(!user){
    return <main className="p-6 max-w-md mx-auto text-center mt-20">
      <div className="text-6xl mb-4">👤</div>
      <h1 className="font-bold text-xl">Log in a ngai</h1>
      <p className="text-sm text-gray-500 mt-2">Thil i zawrh duh chuan Log in rawh</p>
      <Link href="/login" className="block mt-6 bg-black text-white p-4 rounded-2xl font-bold">Log In / Sign Up</Link>
      <Link href="/" className="block mt-3 text-sm">← Home</Link>
    </main>
  }

  return <main className="p-4 max-w-md mx-auto">
    {/* HEADER */}
    <div className="bg-black text-white rounded-[28px] p-6 mt-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center text-2xl font-black">
          {user.email?.[0].toUpperCase()}
        </div>
        <div>
          <p className="font-black text-lg">{user.displayName || "MZ User"}</p>
          <p className="text-xs text-gray-300">{user.email}</p>
          <p className="text-[10px] bg-white/20 px-2 py-1 rounded-full inline-block mt-2">✅ Verified Member</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="bg-white/10 p-3 rounded-2xl text-center">
          <p className="text-2xl font-black">{myProducts.length}</p>
          <p className="text-[11px] text-gray-300">Thil Zawrh</p>
        </div>
        <div className="bg-white/10 p-3 rounded-2xl text-center">
          <p className="text-2xl font-black">{myJobs.length}</p>
          <p className="text-[11px] text-gray-300">Hnaruak Post</p>
        </div>
      </div>
    </div>

    {/* MY BAZAR */}
    <div className="mt-8">
      <h2 className="font-bold">Ka Thil Zawrh te ({myProducts.length})</h2>
      {myProducts.length===0? <p className="text-sm text-gray-400 mt-2">I la zuar lo</p> :
        <div className="grid grid-cols-2 gap-3 mt-3">
          {myProducts.map(p=>
            <div key={p.id} className="bg-white border rounded-2xl overflow-hidden">
              <img src={p.image} className="h-24 w-full object-cover"/>
              <div className="p-2">
                <p className="text-sm font-bold truncate">{p.title}</p>
                <p className="text-xs text-blue-600">₹{p.price}</p>
                <button onClick={async()=>{if(confirm("Delete duh em?")){await deleteDoc(doc(db,"products",p.id)); setMyProducts(myProducts.filter(x=>x.id!==p.id));}}} className="text-[11px] text-red-500 mt-1">Delete</button>
              </div>
            </div>
          )}
        </div>
      }
    </div>

    {/* MY JOBS */}
    <div className="mt-6">
      <h2 className="font-bold">Ka Hnaruak Post ({myJobs.length})</h2>
      {myJobs.length===0? <p className="text-sm text-gray-400 mt-2">I la post lo</p> :
        <div className="flex flex-col gap-2 mt-3">
          {myJobs.map(j=>
            <div key={j.id} className="bg-white border p-3 rounded-2xl flex justify-between items-center">
              <div><p className="font-bold text-sm">{j.title}</p><p className="text-[11px] text-gray-500">{j.company}</p></div>
              <button onClick={async()=>{if(confirm("Delete?")){await deleteDoc(doc(db,"jobs",j.id)); setMyJobs(myJobs.filter(x=>x.id!==j.id));}}} className="text-red-500 text-xs">Delete</button>
            </div>
          )}
        </div>
      }
    </div>

    <button onClick={async()=>{await signOut(auth); router.push("/");}} className="w-full mt-10 bg-red-50 text-red-600 p-4 rounded-2xl font-bold">Log Out</button>

    <Link href="/" className="block text-center text-sm mt-4">← Home</Link>
  </main>
}

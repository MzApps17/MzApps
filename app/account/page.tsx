"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";

export default function Account(){
  const [user,setUser]=useState<any>(null);
  const router=useRouter();

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, (u)=>{
      if(!u){ router.push("/login"); return; }
      setUser(u);
    });
    return ()=>unsub();
  },[]);

  if(!user) return <div className="p-10">Loading...</div>;

  return (
    <main className="min-h-screen bg-white p-0">
      <div className="bg-black text-white m-3 rounded-[28px] p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center text-2xl font-black">{user.email[0].toUpperCase()}</div>
          <div>
            <p className="text-[20px] font-bold">{user.email.split("@")[0]}</p>
            <p className="text-[13px] text-gray-300">{user.email}</p>
            <p className="mt-2 bg-white/20 inline-block px-3 py-1 rounded-full text-[11px]">✅ Verified Member</p>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="bg-gray-50 rounded-2xl p-4 mt-2">
          <p className="font-bold">Email</p><p className="text-gray-500 text-[13px]">{user.email}</p>
        </div>
        <button onClick={async()=>{ await signOut(auth); router.push("/"); }} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl mt-10">Log Out</button>
      </div>
    </main>
  );
        }

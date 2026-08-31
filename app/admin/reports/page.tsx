"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc, where, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ReportsPage(){
  const [reports,setReports]=useState<any[]>([]);
  const [allUsers,setAllUsers]=useState<any[]>([]);
  const [allPosts,setAllPosts]=useState<any[]>([]);
  const [showDeleteId,setShowDeleteId]=useState<string|null>(null);
  const [confirmModal,setConfirmModal]=useState<any>(null);
  const [successModal,setSuccessModal]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const [userSearch,setUserSearch]=useState("");
  const [editPost,setEditPost]=useState<any>(null);
  const router=useRouter();

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      if(!u){ router.push("/login"); return; }
      if(u.email!=="mizochatapps@gmail.com"){ router.push("/"); return; }
      try{
        const snap=await getDocs(query(collection(db,"reports"), orderBy("createdAt","desc")));
        const list:any[]=[];
        for(const d of snap.docs){
          const data=d.data();
          let ru:any=null;
          try{ const s=await getDoc(doc(db,"users",data.reportedUserId)); if(s.exists()) ru=s.data(); }catch{}
          list.push({id:d.id,...data, reportedUser:ru});
        }
        setReports(list);
      }catch{}
      try{
        const usnap=await getDocs(collection(db,"users"));
        const ulist=usnap.docs.map(d=>{
          const data:any=d.data();
          let name=data.displayName || data.name || "";
          if(!name && data.email) name=data.email.split('@')[0];
          if(!name) name="User";
          return {id:d.id, displayName:name, email:data.email||"",...data};
        });
        setAllUsers(ulist);
      }catch{}
      try{
        const psnap=await getDocs(collection(db,"products"));
        setAllPosts(psnap.docs.map(d=>({id:d.id, col:"products",...d.data()})));
      }catch{}
    });
    return ()=>unsub();
  },[]);

  return (
    <main className="min-h-screen bg-white p-4">
      <h1 className="font-black text-xl">Reports ({reports.length}) - Build Fixed</h1>
      <div className="mt-4">
        {reports.map((r:any)=>{
          let name="Unknown";
          if(r.reportedUser?.displayName) name=r.reportedUser.displayName;
          else if(r.reportedUser?.email) name=r.reportedUser.email.split('@')[0];
          else if(r.sellerName) name=r.sellerName;
          return <div key={r.id} className="border p-3 rounded-xl mt-2"><p className="font-bold">{name}</p><p className="text-sm bg-gray-100 p-2 rounded mt-1">{r.message}</p><button onClick={()=>{deleteDoc(doc(db,"reports",r.id)); setReports(prev=>prev.filter(x=>x.id!==r.id))}} className="bg-black text-white px-3 py-1 rounded-full text-xs mt-2">Delete Report</button></div>;
        })}
      </div>
      <div className="mt-8">
        <h2 className="font-black text-lg">Users ({allUsers.length})</h2>
        {allUsers.map((u:any)=><div key={u.id} className="border p-2 rounded-xl mt-2 flex justify-between"><div><p className="font-bold text-sm">{u.displayName}</p><p className="text-xs text-gray-500">{u.email}</p></div></div>)}
      </div>
      <div className="mt-8">
        <h2 className="font-black text-lg">Posts ({allPosts.length})</h2>
        {allPosts.map((p:any)=><div key={p.id} className="border p-2 rounded-xl mt-2"><p className="font-bold text-sm">{p.title || "No title"}</p></div>)}
      </div>
    </main>
  );
}

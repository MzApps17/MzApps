// app/admin/reports/page.tsx - SIMPLE - New users dik vek tawh ang
"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc, where, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function ReportsPage(){
  const [reports,setReports]=useState<any[]>([]);
  const [onlineCount,setOnlineCount]=useState(0);
  const [showDeleteId,setShowDeleteId]=useState<string|null>(null);
  const [deleting,setDeleting]=useState(false);
  const [actionId,setActionId]=useState<string|null>(null);
  const adminEmails=["mizochatapps@gmail.com"];
  const router=useRouter();
  const [confirmModal,setConfirmModal]=useState<any>(null);
  const [successModal,setSuccessModal]=useState<string|null>(null);
  const [allPosts,setAllPosts]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [editPost,setEditPost]=useState<any|null>(null);
  const [saving,setSaving]=useState(false);
  const [allUsers,setAllUsers]=useState<any[]>([]);
  const [userSearch,setUserSearch]=useState("");
  const [confirmDeleteUser,setConfirmDeleteUser]=useState<any>(null);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      if(!u){ router.push("/login"); return; }
      if(!adminEmails.includes(u.email||"")){ alert("Admin chiah lut thei"); router.push("/"); return; }
      const q=query(collection(db,"reports"), orderBy("createdAt","desc"));
      try {
        const snap=await getDocs(q);
        const list:any[]=[];
        for(const d of snap.docs){
          const data=d.data();
          let reportedUser:any=null;
          let reporterUser:any=null;
          try{ const uSnap=await getDoc(doc(db,"users",data.reportedUserId)); if(uSnap.exists()) reportedUser=uSnap.data(); }catch{}
          try{ if(data.reporterId && data.reporterId!=="anonymous"){ const rSnap=await getDoc(doc(db,"users",data.reporterId)); if(rSnap.exists()) reporterUser=rSnap.data(); } }catch{}
          list.push({id:d.id,...data, reportedUser, reporterUser});
        }
        setReports(list);
      } catch {}
      fetchAllPosts();
      fetchAllUsers();
      try{ const twoMinAgo = new Date(Date.now() - 2*60*1000); const onlineQ = query(collection(db,"presence"), where("lastSeen",">", twoMinAgo)); const onlineSnap = await getDocs(onlineQ); setOnlineCount(onlineSnap.size); }catch{ setOnlineCount(0); }
    });
    return ()=>{ unsub(); };
  },[]);

  const fetchAllPosts = async () => {
    const all:any[] = [];
    const cols = ["products", "jobs"];
    for(const colName of cols){
      try{
        const snap = await getDocs(collection(db, colName));
        snap.docs.forEach(d=> all.push({id:d.id, col:colName,...d.data()}));
      }catch{}
    }
    setAllPosts(all);
  };

  const fetchAllUsers = async () => {
    try{
      const snap = await getDocs(collection(db,"users"));
      const list = snap.docs.map(d=>{
        const data:any = d.data();
        const email = data.email || "";
        let name = data.displayName || data.name || "";
        if(!name && email) name = email.split('@')[0];
        if(!name) name = "User";
        return {
          id: d.id,
          displayName: name,
          email: email,
          photoURL: data.photoURL || "",
         ...data
        };
      });
      setAllUsers(list);
    }catch(e){ console.log(e); }
  };

  const confirmDelete=async()=>{
    if(!showDeleteId) return;
    setDeleting(true);
    await deleteDoc(doc(db,"reports",showDeleteId));
    setReports(r=>r.filter(x=>x.id!==showDeleteId));
    setDeleting(false);
    setShowDeleteId(null);
    setSuccessModal("Report delete a ni e!");
  };

  const executePostDelete = async () => {
    if(!confirmModal) return;
    setActionId(confirmModal.reportId);
    try{
      const cols = ["products", "jobs"];
      for(const colName of cols){
        try{
          const pq = query(collection(db, colName), where("userId","==", confirmModal.userId));
          const psnap = await getDocs(pq);
          for(const pd of psnap.docs) await deleteDoc(doc(db, colName, pd.id));
        }catch{}
      }
      setSuccessModal("Post delete a ni e!");
      fetchAllPosts();
    }catch(e:any){ setSuccessModal("Error: "+e.message); }
    setActionId(null);
    setConfirmModal(null);
  };

  const executeBan = async () => {
    if(!confirmModal) return;
    setActionId(confirmModal.reportId);
    try{
      await deleteDoc(doc(db,"users",confirmModal.userId));
      await deleteDoc(doc(db,"reports",confirmModal.reportId));
      setReports(r=>r.filter(x=>x.id!==confirmModal.reportId));
      setSuccessModal("BAN a ni e!");
      fetchAllUsers();
    }catch(e:any){ setSuccessModal("Error: "+e.message); }
    setActionId(null);
    setConfirmModal(null);
  };

  const deleteSinglePost = async (post:any) => {
    if(!confirm("Delete duh em?")) return;
    await deleteDoc(doc(db, post.col, post.id));
    setAllPosts(p=>p.filter(x=>x.id!==post.id));
  };

  const saveEdit = async () => {
    if(!editPost) return;
    setSaving(true);
    try{
      await updateDoc(doc(db, editPost.col, editPost.id), {
        title: editPost.title,
        price: editPost.price,
        description: editPost.description || "",
      });
      setAllPosts(p=>p.map(x=> x.id===editPost.id? editPost : x));
      setEditPost(null);
      setSuccessModal("Save a ni e!");
    }catch(e:any){ setSuccessModal("Error: "+e.message); }
    setSaving(false);
  };

  const executeDeleteUserAccount = async () => {
    if(!confirmDeleteUser) return;
    setDeleting(true);
    try{
      await deleteDoc(doc(db,"users",confirmDeleteUser.id));
      setAllUsers(u=>u.filter(x=>x.id!==confirmDeleteUser.id));
      setSuccessModal("Delete fel!");
    }catch(e:any){ setSuccessModal("Error: "+e.message); }
    setDeleting(false);
    setConfirmDeleteUser(null);
  };

  const filteredPosts = allPosts.filter(p => {
    const s = search.toLowerCase();
    const t = (p.title || "").toLowerCase();
    return t.includes(s);
  });

  const filteredUsers = allUsers.filter(u => {
    const s = userSearch.toLowerCase();
    const dn = (u.displayName || "").toLowerCase();
    const em = (u.email || "").toLowerCase();
    return dn.includes(s) || em.includes(s);
  });

  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="sticky top-0 z-50 bg-white border-b px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>router.back()} className="w-12 h-12 border rounded-full flex items-center justify-center">Back</button>
          <h1 className="font-black text-[19px]">Reports ({reports.length})</h1>
        </div>
        <div className="bg-black text-white px-3 py-1.5 rounded-full text-[11px]">Online ({onlineCount})</div>
      </div>

      <div className="p-3 max-w-md mx-auto">
        <div className="flex flex-col gap-3 mt-2">
          {reports.map((r:any)=>{
            let rName = "Unknown";
            if(r.reportedUser?.displayName) rName = r.reportedUser.displayName;
            else if(r.reportedUser?.name) rName = r.reportedUser.name;
            else if(r.sellerName) rName = r.sellerName;
            else if(r.reportedUser?.email) rName = r.reportedUser.email.split('@')[0];

            return (
              <div key={r.id} className="border-2 rounded-2xl p-4 bg-white">
                <p className="font-black">{rName}</p>
                <p className="text-[13px] mt-2 bg-gray-50 p-3 rounded-xl">{r.message}</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  <button onClick={()=>setConfirmModal({reportId:r.id, userId:r.reportedUserId, userName:rName, type:'post'})} className="bg-orange-500 text-white py-2.5 rounded-xl text-[11px] font-black">POST DELETE</button>
                  <button onClick={()=>setConfirmModal({reportId:r.id, userId:r.reportedUserId, userName:rName, type:'ban'})} className="bg-red-600 text-white py-2.5 rounded-xl text-[11px] font-black">BAN USER</button>
                  <button onClick={()=>setShowDeleteId(r.id)} className="bg-gray-200 py-2.5 rounded-xl text-[11px] font-bold">Delete</button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 border-t-4 border-black pt-6">
          <h2 className="font-black text-[20px]">Posts ({filteredPosts.length})</h2>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="w-full border-2 rounded-xl px-4 py-3 mt-2" />
          <div className="flex flex-col gap-2 mt-4">
            {filteredPosts.map((p:any)=>(
              <div key={p.id} className="border rounded-2xl p-3 flex gap-3 bg-gray-50">
                <div className="flex-1">
                  <p className="font-black text-[13px]">{p.title || "No title"}</p>
                  <div className="flex gap-2 mt-2">
                    <button onClick={()=>setEditPost(p)} className="bg-black text-white px-3 py-1 rounded-full text-[10px]">EDIT</button>
                    <button onClick={()=>deleteSinglePost(p)} className="bg-red-600 text-white px-3 py-1 rounded-full text-[10px]">DELETE</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t-4 border-black pt-6">
          <h2 className="font-black text-[20px]">Users ({filteredUsers.length})</h2>
          <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search name/email..." className="w-full border-2 rounded-xl px-4 py-3 mt-2" />
          <div className="flex flex-col gap-2 mt-4">
            {filteredUsers.map((u:any)=>(
              <div key={u.id} className="border rounded-2xl p-3 flex gap-3 bg-white">
                <div className="flex-1">
                  <p className="font-black text-[13px]">{u.displayName}</p>
                  <p className="text-[11px] text-gray-600">{u.email}</p>
                </div>
                <button onClick={()=>setConfirmDeleteUser({id:u.id, name:u.displayName})} className="bg-red-600 text-white px-4 h-fit py-2 rounded-full text-[10px]">DELETE</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showDeleteId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[320px] text-center">
            <p className="font-black">Delete report?</p>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setShowDeleteId(null)} className="flex-1 bg-gray-100 py-3 rounded-2xl">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 bg-black text-white py-3 rounded-2xl">OK</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] text-center">
            <p className="font-black">{confirmModal.type==="ban"? "Ban " + confirmModal.userName + "?" : "Delete posts?"}</p>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setConfirmModal(null)} className="flex-1 bg-gray-100 py-3 rounded-2xl">Cancel</button>
              <button onClick={confirmModal.type==="ban"? executeBan : executePostDelete} className="flex-1 bg-red-600 text-white py-3 rounded-2xl">OK</button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[340px] text-center">
            <p className="font-black">Delete {confirmDeleteUser.name}?</p>
            <div className="flex gap-2 mt-6">
              <button onClick={()=>setConfirmDeleteUser(null)} className="flex-1 bg-gray-100 py-3 rounded-2xl">Cancel</button>
              <button onClick={executeDeleteUserAccount} className="flex-1 bg-red-600 text-white py-3 rounded-2xl">DELETE</button>
            </div>
          </div>
        </div>
      )}

      {editPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[360px]">
            <p className="font-black">Edit Post</p>
            <input value={editPost.title || ""} onChange={e=>setEditPost({...editPost, title:e.target.value})} className="border-2 rounded-xl px-4 py-3 w-full mt-3" />
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setEditPost(null)} className="flex-1 bg-gray-100 py-3 rounded-2xl">Cancel</button>
              <button onClick={saveEdit} className="flex-1 bg-black text-white py-3 rounded-2xl">SAVE</button>
            </div>
          </div>
        </div>
      )}

      {successModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[320px] text-center">
            <p className="font-black">{successModal}</p>
            <button onClick={()=>setSuccessModal(null)} className="w-full mt-5 bg-black text-white py-3 rounded-2xl">OK</button>
          </div>
        </div>
      )}
    </main>
  );
}

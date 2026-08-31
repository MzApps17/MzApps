// app/admin/reports/page.tsx - FIXED BUILD ERROR
"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy, doc, deleteDoc, getDoc, where, updateDoc, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

function getNameFromData(data:any){
  if(!data) return "";
  if(data.displayName && data.displayName.trim()!=="") return data.displayName;
  if(data.name && data.name.trim()!=="") return data.name;
  if(data.fullName && data.fullName.trim()!=="") return data.fullName;
  if(data.userName && data.userName.trim()!=="") return data.userName;
  if(data.sellerName && data.sellerName.trim()!=="") return data.sellerName;
  if(data.email && data.email.trim()!=="") return data.email.split('@')[0];
  if(data.userEmail && data.userEmail.trim()!=="") return data.userEmail.split('@')[0];
  return "";
}
function getEmailFromData(data:any){
  if(!data) return "";
  if(data.email && data.email.trim()!=="") return data.email;
  if(data.userEmail && data.userEmail.trim()!=="") return data.userEmail;
  return "";
}

export default function ReportsPage(){
  const [reports,setReports]=useState<any[]>([]);
  const [onlineCount,setOnlineCount]=useState(0);
  const [showDeleteId,setShowDeleteId]=useState<string|null>(null);
  const [deleting,setDeleting]=useState(false);
  const [actionId,setActionId]=useState<string|null>(null);
  const adminEmails=["mizochatapps@gmail.com"];
  const router=useRouter();
  const [confirmModal,setConfirmModal]=useState<{type:'post'|'ban'|null, reportId:string, userId:string, userName:string} | null>(null);
  const [successModal,setSuccessModal]=useState<string|null>(null);
  const [allPosts,setAllPosts]=useState<any[]>([]);
  const [search,setSearch]=useState("");
  const [editPost,setEditPost]=useState<any|null>(null);
  const [saving,setSaving]=useState(false);
  const [allUsers,setAllUsers]=useState<any[]>([]);
  const [userSearch,setUserSearch]=useState("");
  const [confirmDeleteUser,setConfirmDeleteUser]=useState<{id:string, name:string} | null>(null);

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
          let reportedUser:any=null; let reporterUser:any=null;
          try{ const uSnap=await getDoc(doc(db,"users",data.reportedUserId)); if(uSnap.exists()) reportedUser=uSnap.data(); }catch{}
          try{ if(data.reporterId && data.reporterId!=="anonymous"){ const rSnap=await getDoc(doc(db,"users",data.reporterId)); if(rSnap.exists()) reporterUser=rSnap.data(); } }catch{}
          if(!reportedUser || (!reportedUser.displayName &&!reportedUser.email)){
            try{
              const pq = query(collection(db,"products"), where("userId","==", data.reportedUserId), limit(1));
              const psnap = await getDocs(pq);
              if(!psnap.empty){
                const postData = psnap.docs[0].data() as any;
                reportedUser = {
                 ...(reportedUser||{}),
                  displayName: reportedUser?.displayName || getNameFromData(postData) || data.sellerName || "",
                  email: reportedUser?.email || getEmailFromData(postData) || ""
                };
              } else {
                const jq = query(collection(db,"jobs"), where("userId","==", data.reportedUserId), limit(1));
                const jsnap = await getDocs(jq);
                if(!jsnap.empty){
                  const postData = jsnap.docs[0].data() as any;
                  reportedUser = {
                   ...(reportedUser||{}),
                    displayName: reportedUser?.displayName || getNameFromData(postData) || data.sellerName || "",
                    email: reportedUser?.email || getEmailFromData(postData) || ""
                  };
                }
              }
            }catch{}
          }
          list.push({id:d.id,...data, reportedUser, reporterUser});
        }
        setReports(list);
      } catch {}
      fetchAllPosts();
      fetchAllUsers();
      try{ const twoMinAgo = new Date(Date.now() - 2*60*1000); const onlineQ = query(collection(db,"presence"), where("lastSeen",">", twoMinAgo)); const onlineSnap = await getDocs(onlineQ); setOnlineCount(onlineSnap.size); }catch{ setOnlineCount(0); }
    });
    const iv = setInterval(async()=>{ try{ const twoMinAgo = new Date(Date.now() - 2*60*1000); const onlineQ = query(collection(db,"presence"), where("lastSeen",">", twoMinAgo)); const onlineSnap = await getDocs(onlineQ); setOnlineCount(onlineSnap.size); }catch{} }, 30000);
    return ()=>{ unsub(); clearInterval(iv); };
  },[]);

  const fetchAllPosts = async () => {
    const all:any[] = [];
    const cols = ["products", "jobs"];
    for(const colName of cols){ try{ const q = query(collection(db, colName), orderBy("createdAt","desc")); const snap = await getDocs(q); snap.docs.forEach(d=> all.push({id:d.id, col:colName,...d.data()})); }catch{ try{ const snap = await getDocs(collection(db, colName)); snap.docs.forEach(d=> all.push({id:d.id, col:colName,...d.data()})); }catch{} } }
    all.sort((a,b)=> (b.createdAt?.seconds||0) - (a.createdAt?.seconds||0));
    setAllPosts(all);
  };

  const fetchAllUsers = async () => {
    try{
      const snap = await getDocs(collection(db,"users"));
      let list:any[] = snap.docs.map(d=> {
        const data = d.data() as any;
        const email = getEmailFromData(data);
        const name = getNameFromData(data);
        return {
          id: d.id,
          displayName: name || (data.email? data.email.split('@')[0] : "Hming awm lo"),
          name: data.name || data.displayName || name || "",
          email: email || "",
          photoURL: data.photoURL || "",
         ...data
        }
      });
      for(let i=0; i<list.length; i++){
        const u = list[i] as any;
        if(!u.email || u.displayName==="Hming awm lo"){
          try{
            const pq = query(collection(db,"products"), where("userId","==", u.id), limit(1));
            const psnap = await getDocs(pq);
            if(!psnap.empty){
              const pd = psnap.docs[0].data() as any;
              if(!u.email && getEmailFromData(pd)) u.email = getEmailFromData(pd);
              if(u.displayName==="Hming awm lo"){
                const n = getNameFromData(pd);
                if(n) u.displayName = n;
              }
            }
          }catch{}
          if((!u.displayName || u.displayName==="Hming awm lo") && u.email){
            u.displayName = u.email.split('@')[0];
          }
          if(!u.displayName || u.displayName==="Hming awm lo"){
            u.displayName = "User " + u.id.slice(0,5);
          }
        }
      }
      setAllUsers(list);
    } catch(e:any){ console.log("Users error:", e); }
  };

  const confirmDelete=async()=>{ if(!showDeleteId) return; setDeleting(true); await deleteDoc(doc(db,"reports",showDeleteId)); setReports(r=>r.filter(x=>x.id!==showDeleteId)); setDeleting(false); setShowDeleteId(null); setSuccessModal("Report delete a ni e!"); };
  const executePostDelete = async () => { if(!confirmModal) return; setActionId(confirmModal.reportId); const reportedUserId = confirmModal.userId; try{ const collectionsToCheck = ["posts", "products", "ads", "listings", "jobs"]; let totalDeleted = 0; for(const colName of collectionsToCheck){ try{ const pq = query(collection(db, colName), where("uid","==", reportedUserId)); const psnap = await getDocs(pq); for(const pd of psnap.docs){ await deleteDoc(doc(db, colName, pd.id)); totalDeleted++; } const pq2 = query(collection(db, colName), where("userId","==", reportedUserId)); const psnap2 = await getDocs(pq2); for(const pd of psnap2.docs){ await deleteDoc(doc(db, colName, pd.id)); totalDeleted++; } }catch{} } setSuccessModal(`${totalDeleted} post delete a ni e!`); fetchAllPosts(); }catch(e:any){ setSuccessModal("Error: "+e.message); } setActionId(null); setConfirmModal(null); };
  const executeBan = async () => { if(!confirmModal) return; setActionId(confirmModal.reportId); const reportedUserId = confirmModal.userId; const reportId = confirmModal.reportId; try{ await deleteDoc(doc(db,"users",reportedUserId)); try{ await deleteDoc(doc(db,"presence",reportedUserId)); }catch{} const collectionsToCheck = ["posts", "products", "ads", "listings", "jobs"]; for(const colName of collectionsToCheck){ try{ const pq = query(collection(db, colName), where("uid","==", reportedUserId)); const psnap = await getDocs(pq); for(const pd of psnap.docs) await deleteDoc(doc(db, colName, pd.id)); const pq2 = query(collection(db, colName), where("userId","==", reportedUserId)); const psnap2 = await getDocs(pq2); for(const pd of psnap2.docs) await deleteDoc(doc(db, colName, pd.id)); }catch{} } await deleteDoc(doc(db,"reports",reportId)); setReports(r=>r.filter(x=>x.id!==reportId)); setSuccessModal(`User ${confirmModal.userName} BAN a ni e!`); fetchAllPosts(); fetchAllUsers(); }catch(e:any){ setSuccessModal("Error ban: "+e.message); } setActionId(null); setConfirmModal(null); };
  const deleteSinglePost = async (post:any) => { if(!confirm(`"${post.title || post.name}" hi delete duh em?`)) return; await deleteDoc(doc(db, post.col, post.id)); setAllPosts(p=>p.filter(x=>x.id!==post.id)); setSuccessModal("Post delete a ni e!"); };
  const saveEdit = async () => { if(!editPost) return; setSaving(true); try{ await updateDoc(doc(db, editPost.col, editPost.id), { title: editPost.title, price: editPost.price, description: editPost.description || editPost.desc || "", }); setAllPosts(p=>p.map(x=> x.id===editPost.id? editPost : x)); setEditPost(null); setSuccessModal("Edit save a ni e!"); }catch(e:any){ setSuccessModal("Error: "+e.message); } setSaving(false); };
  const executeDeleteUserAccount = async () => { if(!confirmDeleteUser) return; setDeleting(true); try{ const uid = confirmDeleteUser.id; await deleteDoc(doc(db,"users",uid)); try{ await deleteDoc(doc(db,"presence",uid)); }catch{} const cols = ["products","jobs","posts","ads","listings"]; for(const colName of cols){ try{ const pq = query(collection(db,colName), where("userId","==",uid)); const snap = await getDocs(pq); for(const d of snap.docs) await deleteDoc(doc(db,colName,d.id)); const pq2 = query(collection(db,colName), where("uid","==",uid)); const snap2 = await getDocs(pq2); for(const d of snap2.docs) await deleteDoc(doc(db,colName,d.id)); }catch{} } setAllUsers(u=>u.filter(x=>x.id!==uid)); setSuccessModal(`${confirmDeleteUser.name} account delete fel!`); fetchAllPosts(); }catch(e:any){ setSuccessModal("Error: "+e.message); } setDeleting(false); setConfirmDeleteUser(null); };

  const filteredPosts = allPosts.filter(p => (p.title?.toLowerCase()||"").includes(search.toLowerCase()) || (p.name?.toLowerCase()||"").includes(search.toLowerCase()));
  const filteredUsers = allUsers.filter(u => (u.displayName?.toLowerCase()||"").includes(userSearch.toLowerCase()) || (u.name?.toLowerCase()||"").includes(userSearch.toLowerCase()) || (u.email?.toLowerCase()||"").includes(userSearch.toLowerCase()));

  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="sticky top-0 z-50 bg-white border-b border-gray-100 px-3 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={()=>router.back()} className="w-12 h-12 bg-white rounded-full flex items-center justify-center border shadow-sm active:scale-95">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <h1 className="font-black text-[19px] text-[#002f34]">Reports ({reports.length})</h1>
        </div>
        <div className="bg-black text-white px-3 py-1.5 rounded-full text-[11px] font-black tracking-wide flex-shrink-0">Users Online ({onlineCount})</div>
      </div>
      <div className="p-3 max-w-md mx-auto">
        {reports.length===0 && <p className="text-gray-400 text-center mt-10 font-bold">Report a awm lo</p>}
        <div className="flex flex-col gap-3 mt-2">
          {reports.map(r=>{
            const rName = getNameFromData(r.reportedUser) || (r as any).sellerName || r.reportedUserId?.slice(0,8) || "Hming awm lo";
            const rEmail = getEmailFromData(r.reportedUser) || "";
            return (
              <div key={r.id} className="border-2 rounded-2xl p-4 bg-white">
                <div className="flex justify-between"><p className="font-black text-[16px]">{rName}</p><p className="text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded-full h-fit">{r.createdAt?.toDate? r.createdAt.toDate().toLocaleDateString() : "new"}</p></div>
                <p className="text-[13px] mt-2 bg-gray-50 p-3 rounded-xl">{`"${r.message}"`}</p>
                <div className="mt-3 bg-gray-50 p-2.5 rounded-xl space-y-1"><p className="text-[12px]"><span className="text-gray-500">Reported:</span> <span className="font-black text-black">{rName}</span>{rEmail? <span className="text-[11px] text-gray-500"> ({rEmail})</span> : null}</p><p className="text-[12px]"><span className="text-gray-500">Reporter:</span> <span className="font-black text-black">{r.reporterUser?.displayName || r.reporterUser?.name || "Anonymous"}</span></p></div>
                <div className="grid grid-cols-3 gap-2 mt-3"><button onClick={()=>setConfirmModal({type:'post', reportId:r.id, userId:r.reportedUserId, userName: rName})} disabled={actionId===r.id} className="bg-orange-500 text-white py-2.5 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50">{actionId===r.id? "..." : "POST DELETE"}</button><button onClick={()=>setConfirmModal({type:'ban', reportId:r.id, userId:r.reportedUserId, userName: rName})} disabled={actionId===r.id} className="bg-red-600 text-white py-2.5 rounded-xl text-[11px] font-black active:scale-95 disabled:opacity-50">{actionId===r.id? "..." : "BAN USER"}</button><button onClick={()=>setShowDeleteId(r.id)} className="bg-gray-200 py-2.5 rounded-xl text-[11px] font-bold">Delete Report</button></div>
              </div>
            );
          })}
        </div>
        <div className="mt-10 border-t-4 border-black pt-6">
          <h2 className="font-black text-[20px] text-[#002f34]">Users Post Zawng Zawng ({filteredPosts.length})</h2>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search title..." className="w-full border-2 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-black mt-2" />
          <div className="flex flex-col gap-2 mt-4">
            {filteredPosts.map(p=>(
              <div key={p.id} className="border rounded-2xl p-3 flex gap-3 bg-gray-50">
                <img src={p.imageUrl || p.images?.[0] || "/no-image.png"} className="w-16 h-16 rounded-xl object-cover bg-white border" alt="" />
                <div className="flex-1 min-w-0"><p className="font-black text-[13px] truncate">{p.title || p.name || "No title"}</p><p className="text-[12px] font-bold text-green-600">₹{p.price || 0} - {p.col}</p><p className="text-[10px] text-gray-400 truncate">{p.userId?.slice(0,10)}... - {p.createdAt?.toDate?.()?.toLocaleDateString() || ""}</p><div className="flex gap-2 mt-2"><button onClick={()=>setEditPost(p)} className="bg-black text-white px-3 py-1.5 rounded-full text-[10px] font-black">EDIT</button><button onClick={()=>deleteSinglePost(p)} className="bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black">DELETE</button></div></div>
              </div>
            ))}
            {filteredPosts.length===0 && <p className="text-center text-gray-400 font-bold mt-10">Post a awm lo</p>}
          </div>
        </div>
        <div className="mt-10 border-t-4 border-black pt-6">
          <h2 className="font-black text-[20px] text-[#002f34]">Users Account Zawng Zawng ({filteredUsers.length} / {allUsers.length})</h2>
          <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search name / email..." className="w-full border-2 rounded-xl px-4 py-3 text-[14px] font-bold outline-none focus:border-black mt-2" />
          <div className="flex flex-col gap-2 mt-4 max-h-[600px] overflow-y-auto">
            {filteredUsers.map(u=>{
              const dName = (u as any).displayName || getNameFromData(u) || u.id.slice(0,8);
              const dEmail = (u as any).email || getEmailFromData(u) || "Email awm lo";
              return (
                <div key={u.id} className="border rounded-2xl p-3 flex gap-3 bg-white">
                  <img src={u.photoURL || "/no-image.png"} className="w-12 h-12 rounded-full object-cover bg-gray-100 border" alt="" />
                  <div className="flex-1 min-w-0"><p className="font-black text-[13px] truncate">{dName}</p><p className="text-[11px] text-gray-600 truncate">{dEmail}</p><p className="text-[10px] text-gray-400">ID: {u.id.slice(0,12)}...</p></div>
                  <button onClick={()=>setConfirmDeleteUser({id:u.id, name:dName})} className="bg-red-600 text-white px-4 h-fit py-2 rounded-full text-[10px] font-black active:scale-95">DELETE</button>
                </div>
              );
            })}
            {filteredUsers.length===0 && <p className="text-center text-gray-400 font-bold mt-10">User hmuh loh</p>}
          </div>
        </div>
      </div>
      {showDeleteId && (<div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm"><div className="bg-white rounded-[28px] p-6 w-full max-w-[320px] shadow-2xl text-center"><div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">Del</div><p className="font-black text-[18px] text-[#002f34]">Delete report?</p><div className="flex gap-2 mt-6"><button onClick={()=>setShowDeleteId(null)} className="flex-1 bg-[#f3f4f6] text-black font-bold py-3.5 rounded-2xl text-[14px]">Cancel</button><button onClick={confirmDelete} disabled={deleting} className="flex-1 bg-black text-white font-black py-3.5 rounded-2xl text-[14px]">{deleting?"...":"OK"}</button></div></div></div>)}
      {confirmModal && (<div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm"><div className="bg-white rounded-[28px] p-6 w-full max-w-[340px] shadow-2xl text-center"><div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl ${confirmModal.type==='ban'? 'bg-red-100' : 'bg-orange-100'}`}>{confirmModal.type==='ban'? 'Ban' : 'Del'}</div><p className="font-black text-[18px] text-[#002f34] leading-tight">{confirmModal.type==='ban'? `Ban ${confirmModal.userName}?` : `Delete ${confirmModal.userName} posts?`}</p><div className="flex gap-2 mt-6"><button onClick={()=>setConfirmModal(null)} className="flex-1 bg-[#f3f4f6] text-black font-bold py-3.5 rounded-2xl text-[14px]">Cancel</button><button onClick={confirmModal.type==='ban'? executeBan : executePostDelete} disabled={!!actionId} className={`flex-1 text-white font-black py-3.5 rounded-2xl text-[14px] ${confirmModal.type==='ban'? 'bg-red-600' : 'bg-orange-500'}`}>{actionId? "..." : confirmModal.type==='ban'? "BAN" : "DELETE"}</button></div></div></div>)}
      {confirmDeleteUser && (<div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm"><div className="bg-white rounded-[28px] p-6 w-full max-w-[340px] shadow-2xl text-center"><div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">Warn</div><p className

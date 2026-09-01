"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, query, deleteDoc, doc, setDoc, getDoc, where, updateDoc, orderBy, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Account() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [showPic, setShowPic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showPhoneEdit, setShowPhoneEdit] = useState(false);
  const [newPhone, setNewPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [showKhuaEdit, setShowKhuaEdit] = useState(false);
  const [newKhua, setNewKhua] = useState("");
  const [savingKhua, setSavingKhua] = useState(false);
  const [showDobEdit, setShowDobEdit] = useState(false);
  const [newDob, setNewDob] = useState("");
  const [savingDob, setSavingDob] = useState(false);
  const [myNotis, setMyNotis] = useState<any[]>([]);
  const [myNotiUnread, setMyNotiUnread] = useState(0);
  const adminEmails = ["mizochatapps@gmail.com"];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      const pDoc = await getDoc(doc(db, "users", u.uid));
      if (pDoc.exists()) setProfile(pDoc.data());
      const snap = await getDocs(query(collection(db, "users", u.uid, "wishlist")));
      const items: any[] = [];
      for (const d of snap.docs) {
        const wData = d.data();
        const pid = wData.productId || wData.jobId || d.id;
        let prod = await getDoc(doc(db, "products", pid));
        if (prod.exists()) { items.push({ id: prod.id,...prod.data() as any, wishId: d.id, type: "product" }); continue; }
        let job = await getDoc(doc(db, "jobs", pid));
        if (!job.exists()) job = await getDoc(doc(db, "jobPosts", pid));
        if (job.exists()) { items.push({ id: job.id,...job.data() as any, wishId: d.id, type: "job" }); continue; }
      }
      setWishlist(items);
      try{
        const nQ = query(collection(db,"users",u.uid,"notifications"), orderBy("createdAt","desc"), limit(20));
        const nSnap = await getDocs(nQ);
        const nList = nSnap.docs.map(d=>({id:d.id,...d.data() as any}));
        setMyNotis(nList);
        setMyNotiUnread(nList.filter((x:any)=>!x.read).length);
      }catch(e){ console.log(e); }
    });
    return () => unsub();
  }, [router]);

  const openPic = () => { window.history.pushState({ picModal: true }, ""); setShowPic(true); };
  const closePic = () => { if (window.history.state?.picModal) window.history.back(); else setShowPic(false); };

  useEffect(() => {
    const onPop = () => { setShowPic(false); setShowNameEdit(false); setShowPhoneEdit(false); setShowKhuaEdit(false); setShowDobEdit(false); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const changePic = async (e: any) => {
    const file = e.target.files[0]; if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("2MB aia tlem thlang rawh");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas"); canvas.width = 300; canvas.height = 300;
        const ctx = canvas.getContext("2d"); ctx?.drawImage(img, 0, 0, 300, 300);
        const compressed = canvas.toDataURL("image/jpeg", 0.6);
        await setDoc(doc(db, "users", user.uid), { photoURL: compressed, email: user.email }, { merge: true });
        await updateProfile(user, { photoURL: compressed });
        setProfile((p: any) => ({...p, photoURL: compressed })); setUser({...user, photoURL: compressed }); setUploading(false);
      }; img.src = base64;
    }; reader.readAsDataURL(file);
  };

  const openNameEdit = () => {
    if (profile?.nameChanged) { alert("I hming i thlak tawh - vawi 1 chiah thlak theih a ni!"); return; }
    setNewName(profile?.displayName || user?.displayName || user?.email.split("@")[0] || "");
    window.history.pushState({ nameModal: true }, ""); setShowNameEdit(true);
  };
  const handleNameChange = async () => {
    if (!newName.trim()) return alert("Hming dah rawh");
    if (profile?.nameChanged) return alert("Vawi 1 chiah thlak theih!");
    setSavingName(true);
    try {
      const finalName = newName.trim();
      await updateProfile(user, { displayName: finalName });
      await setDoc(doc(db, "users", user.uid), { displayName: finalName, name: finalName, nameChanged: true, email: user.email, photoURL: profile?.photoURL || user.photoURL || "" }, { merge: true });
      try { const pq = query(collection(db, "products"), where("userId", "==", user.uid)); const psnap = await getDocs(pq); for (const pd of psnap.docs) { await updateDoc(doc(db, "products", pd.id), { sellerName: finalName, userName: finalName, displayName: finalName, userDisplayName: finalName }); } } catch {}
      try { const jq = query(collection(db, "jobs"), where("userId", "==", user.uid)); const jsnap = await getDocs(jq); for (const jd of jsnap.docs) { await updateDoc(doc(db, "jobs", jd.id), { sellerName: finalName, userName: finalName, displayName: finalName, userDisplayName: finalName }); } } catch {}
      setProfile((p: any) => ({...p, displayName: finalName, name: finalName, nameChanged: true }));
      setUser({...user, displayName: finalName }); setShowNameEdit(false);
      if (window.history.state?.nameModal) window.history.back();
      alert("Hming thlak fel a ni e! ✅");
    } catch (e: any) { alert(e.message); } finally { setSavingName(false); }
  };

  const openPhoneEdit = () => { setNewPhone(profile?.phone || ""); window.history.pushState({ phoneModal: true }, ""); setShowPhoneEdit(true); };
  const handlePhoneSave = async () => {
    if (!newPhone.trim()) return alert("Phone dah rawh");
    setSavingPhone(true);
    try { await setDoc(doc(db, "users", user.uid), { phone: newPhone.trim() }, { merge: true }); setProfile((p: any) => ({...p, phone: newPhone.trim() })); setShowPhoneEdit(false); if (window.history.state?.phoneModal) window.history.back(); } finally { setSavingPhone(false); }
  };
  const openKhuaEdit = () => { setNewKhua(profile?.khua || ""); window.history.pushState({ khuaModal: true }, ""); setShowKhuaEdit(true); };
  const handleKhuaSave = async () => {
    if (!newKhua.trim()) return alert("Khua dah rawh");
    setSavingKhua(true);
    try { await setDoc(doc(db, "users", user.uid), { khua: newKhua.trim() }, { merge: true }); setProfile((p: any) => ({...p, khua: newKhua.trim() })); setShowKhuaEdit(false); if (window.history.state?.khuaModal) window.history.back(); } finally { setSavingKhua(false); }
  };
  const openDobEdit = () => { setNewDob(profile?.dob || ""); window.history.pushState({ dobModal: true }, ""); setShowDobEdit(true); };
  const handleDobSave = async () => {
    if (!newDob) return alert("DoB thlang rawh");
    setSavingDob(true);
    try { await setDoc(doc(db, "users", user.uid), { dob: newDob }, { merge: true }); setProfile((p: any) => ({...p, dob: newDob })); setShowDobEdit(false); if (window.history.state?.dobModal) window.history.back(); } finally { setSavingDob(false); }
  };
  const removeWish = async (wishId: string, prodId: string) => {
    await deleteDoc(doc(db, "users", user.uid, "wishlist", wishId));
    setWishlist(w => w.filter(x => x.id!== prodId));
  };
  if (!user) return <div className="p-10 text-center">Loading...</div>;
  const displayPic = profile?.photoURL || user.photoURL;
  const displayName = profile?.displayName || user.displayName || user.email.split("@")[0];
  const isAdmin = adminEmails.includes(user.email);
  return (
    <main className="min-h-screen bg-[#f5f5f5] pb-28">
      <div className="bg-[#0e0e0e] text-white mx-3 mt-3 rounded-[32px] p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div onClick={openPic} className="w-[88px] h-[88px] bg-white rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-2 border-white/20">
              {displayPic? <img src={displayPic} alt="pic" className="w-full h-full object-cover" /> : <span className="text-black text-3xl font-black">{user.email[0].toUpperCase()}</span>}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 bg-[#00C853] w-8 h-8 rounded-full flex items-center justify-center border-[3px] border-[#0e0e0e] text-white font-black">+</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={changePic} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-black truncate">{displayName}</p>
            <p className="text-[12px] text-white/60 truncate">{user.email}</p>
            <div className="mt-2 inline-flex bg-white/15 px-3 py-1 rounded-full text-[11px] font-bold">✅ Verified Member</div>
            {uploading && <p className="text-[11px] text-yellow-300">Uploading...</p>}
          </div>
        </div>
      </div>
      <div className="p-3 flex flex-col gap-3">
        <div className="bg-white rounded-[26px] p-2 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-black px-4 pt-2 pb-1 text-gray-400 tracking-widest">PERSONAL INFO</p>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">📧</div><div className="flex-1 min-w-0"><p className="text-[12px] text-gray-400">Email</p><p className="text-[14px] font-bold truncate">{user.email}</p></div></div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <button onClick={openPhoneEdit} className="w-full flex items-center gap-3 px-3 py-3.5 text-left active:bg-gray-50 rounded-xl"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">📱</div><div className="flex-1"><p className="text-[12px] text-gray-400">Phone</p><p className="text-[14px] font-bold">{profile?.phone || "7005697815"}</p></div><span className="text-gray-400">›</span></button>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <button onClick={openKhuaEdit} className="w-full flex items-center gap-3 px-3 py-3.5 text-left active:bg-gray-50 rounded-xl"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">📍</div><div className="flex-1"><p className="text-[12px] text-gray-400">Khua / Location</p><p className="text-[14px] font-bold">{profile?.khua || "Aizawl, Mizoram"}</p></div><span className="text-gray-400">›</span></button>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <button onClick={openDobEdit} className="w-full flex items-center gap-3 px-3 py-3.5 text-left active:bg-gray-50 rounded-xl"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">🎂</div><div className="flex-1"><p className="text-[12px] text-gray-400">Date of Birth</p><p className="text-[14px] font-bold">{profile?.dob? new Date(profile.dob).toLocaleDateString('en-GB') : "05/08/2002"}</p></div><span className="text-gray-400">›</span></button>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-11 h-11 bg-[#f6f6f6] rounded-full flex items-center justify-center text-[18px]">🗓️</div><div className="flex-1"><p className="text-[12px] text-gray-400">Member Since</p><p className="text-[14px] font-bold">29/08/2026</p></div></div>
        </div>
                <div className="bg-white rounded-[26px] p-4 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-[15px]">My Posts Notifications {myNotiUnread>0 && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full ml-2">{myNotiUnread} new</span>}</h3>
            <button onClick={()=>router.push("/my-notifications")} className="text-[12px] font-bold text-blue-600">View all ›</button>
          </div>
          {myNotis.length===0? (<p className="text-[13px] text-gray-400 text-center py-8">I post ah like/comment a la awm lo</p>) : (
            <div className="flex flex-col gap-2">
              {myNotis.slice(0,6).map((n:any)=>(
                <div key={n.id} onClick={async()=>{ try{ await updateDoc(doc(db,"users",user.uid,"notifications",n.id),{read:true}); }catch{} if(n.postType==="job") router.push(`/jobs/${n.postId}`); else router.push(`/marketplace/${n.postId}`); }} className={`flex gap-3 p-3 rounded-2xl cursor-pointer border active:scale-[0.98] ${!n.read?'bg-blue-50 border-blue-200':'bg-[#f8f8f8] border-gray-100'}`}>
                  <img src={n.fromPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.fromName||"User")}`} className="w-10 h-10 rounded-full object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] leading-tight truncate"><b>{n.fromName}</b> {n.type==="like"?"❤️ liked":"💬 commented on"} your post</p>
                    <p className="text-[12px] font-bold text-[#002f34] truncate">{n.title}</p>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{n.message}</p>
                  </div>
                  {!n.read && <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-[26px] p-2 border border-gray-100 shadow-sm">
          <p className="text-[11px] font-black px-4 pt-2 pb-1 text-gray-400 tracking-widest">ACCOUNT ACTIONS</p>
          {!profile?.nameChanged? (<button onClick={openNameEdit} className="w-full flex items-center gap-3 px-3 py-3.5 text-left active:bg-gray-50 rounded-xl"><div className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white text-[18px]">✏️</div><div className="flex-1"><p className="text-[14px] font-bold">Hming Thlak</p><p className="text-[12px] text-gray-400">Vawi 1 chiah thlak theih</p></div><span className="text-gray-400">›</span></button>) : (<div className="flex items-center gap-3 px-3 py-3.5 opacity-50"><div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center">✏️</div><div className="flex-1"><p className="text-[14px] font-bold">Hming Thlak</p><p className="text-[12px] text-gray-400">Vawi 1 i thlak tawh</p></div><span className="text-[10px] bg-gray-100 px-2 py-1 rounded-full font-bold">Done</span></div>)}
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          {isAdmin && (<><Link href="/admin/reports" className="w-full flex items-center gap-3 px-3 py-3.5 active:bg-gray-50 rounded-xl"><div className="w-11 h-11 bg-[#ffefef] rounded-full flex items-center justify-center text-[18px]">🚩</div><div className="flex-1"><p className="text-[14px] font-bold text-red-600">Admin Reports</p><p className="text-[12px] text-gray-400">Report te enna</p></div><span className="text-gray-400">›</span></Link><div className="h-[1px] bg-gray-100 mx-3"></div></>)}
          <button onClick={async()=>{ await signOut(auth); router.push("/"); }} className="w-full flex items-center gap-3 px-3 py-3.5 text-left active:bg-red-50 rounded-xl"><div className="w-11 h-11 bg-[#ffefef] rounded-full flex items-center justify-center text-[18px]">🚪</div><div className="flex-1"><p className="text-[14px] font-bold text-red-600">Log Out</p><p className="text-[12px] text-gray-400">Account chhuahsan</p></div><span className="text-gray-400">›</span></button>
        </div>
        <div className="bg-white rounded-[26px] p-4 border border-gray-100 shadow-sm">
          <h2 className="font-black text-[16px] mb-3">My Wishlist ({wishlist.length})</h2>
          {wishlist.length===0? <p className="text-center text-gray-400 py-6 text-[13px]">Wishlist a la awm lo</p> : (<div className="grid grid-cols-2 gap-3">{wishlist.map((item: any) => (<div key={item.id} className="border rounded-[18px] overflow-hidden relative bg-gray-50"><Link href={item.type === "job"? `/jobs/${item.id}` : `/marketplace/${item.id}`}><img src={item.image || item.images?.[0] || "/placeholder.png"} alt="" className="w-full h-[140px] object-cover" /></Link><button onClick={() => removeWish(item.wishId, item.id)} className="absolute top-2 right-2 bg-black/70 text-white w-8 h-8 rounded-full flex items-center justify-center">✕</button><div className="p-2.5 bg-white"><p className="text-[13px] font-bold truncate">{item.title}</p></div></div>))}</div>)}
        </div>
      </div>
      {showPic && displayPic && (<div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-6" onClick={closePic}><img src={displayPic} alt="" className="w-[300px] h-[300px] rounded-[24px] object-cover" /></div>)}
      {showNameEdit && (<div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6"><div className="bg-white rounded-[22px] p-6 w-full max-w-[340px]"><h3 className="font-black text-[18px]">Hming thlak rawh</h3><p className="text-[12px] text-red-500 font-bold mt-1">⚠️ Vawi 1 chiah!</p><input value={newName} onChange={e=>setNewName(e.target.value)} className="w-full mt-4 border-2 p-3 rounded-xl" /><div className="flex gap-2 mt-4"><button onClick={()=>setShowNameEdit(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button><button onClick={handleNameChange} disabled={savingName} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">{savingName?"...":"Save"}</button></div></div></div>)}
      {showPhoneEdit && (<div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6"><div className="bg-white rounded-[20px] p-6 w-full max-w-[320px]"><h3 className="font-black">📱 Phone</h3><input value={newPhone} onChange={e=>setNewPhone(e.target.value)} className="w-full border-2 p-3 rounded-xl mt-4" /><div className="flex gap-2 mt-4"><button onClick={()=>setShowPhoneEdit(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button><button onClick={handlePhoneSave} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">{savingPhone?"...":"Save"}</button></div></div></div>)}
      {showKhuaEdit && (<div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6"><div className="bg-white rounded-[20px] p-6 w-full max-w-[320px]"><h3 className="font-black">📍 Khua</h3><input value={newKhua} onChange={e=>setNewKhua(e.target.value)} className="w-full border-2 p-3 rounded-xl mt-4" /><div className="flex gap-2 mt-4"><button onClick={()=>setShowKhuaEdit(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button><button onClick={handleKhuaSave} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">{savingKhua?"...":"Save"}</button></div></div></div>)}
      {showDobEdit && (<div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6"><div className="bg-white rounded-[20px] p-6 w-full max-w-[320px]"><h3 className="font-black">🎂 DoB</h3><input value={newDob} onChange={e=>setNewDob(e.target.value)} type="date" className="w-full border-2 p-3 rounded-xl mt-4" /><div className="flex gap-2 mt-4"><button onClick={()=>setShowDobEdit(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button><button onClick={handleDobSave} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">{savingDob?"...":"Save"}</button></div></div></div>)}
    </main>
  );
}

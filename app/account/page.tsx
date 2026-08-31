"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, query, deleteDoc, doc, setDoc, getDoc, where, updateDoc } from "firebase/firestore";
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
        if (prod.exists()) { items.push({ id: prod.id,...prod.data(), wishId: d.id, type: "product" }); continue; }
        let job = await getDoc(doc(db, "jobs", pid));
        if (!job.exists()) job = await getDoc(doc(db, "jobPosts", pid));
        if (job.exists()) { items.push({ id: job.id,...job.data(), wishId: d.id, type: "job" }); continue; }
      }
      setWishlist(items);
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
    if (profile?.nameChanged) { alert("I hming i thlak tawh"); return; }
    setNewName(profile?.displayName || user?.displayName || "");
    window.history.pushState({ nameModal: true }, ""); setShowNameEdit(true);
  };
  const handleNameChange = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      const finalName = newName.trim();
      await updateProfile(user, { displayName: finalName });
      await setDoc(doc(db, "users", user.uid), { displayName: finalName, name: finalName, nameChanged: true }, { merge: true });
      setProfile((p: any) => ({...p, displayName: finalName, nameChanged: true }));
      setShowNameEdit(false); if (window.history.state?.nameModal) window.history.back();
    } catch (e: any) { alert(e.message); } finally { setSavingName(false); }
  };

  const openPhoneEdit = () => { setNewPhone(profile?.phone || ""); window.history.pushState({ phoneModal: true }, ""); setShowPhoneEdit(true); };
  const handlePhoneSave = async () => {
    if (!newPhone.trim()) return alert("Phone dah rawh");
    setSavingPhone(true);
    try {
      await setDoc(doc(db, "users", user.uid), { phone: newPhone.trim() }, { merge: true });
      setProfile((p: any) => ({...p, phone: newPhone.trim() }));
      setShowPhoneEdit(false); if (window.history.state?.phoneModal) window.history.back();
    } finally { setSavingPhone(false); }
  };

  const openKhuaEdit = () => { setNewKhua(profile?.khua || ""); window.history.pushState({ khuaModal: true }, ""); setShowKhuaEdit(true); };
  const handleKhuaSave = async () => {
    if (!newKhua.trim()) return alert("Khua dah rawh");
    setSavingKhua(true);
    try {
      await setDoc(doc(db, "users", user.uid), { khua: newKhua.trim() }, { merge: true });
      setProfile((p: any) => ({...p, khua: newKhua.trim() }));
      setShowKhuaEdit(false); if (window.history.state?.khuaModal) window.history.back();
    } finally { setSavingKhua(false); }
  };

  const openDobEdit = () => { setNewDob(profile?.dob || ""); window.history.pushState({ dobModal: true }, ""); setShowDobEdit(true); };
  const handleDobSave = async () => {
    if (!newDob) return alert("DoB thlang rawh");
    setSavingDob(true);
    try {
      await setDoc(doc(db, "users", user.uid), { dob: newDob }, { merge: true });
      setProfile((p: any) => ({...p, dob: newDob }));
      setShowDobEdit(false); if (window.history.state?.dobModal) window.history.back();
    } finally { setSavingDob(false); }
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
    <main className="min-h-screen bg-[#f7f7f8] pb-24">
      <div className="bg-[#0e0e0e] text-white mx-3 mt-3 rounded-[32px] p-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div onClick={openPic} className="w-[88px] h-[88px] bg-white rounded-full flex items-center justify-center overflow-hidden cursor-pointer">
              {displayPic? <img src={displayPic} alt="pic" className="w-full h-full object-cover" /> : <span className="text-black text-3xl font-black">{user.email[0].toUpperCase()}</span>}
            </div>
            <button onClick={() => fileRef.current?.click()} className="absolute -bottom-1 -right-1 bg-[#00C853] w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#0e0e0e] text-white">+</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={changePic} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[20px] font-black truncate">{displayName}</p>
            <p className="text-[11px] text-white/60 truncate">{user.email}</p>
            <div className="mt-2 inline-flex bg-white/15 px-3 py-1 rounded-full text-[11px] font-bold">Verified Member</div>
          </div>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-4">
        <div className="bg-white rounded-[24px] p-2 border">
          <p className="text-[12px] font-black px-3 py-2 text-gray-400">PERSONAL INFO</p>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">✉️</div><div className="flex-1"><p className="text-[11px] text-gray-400 font-bold">Email</p><p className="text-[13px] font-bold truncate">{user.email}</p></div></div>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <button onClick={openPhoneEdit} className="w-full flex items-center gap-3 px-3 py-3.5 text-left"><div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">📱</div><div className="flex-1"><p className="text-[11px] text-gray-400 font-bold">Phone</p><p className="text-[13px] font-bold">{profile?.phone || "Set ve loh"}</p></div><span>›</span></button>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <button onClick={openKhuaEdit} className="w-full flex items-center gap-3 px-3 py-3.5 text-left"><div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">📍</div><div className="flex-1"><p className="text-[11px] text-gray-400 font-bold">Khua / Location</p><p className="text-[13px] font-bold">{profile?.khua || "Aizawl, Mizoram"}</p></div><span>›</span></button>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <button onClick={openDobEdit} className="w-full flex items-center gap-3 px-3 py-3.5 text-left"><div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">🎂</div><div className="flex-1"><p className="text-[11px] text-gray-400 font-bold">Date of Birth</p><p className="text-[13px] font-bold">{profile?.dob? new Date(profile.dob).toLocaleDateString() : "Set ve loh"}</p></div><span>›</span></button>
          <div className="h-[1px] bg-gray-100 mx-3"></div>
          <div className="flex items-center gap-3 px-3 py-3.5"><div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">📅</div><div className="flex-1"><p className="text-[11px] text-gray-400 font-bold">Member Since</p><p className="text-[13px] font-bold">{user.metadata?.creationTime? new Date(user.metadata.creationTime).toLocaleDateString() : ""}</p></div></div>
        </div>

        <div className="bg-white rounded-[24px] p-4 border">
          <h2 className="font-black text-[15px] mb-3">My Wishlist ({wishlist.length})</h2>
          <div className="grid grid-cols-2 gap-2">
            {wishlist.map((item: any) => (
              <div key={item.id} className="border rounded-2xl overflow-hidden relative">
                <Link href={item.type === "job"? `/jobs/${item.id}` : `/marketplace/${item.id}`}><img src={item.image || item.images?.[0]} alt="" className="w-full h-28 object-cover" /></Link>
                <button onClick={() => removeWish(item.wishId, item.id)} className="absolute top-2 right-2 bg-black/70 text-white w-7 h-7 rounded-full">✕</button>
                <div className="p-2"><p className="text-[11px] font-bold truncate">{item.title}</p></div>
              </div>
            ))}
          </div>
        </div>

        {isAdmin && <Link href="/admin/reports" className="bg-red-600 text-white font-black py-4 rounded-[20px] text-center block">Admin Reports</Link>}
        <button onClick={async () => { await signOut(auth); router.push("/"); }} className="bg-white border text-red-600 font-black py-4 rounded-[20px]">Log Out</button>
      </div>

      {showPic && displayPic && (
        <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-6" onClick={closePic}>
          <img src={displayPic} alt="" className="w-[300px] h-[300px] rounded-[24px] object-cover" />
        </div>
      )}
      {showNameEdit && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-[320px]">
            <input value={newName} onChange={e => setNewName(e.target.value)} className="w-full border-2 p-3 rounded-xl" />
            <div className="flex gap-2 mt-4"><button onClick={() => setShowNameEdit(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button><button onClick={handleNameChange} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">{savingName? "..." : "Save"}</button></div>
          </div>
        </div>
      )}
      {showPhoneEdit && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-[320px]">
            <h3 className="font-black">Phone Number</h3>
            <input value={newPhone} onChange={e => setNewPhone(e.target.value)} type="tel" placeholder="9862xxxxxx" className="w-full border-2 p-3 rounded-xl mt-4" />
            <div className="flex gap-2 mt-4"><button onClick={() => setShowPhoneEdit(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button><button onClick={handlePhoneSave} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">{savingPhone? "..." : "Save"}</button></div>
          </div>
        </div>
      )}
      {showKhuaEdit && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-[320px]">
            <h3 className="font-black">Khua / Location</h3>
            <input value={newKhua} onChange={e => setNewKhua(e.target.value)} placeholder="Aizawl" className="w-full border-2 p-3 rounded-xl mt-4" />
            <div className="flex gap-2 mt-4"><button onClick={() => setShowKhuaEdit(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button><button onClick={handleKhuaSave} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">{savingKhua? "..." : "Save"}</button></div>
          </div>
        </div>
      )}
      {showDobEdit && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6">
          <div className="bg-white rounded-[20px] p-6 w-full max-w-[320px]">
            <h3 className="font-black">Date of Birth</h3>
            <input value={newDob} onChange={e => setNewDob(e.target.value)} type="date" className="w-full border-2 p-3 rounded-xl mt-4" />
            <div className="flex gap-2 mt-4"><button onClick={() => setShowDobEdit(false)} className="flex-1 bg-gray-100 py-3 rounded-xl font-bold">Cancel</button><button onClick={handleDobSave} className="flex-1 bg-black text-white py-3 rounded-xl font-bold">{savingDob? "..." : "Save"}</button></div>
          </div>
        </div>
      )}
    </main>
  );
          }

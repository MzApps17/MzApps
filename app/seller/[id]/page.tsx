"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, addDoc, serverTimestamp, updateProfile } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import Link from "next/link";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { updateProfile as updateAuthProfile } from "firebase/auth";

export default function SellerProfile(){
  const {id}=useParams();
  const router=useRouter();
  const [seller,setSeller]=useState<any>(null);
  const [posts,setPosts]=useState<any[]>([]);
  const [currentUser,setCurrentUser]=useState<any>(null);
  const [wished,setWished]=useState<Set<string>>(new Set());
  const [showMenu,setShowMenu]=useState(false);
  const [showReport,setShowReport]=useState(false);
  const [reportMsg,setReportMsg]=useState("");
  const [reporting,setReporting]=useState(false);
  const [showSuccess,setShowSuccess]=useState(false);
  const [errorMsg,setErrorMsg]=useState("");
  // ACCOUNT tan
  const [profile,setProfile]=useState<any>(null);
  const [wishlist,setWishlist]=useState<any[]>([]);
  const [showPic,setShowPic]=useState(false);
  const [showNameEdit,setShowNameEdit]=useState(false);
  const [newName,setNewName]=useState("");
  const [savingName,setSavingName]=useState(false);
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);

  const adminEmails=["mizochatapps@gmail.com"];

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      setCurrentUser(u);
      if(u){
        const pDoc = await getDoc(doc(db,"users",u.uid));
        if(pDoc.exists()) setProfile(pDoc.data());
      }
    });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const load=async()=>{
      const sSnap=await getDoc(doc(db,"users",id as string));
      let sellerData:any=null;
      if(sSnap.exists()){ sellerData=sSnap.data(); setSeller(sellerData); }

      let allMap = new Map();
      const tryQuery = async (field:string, value:any)=>{
        if(!value) return;
        try{
          const q=query(collection(db,"products"), where(field,"==",value));
          const snap=await getDocs(q);
          snap.docs.forEach(d=> allMap.set(d.id, {id:d.id,...d.data()}));
        }catch{}
      };
      await tryQuery("userId", id);
      await tryQuery("uid", id);
      await tryQuery("userUid", id);
      await tryQuery("sellerId", id);
      if(sellerData?.email) await tryQuery("userEmail", sellerData.email);
      if(sellerData?.email) await tryQuery("email", sellerData.email);

      setPosts(Array.from(allMap.values()));

      if(auth.currentUser){
        const ws=await getDocs(collection(db,"users",auth.currentUser.uid,"wishlist"));
        const set=new Set<string>();
        const items:any[]=[];
        for(const d of ws.docs){
          const wData=d.data();
          const pid=wData.productId || wData.jobId || d.id;
          if(pid) set.add(pid);
          let prod=await getDoc(doc(db,"products",pid));
          if(prod.exists()){ items.push({id:prod.id,...prod.data(), wishId:d.id, type:"product"}); continue; }
          let job=await getDoc(doc(db,"jobs",pid));
          if(!job.exists()) job=await getDoc(doc(db,"jobPosts",pid));
          if(job.exists()){ items.push({id:job.id,...job.data(), wishId:d.id, type:"job"}); continue; }
        }
        setWished(set);
        setWishlist(items);
      }
    };
    if(id) load();
  },[id]);

  const toggleWish=async(e:any, pid:string)=>{
    e.preventDefault(); e.stopPropagation();
    if(!currentUser) return router.push("/login");
    const wishRef=doc(db,"users",currentUser.uid,"wishlist",pid);
    if(wished.has(pid)){
      await deleteDoc(wishRef);
      setWished(prev=>{ const n=new Set(prev); n.delete(pid); return n; });
      setWishlist(w=>w.filter(x=>x.id!==pid));
    }else{
      await setDoc(wishRef,{productId:pid, createdAt:serverTimestamp()});
      setWished(prev=>{ const n=new Set(prev); n.add(pid); return n; });
    }
  };

  const handleReport=async()=>{
    if(!reportMsg.trim()){ setErrorMsg("Chhan ziak rawh"); return; }
    setReporting(true);
    try{
      await addDoc(collection(db,"reports"),{
        reportedUserId:id,
        reporterId: currentUser?.uid || "anonymous",
        message: reportMsg.trim(),
        sellerName: seller?.displayName || "",
        createdAt: serverTimestamp()
      });
      setShowReport(false); setReportMsg(""); setShowMenu(false);
      setShowSuccess(true);
    }catch(e:any){ setErrorMsg(e.message); }
    finally{ setReporting(false); }
  };

  // ACCOUNT functions
  const openPic = ()=>{ window.history.pushState({picModal:true},""); setShowPic(true); };
  const closePic = ()=>{ if(window.history.state?.picModal) window.history.back(); else setShowPic(false); };
  const openNameEdit = ()=>{
    if(profile?.nameChanged){ alert("I hming i thlak tawh - vawi 1 chiah thlak theih a ni!"); return; }
    setNewName(profile?.displayName || currentUser?.displayName || currentUser?.email.split("@")[0] || "");
    window.history.pushState({nameModal:true},""); setShowNameEdit(true);
  };
  const handleNameChange = async()=>{
    if(!newName.trim()) return alert("Hming dah rawh");
    if(profile?.nameChanged) return alert("Vawi 1 chiah thlak theih!");
    setSavingName(true);
    try{
      await updateAuthProfile(currentUser,{displayName:newName.trim()});
      await setDoc(doc(db,"users",currentUser.uid),{ displayName:newName.trim(), nameChanged:true, email:currentUser.email, photoURL: profile?.photoURL || currentUser.photoURL || "" },{merge:true});
      setProfile((p:any)=>({...p, displayName:newName.trim(), nameChanged:true}));
      setShowNameEdit(false);
      if(window.history.state?.nameModal) window.history.back();
    }catch(e:any){ alert(e.message); } finally{ setSavingName(false); }
  };
  const changePic = async(e:any)=>{
    const file=e.target.files[0]; if(!file) return;
    if(file.size > 2*1024*1024) return alert("2MB aia tlem thlang rawh");
    setUploading(true);
    const reader=new FileReader();
    reader.onload=async()=>{
      const base64=reader.result as string;
      const img=new Image();
      img.onload=async()=>{
        const canvas=document.createElement("canvas"); canvas.width=300; canvas.height=300;
        const ctx=canvas.getContext("2d"); ctx?.drawImage(img,0,0,300,300);
        const compressed=canvas.toDataURL("image/jpeg",0.6);
        await setDoc(doc(db,"users",currentUser.uid),{photoURL:compressed, email:currentUser.email},{merge:true});
        await updateAuthProfile(currentUser,{photoURL:compressed});
        setProfile((p:any)=>({...p, photoURL:compressed})); setUploading(false);
      }; img.src=base64;
    }; reader.readAsDataURL(file);
  };
  const removeWish=async(wishId:string, prodId:string)=>{
    await deleteDoc(doc(db,"users",currentUser.uid,"wishlist",wishId));
    setWishlist(w=>w.filter(x=>x.id!==prodId));
    setWished(prev=>{ const n=new Set(prev); n.delete(prodId); return n; });
  };

  useEffect(()=>{
    const onPop=()=>{ setShowPic(false); setShowNameEdit(false); setShowReport(false); setShowMenu(false); };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[]);

  if(!seller) return <div className="p-10 text-center font-black">Loading...</div>;

  const isOwnProfile = currentUser?.uid === id;
  const displayPic = profile?.photoURL || currentUser?.photoURL || seller.photoURL;
  const displayName = profile?.displayName || currentUser?.displayName || seller.displayName;
  const isAdmin = currentUser && adminEmails.includes(currentUser.email);

  // MAHNI PROFILE ANIH CHUAN ACCOUNT ANG KHAN LANG TIR
  if(isOwnProfile){
    return (
      <main className="min-h-screen bg-white pb-10">
        <div className="bg-black text-white m-3 rounded-[30px] p-7">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div onClick={openPic} className="w-28 h-28 bg-white rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white/20">
                {displayPic? <img src={displayPic} className="w-full h-full object-cover"/> : <span className="text-black text-4xl font-black">{currentUser?.email[0].toUpperCase()}</span>}
              </div>
              <button onClick={()=>fileRef.current?.click()} className="absolute -bottom-1 -right-1 bg-[#00C853] w-9 h-9 rounded-full flex items-center justify-center border-[3px] border-black text-white font-black">+</button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={changePic}/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[22px] font-black capitalize break-all leading-6">{displayName}</p>
              <p className="text-[12px] text-gray-300 truncate mt-1">{currentUser?.email}</p>
              <p className="mt-3 bg-white/20 inline-block px-3 py-1 rounded-full text-[11px]">✅ Verified Member</p>
              {uploading && <p className="text-[11px] mt-2 text-yellow-300">Uploading...</p>}
            </div>
          </div>
        </div>

        <div className="p-3">
          <h2 className="font-black text-[16px] mb-2">{displayName} Ads ({posts.length})</h2>
          {posts.length>0 && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {posts.map((p:any)=>(
                <Link key={p.id} href={`/marketplace/${p.id}`} className="bg-white border rounded-xl overflow-hidden">
                  <img src={p.image || p.images?.[0]} className="w-full h-32 object-cover"/>
                  <div className="p-2"><p className="text-[12px] font-bold truncate">{p.title}</p><p className="font-black">₹{Number(p.price||0).toLocaleString("en-IN")}</p></div>
                </Link>
              ))}
            </div>
          )}

          <h2 className="font-black text-[16px] mb-3">❤️ My Wishlist ({wishlist.length})</h2>
          {wishlist.length===0? <p className="bg-gray-50 p-5 rounded-2xl text-center text-gray-400 text-[13px]">Wishlist a la awm lo</p> :
          <div className="grid grid-cols-2 gap-2">
            {wishlist.map((item:any)=>(
              <div key={item.id} className="bg-white border rounded-xl overflow-hidden relative">
                <Link href={`/marketplace/${item.id}`}><img src={item.image || item.images?.[0]} className="w-full h-32 object-cover"/></Link>
                <button onClick={()=>removeWish(item.wishId,item.id)} className="absolute top-2 right-2 bg-black/70 text-white w-7 h-7 rounded-full text-xs">✕</button>
                <div className="p-2"><p className="text-[12px] font-bold truncate">{item.title}</p><p className="font-black">₹{Number(item.price||0).toLocaleString("en-IN")}</p></div>
              </div>
            ))}
          </div>}

          {!profile?.nameChanged? (
            <button onClick={openNameEdit} className="w-full bg-black text-white font-black py-4 rounded-2xl mt-6 flex items-center justify-center gap-2">✏️ Hming Thlak</button>
          ) : (
            <p className="text-center text-[11px] text-gray-400 mt-6">Hming vawi 1 i thlak tawh</p>
          )}

          {isAdmin && (
            <Link href="/admin/reports" className="w-full bg-red-600 text-white font-black py-4 rounded-2xl mt-3 flex items-center justify-center gap-2 block text-center">
              🚩 Admin - Reports En
            </Link>
          )}

          <button onClick={async()=>{ await signOut(auth); router.push("/"); }} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl mt-3">Log Out</button>
        </div>

        {showPic && displayPic && (
          <div className="fixed inset-0 bg-black/80 z-[999] flex items-center justify-center p-6 backdrop-blur-sm" onClick={closePic}>
            <div className="relative" onClick={e=>e.stopPropagation()}>
              <img src={displayPic} className="w-[85vw] max-w-[320px] h-[85vw] max-h-[320px] object-cover rounded-[24px] border-4 border-white shadow-2xl"/>
              <button onClick={closePic} className="absolute -top-3 -right-3 bg-white text-black w-9 h-9 rounded-full font-black shadow-lg flex items-center justify-center">✕</button>
            </div>
          </div>
        )}
        {showNameEdit && (
          <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-white rounded-[22px] p-6 w-full max-w-[340px] shadow-2xl">
              <h3 className="font-black text-[18px]">Hming thlak rawh</h3>
              <p className="text-[12px] text-red-500 mt-1 font-bold">⚠️ Hming vawi khat chiah i thlak thei!</p>
              <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Hming thar" className="w-full mt-4 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-black"/>
              <div className="flex gap-2 mt-5">
                <button onClick={()=>{ setShowNameEdit(false); if(window.history.state?.nameModal) window.history.back(); }} className="flex-1 bg-gray-200 text-black font-bold py-3 rounded-xl">Cancel</button>
                <button onClick={handleNameChange} disabled={savingName} className="flex-1 bg-black text-white font-bold py-3 rounded-xl">{savingName?"...":"Change Name"}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // MIDANG PROFILE ANIH CHUAN A NGAITE ANG
  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="flex items-center justify-between p-3 pt-4 bg-white sticky top-0 z-50">
        <button onClick={()=>{ if(window.history.length>1) router.back(); else router.push("/"); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow border">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <div className="relative">
          <button onClick={()=>setShowMenu(!showMenu)} className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow border">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="black"><circle cx="12" cy="5" r="2.8"/><circle cx="12" cy="12" r="2.8"/><circle cx="12" cy="19" r="2.8"/></svg>
          </button>
          {showMenu && (
            <div className="absolute right-0 top-12 bg-white border rounded-xl shadow-xl w-44 z-50 overflow-hidden">
              <button onClick={()=>{ setShowReport(true); setShowMenu(false); }} className="w-full text-left px-4 py-3 text-[14px] font-bold hover:bg-gray-50">🚩 Report User</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5 p-5">
        <div className="w-24 h-24 rounded-full bg-black text-white flex items-center justify-center font-black text-3xl overflow-hidden flex-shrink-0">
          {seller.photoURL? <img src={seller.photoURL} className="w-full h-full object-cover"/> : seller.displayName?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-black text-[24px] capitalize">{seller.displayName}</p>
          <p className="text-[14px] text-gray-500 mt-1">{posts.length} Ads</p>
        </div>
      </div>

      <h2 className="font-black text-[18px] px-5 mt-6">{seller.displayName} Ads</h2>

      <div className="p-3 grid grid-cols-1 gap-3">
        {posts.map((p:any)=>(
          <div key={p.id} className="bg-white border rounded-2xl overflow-hidden flex gap-3 p-2 relative">
            <Link href={`/marketplace/${p.id}`} className="w-28 h-28 flex-shrink-0">
              <img src={p.image || p.images?.[0]} className="w-full h-full object-cover rounded-xl"/>
            </Link>
            <div className="flex-1 py-1 pr-10">
              <Link href={`/marketplace/${p.id}`}>
                <p className="font-bold text-[14px] truncate">{p.title}</p>
                <p className="font-black text-[16px] mt-1">₹{Number(p.price).toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-gray-500 mt-1">{p.village || ""} • {p.category || ""}</p>
              </Link>
            </div>
            <button onClick={(e)=>toggleWish(e,p.id)} className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow border text-[18px]">
              {wished.has(p.id)? "❤️":"🤍"}
            </button>
          </div>
        ))}
      </div>

      {showReport && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[22px] p-6 w-full max-w-[340px] shadow-2xl">
            <h3 className="font-black text-[18px]">Report {seller.displayName}</h3>
            <p className="text-[12px] text-gray-400 mt-1">Eng vangin?</p>
            <textarea value={reportMsg} onChange={e=>setReportMsg(e.target.value)} placeholder="Report chhan ziak rawh..." className="w-full mt-4 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-black h-28 text-[14px] resize-none"/>
            {errorMsg && <p className="text-red-500 text-[12px] mt-2 font-bold">{errorMsg}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={()=>{setShowReport(false); setErrorMsg("");}} className="flex-1 bg-[#e5e7eb] text-black font-bold py-3 rounded-xl">Cancel</button>
              <button onClick={handleReport} disabled={reporting} className="flex-1 bg-black text-white font-bold py-3 rounded-xl">{reporting?"...":"Report"}</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-black/70 z-[1100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[26px] p-7 w-full max-w-[340px] shadow-2xl text-center">
            <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-2xl">✓</span>
            </div>
            <h3 className="font-black text-[18px] mt-4">Report i thawn ta e</h3>
            <p className="text-[13px] text-gray-500 mt-2 leading-5">Kan lo en ho ang a, a dik loh chuan action kan la ang.</p>
            <button onClick={()=>setShowSuccess(false)} className="w-full bg-black text-white font-black py-3.5 rounded-xl mt-6 text-[15px]">OK</button>
          </div>
        </div>
      )}

      {showMenu && <div className="fixed inset-0 z-40" onClick={()=>setShowMenu(false)}></div>}
    </main>
  )
                                                                                                         }

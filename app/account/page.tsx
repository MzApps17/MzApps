"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, query, deleteDoc, doc, setDoc, getDoc, where, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Account(){
  const [user,setUser]=useState<any>(null);
  const [profile,setProfile]=useState<any>(null);
  const [wishlist,setWishlist]=useState<any[]>([]);
  const [showPic,setShowPic]=useState(false);
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const router=useRouter();
  const [showNameEdit,setShowNameEdit]=useState(false);
  const [newName,setNewName]=useState("");
  const [savingName,setSavingName]=useState(false);

  const adminEmails=["mizochatapps@gmail.com"];

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      if(!u){ router.push("/login"); return; }
      setUser(u);
      const pDoc = await getDoc(doc(db,"users",u.uid));
      if(pDoc.exists()) setProfile(pDoc.data());
      const snap=await getDocs(query(collection(db,"users",u.uid,"wishlist")));
      const items:any[]=[];
      for(const d of snap.docs){
        const wData=d.data();
        const pid=wData.productId || wData.jobId || d.id;
        let prod=await getDoc(doc(db,"products",pid));
        if(prod.exists()){ items.push({id:prod.id,...prod.data(), wishId:d.id, type:"product"}); continue; }
        let job=await getDoc(doc(db,"jobs",pid));
        if(!job.exists()) job=await getDoc(doc(db,"jobPosts",pid));
        if(job.exists()){ items.push({id:job.id,...job.data(), wishId:d.id, type:"job"}); continue; }
      }
      setWishlist(items);
    });
    return ()=>unsub();
  },[]);

  const openPic = ()=>{ window.history.pushState({picModal:true},""); setShowPic(true); };
  const closePic = ()=>{ if(window.history.state?.picModal) window.history.back(); else setShowPic(false); };

  useEffect(()=>{
    const onPop=()=>{ setShowPic(false); setShowNameEdit(false); };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[]);

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
        await setDoc(doc(db,"users",user.uid),{photoURL:compressed, email:user.email},{merge:true});
        await updateProfile(user,{photoURL:compressed});
        setProfile((p:any)=>({...p, photoURL:compressed})); setUser({...user, photoURL:compressed}); setUploading(false);
      }; img.src=base64;
    }; reader.readAsDataURL(file);
  };

  const openNameEdit = ()=>{
    if(profile?.nameChanged){ alert("I hming i thlak tawh - vawi 1 chiah thlak theih a ni!"); return; }
    setNewName(profile?.displayName || user?.displayName || user?.email.split("@")[0] || "");
    window.history.pushState({nameModal:true},""); setShowNameEdit(true);
  };

  const handleNameChange = async()=>{
    if(!newName.trim()) return alert("Hming dah rawh");
    if(profile?.nameChanged) return alert("Vawi 1 chiah thlak theih!");
    setSavingName(true);
    try{
      const finalName = newName.trim();
      await updateProfile(user,{displayName:finalName});
      await setDoc(doc(db,"users",user.uid),{ displayName:finalName, name:finalName, nameChanged:true, email:user.email, photoURL: profile?.photoURL || user.photoURL || "" },{merge:true});

      // ✅ FIX - A Post hlui zawng zawng ah pawh Hming thar update nghal
      try{
        const pq = query(collection(db,"products"), where("userId","==", user.uid));
        const psnap = await getDocs(pq);
        for(const pd of psnap.docs){
          await updateDoc(doc(db,"products",pd.id), {
            sellerName: finalName,
            userName: finalName,
            displayName: finalName,
            userDisplayName: finalName
          });
        }
      }catch{}
      try{
        const jq = query(collection(db,"jobs"), where("userId","==", user.uid));
        const jsnap = await getDocs(jq);
        for(const jd of jsnap.docs){
          await updateDoc(doc(db,"jobs",jd.id), {
            sellerName: finalName,
            userName: finalName,
            displayName: finalName,
            userDisplayName: finalName
          });
        }
      }catch{}

      setProfile((p:any)=>({...p, displayName:finalName, name:finalName, nameChanged:true}));
      setUser({...user, displayName:finalName}); setShowNameEdit(false);
      if(window.history.state?.nameModal) window.history.back();
      alert("Hming thlak fel a ni e! ✅");
    }catch(e:any){ alert(e.message); } finally{ setSavingName(false); }
  };

  const removeWish=async(wishId:string, prodId:string)=>{
    await deleteDoc(doc(db,"users",user.uid,"wishlist",wishId));
    setWishlist(w=>w.filter(x=>x.id!==prodId));
  };

  if(!user) return <div className="p-10 text-center">Loading...</div>;
  const displayPic = profile?.photoURL || user.photoURL;
  const displayName = profile?.displayName || user.displayName || user.email.split("@")[0];
  const isAdmin = adminEmails.includes(user.email);

  return (
    <main className="min-h-screen bg-white pb-10">
      <div className="bg-black text-white m-3 rounded-[30px] p-7">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div onClick={openPic} className="w-28 h-28 bg-white rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white/20">
              {displayPic? <img src={displayPic} className="w-full h-full object-cover"/> : <span className="text-black text-4xl font-black">{user.email[0].toUpperCase()}</span>}
            </div>
            <button onClick={()=>fileRef.current?.click()} className="absolute -bottom-1 -right-1 bg-[#00C853] w-9 h-9 rounded-full flex items-center justify-center border-[3px] border-black text-white font-black">+</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={changePic}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[22px] font-black capitalize break-all leading-6">{displayName}</p>
            <p className="text-[12px] text-gray-300 truncate mt-1">{user.email}</p>
            <p className="mt-3 bg-white/20 inline-block px-3 py-1 rounded-full text-[11px]">✅ Verified Member</p>
            {uploading && <p className="text-[11px] mt-2 text-yellow-300">Uploading...</p>}
          </div>
        </div>
      </div>

      <div className="p-3">
        <h2 className="font-black text-[16px] mb-3">❤️ My Wishlist ({wishlist.length})</h2>
        {wishlist.length===0? <p className="bg-gray-50 p-5 rounded-2xl text-center text-gray-400 text-[13px]">Wishlist a la awm lo</p> :
        <div className="grid grid-cols-2 gap-2">
          {wishlist.map((item:any)=>(
            <div key={item.id} className="bg-white border rounded-xl overflow-hidden relative">
              {item.type==="job"? (
                <Link href={`/jobs/${item.id}`}><div className="w-full h-32 bg-gray-100 flex items-center justify-center p-3"><p className="font-black text-[14px] text-center line-clamp-2">{item.title}</p></div></Link>
              ) : (
                <Link href={`/marketplace/${item.id}`}><img src={item.image || item.images?.[0]} className="w-full h-32 object-cover"/></Link>
              )}
              <button onClick={()=>removeWish(item.wishId,item.id)} className="absolute top-2 right-2 bg-black/70 text-white w-7 h-7 rounded-full text-xs">✕</button>
              <div className="p-2"><p className="text-[12px] font-bold truncate">{item.title}</p><p className="font-black">{item.type==="job"? `₹${item.salary||""}` : `₹${Number(item.price||0).toLocaleString("en-IN")}`}</p></div>
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

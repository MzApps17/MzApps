"use client";
import { useEffect, useState, useRef } from "react";
import { onAuthStateChanged, signOut, updateProfile } from "firebase/auth";
import { collection, getDocs, query, deleteDoc, doc, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Account(){
  const [user,setUser]=useState<any>(null);
  const [wishlist,setWishlist]=useState<any[]>([]);
  const [showPic,setShowPic]=useState(false);
  const [uploading,setUploading]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const router=useRouter();

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{
      if(!u){ router.push("/login"); return; }
      setUser(u);
      // Wishlist load
      const q=query(collection(db,"users",u.uid,"wishlist"));
      const snap=await getDocs(q);
      const items = await Promise.all(snap.docs.map(async d=>{
        try{
          const prodId = d.data().productId;
          const prodSnap = await getDocs(query(collection(db,"products"), where("__name__","==",prodId)));
          // awlsam zawk
          const { getDoc } = await import("firebase/firestore");
          const p = await getDoc(doc(db,"products",prodId));
          if(p.exists()) return {id:p.id,...p.data(), wishId:d.id};
        }catch{}
        return null;
      }));
      setWishlist(items.filter(Boolean));
    });
    return ()=>unsub();
  },[]);

  const changePic = async(e:any)=>{
    const file=e.target.files[0];
    if(!file ||!user) return;
    setUploading(true);
    const storageRef=ref(storage,`profile/${user.uid}.jpg`);
    await uploadBytes(storageRef,file);
    const url=await getDownloadURL(storageRef);
    await updateProfile(user,{photoURL:url});
    setUser({...user, photoURL:url});
    setUploading(false);
  };

  const removeWish=async(wishId:string, prodId:string)=>{
    await deleteDoc(doc(db,"users",user.uid,"wishlist",wishId));
    setWishlist(w=>w.filter(x=>x.id!==prodId));
  };

  if(!user) return <div className="p-10">Loading...</div>;

  return (
    <main className="min-h-screen bg-white pb-10">
      {/* BLACK CARD */}
      <div className="bg-black text-white m-3 rounded-[30px] p-7 relative">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div onClick={()=>setShowPic(true)} className="w-24 h-24 bg-white rounded-full flex items-center justify-center overflow-hidden cursor-pointer border-4 border-white/20">
              {user.photoURL? <img src={user.photoURL} className="w-full h-full object-cover"/> : <span className="text-black text-3xl font-black">{user.email[0].toUpperCase()}</span>}
            </div>
            <button onClick={()=>fileRef.current?.click()} className="absolute -bottom-1 -right-1 bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center border-2 border-black text-white font-bold">+</button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={changePic}/>
          </div>
          <div>
            <p className="text-[22px] font-black">{user.displayName || user.email.split("@")[0]}</p>
            <p className="text-[13px] text-gray-300">{user.email}</p>
            <p className="mt-2 bg-white/20 inline-block px-3 py-1 rounded-full text-[11px]">✅ Verified Member</p>
            {uploading && <p className="text-[11px] mt-1 text-yellow-300">Uploading...</p>}
          </div>
        </div>
      </div>

      {/* WISHLIST */}
      <div className="p-3 mt-2">
        <h2 className="font-black text-[16px] mb-2 flex items-center gap-2">❤️ My Wishlist ({wishlist.length})</h2>
        {wishlist.length===0? <p className="text-gray-400 text-[13px] bg-gray-50 p-4 rounded-xl text-center">Wishlist ah engmah a la awm lo</p> :
        <div className="grid grid-cols-2 gap-2">
          {wishlist.map((item:any)=>(
            <div key={item.id} className="bg-white border rounded-xl overflow-hidden relative">
              <Link href={`/marketplace/${item.id}`}><img src={item.image || item.images?.[0]} className="w-full h-28 object-cover"/></Link>
              <button onClick={()=>removeWish(item.wishId, item.id)} className="absolute top-1 right-1 bg-black/70 text-white w-6 h-6 rounded-full text-[12px]">✕</button>
              <div className="p-2">
                <p className="text-[12px] font-bold truncate">{item.title}</p>
                <p className="text-[13px] font-black">₹{item.price}</p>
              </div>
            </div>
          ))}
        </div>}
        <button onClick={async()=>{ await signOut(auth); router.push("/"); }} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl mt-8">Log Out</button>
      </div>

      {/* PIC VIEW MODAL */}
      {showPic && (
        <div onClick={()=>setShowPic(false)} className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
          <img src={user.photoURL || ""} className="max-w-full max-h-[80vh] rounded-2xl"/>
          <button className="absolute top-5 right-5 text-white text-2xl">✕</button>
        </div>
      )}
    </main>
  );
}

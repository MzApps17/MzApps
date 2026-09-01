"use client";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

export default function WishlistPage(){
  const router = useRouter();
  const [items,setItems]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [user,setUser]=useState<any>(null);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async(u)=>{
      setUser(u);
      if(!u){ router.push("/login"); return; }
      await loadWishlist(u.uid);
    });
    return ()=>unsub();
  },[]);

  const loadWishlist = async(uid:string)=>{
    setLoading(true);
    try{
      const snap = await getDocs(collection(db,"users",uid,"wishlist"));
      const ids = snap.docs.map(d=>d.data().productId);
      const products:any[] = [];
      for(const id of ids){
        const p = await getDoc(doc(db,"products",id));
        if(p.exists()){
          products.push({id:p.id,...p.data()});
        }else{
          // job pawh check
          const j = await getDoc(doc(db,"jobs",id));
          if(j.exists()) products.push({id:j.id,...j.data(), _type:"job"});
        }
      }
      setItems(products);
    }catch(e){ console.log(e); }
    setLoading(false);
  };

  const removeWish = async(e:any, id:string)=>{
    e.stopPropagation();
    if(!user) return;
    await deleteDoc(doc(db,"users",user.uid,"wishlist",id));
    setItems(prev=>prev.filter(p=>p.id!==id));
  };

  return(
    <main className="min-h-screen bg-white">
      {/* HEADER - Arrow lian + Wishlist (count) */}
      <div className="sticky top-0 z-20 bg-white border-b px-3 py-3 flex items-center gap-3">
        <button onClick={()=>router.back()} className="w-10 h-10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-black text-[20px] flex items-center gap-2">
          Wishlist ({items.length})
          <span className="text-[18px]">{items.length>0?"❤️":"🤍"}</span>
        </h1>
      </div>

      {loading && <p className="text-center py-20 text-gray-400 font-bold">Loading...</p>}

      {!loading && items.length===0 && (
        <div className="text-center py-24 px-6">
          <p className="text-[60px]">🤍</p>
          <p className="font-black text-[18px] mt-3">Wishlist a la awm lo</p>
          <p className="text-[13px] text-gray-500 mt-1">Post chunga love ❤️ kha hmeh la, hetah a lang ang</p>
          <button onClick={()=>router.push("/marketplace")} className="mt-6 bg-black text-white px-8 py-3 rounded-full font-black text-[13px]">MARKETPLACE EN RAWH</button>
        </div>
      )}

      {/* LIST - Facebook grid ang tho, X awm */}
      <div className="grid grid-cols-2 gap-[1px] bg-[#e5e5e5]">
        {items.map(ad=>(
          <div key={ad.id} onClick={()=>router.push(ad._type==="job"?`/jobs/${ad.id}`:`/marketplace/${ad.id}`)} className="bg-white cursor-pointer">
            <div className="relative aspect-square bg-gray-50">
              <img src={ad.image || ad.images?.[0] || "https://via.placeholder.com/400"} className="w-full h-full object-cover" />
              {/* X - Wishlist atanga paihna */}
              <button onClick={(e)=>removeWish(e, ad.id)} className="absolute top-2 right-2 w-8 h-8 bg-black/80 text-white rounded-full flex items-center justify-center text-[14px] font-black active:scale-90">X</button>
            </div>
            <div className="p-2">
              <p className="text-[13px] truncate"><b>₹{Number(ad.price||ad.salary||0).toLocaleString('en-IN')}</b> · {ad.title}</p>
              <p className="text-[10px] text-gray-500 uppercase truncate">{ad.location || ad.khua || "Aizawl"}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
                                                              }

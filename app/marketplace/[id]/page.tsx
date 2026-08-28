"use client";
import { useEffect, useState } from "react";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function ProductDetail(){
  const { id } = useParams() as {id:string};
  const [product,setProduct]=useState<any>(null);
  const [loading,setLoading]=useState(true);
  const [wish,setWish]=useState(false);
  const [user,setUser]=useState<any>(null);
  const [imgIndex,setImgIndex]=useState(0);

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth, async(u)=>{ setUser(u); });
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const fetchProd=async()=>{
      const snap=await getDoc(doc(db,"products",id));
      if(snap.exists()) setProduct({id:snap.id,...snap.data()});
      setLoading(false);
    };
    fetchProd();
  },[id]);

  useEffect(()=>{
    const checkWish=async()=>{
      if(user && id){
        const w=await getDoc(doc(db,"users",user.uid,"wishlist",id));
        setWish(w.exists());
      }
    };
    checkWish();
  },[user,id]);

  const toggleWish=async()=>{
    if(!user){ alert("Login phawt rawh!"); return; }
    const ref=doc(db,"users",user.uid,"wishlist",id);
    if(wish){ await deleteDoc(ref); setWish(false); }
    else{ await setDoc(ref,{productId:id, createdAt:new Date()}); setWish(true); }
  };

  if(loading) return <div className="p-10 text-center font-bold">Loading...</div>;
  if(!product) return <div className="p-10 text-center">Product hmuh loh</div>;

  const images = product.images || [product.image];

  return (
    <main className="min-h-screen bg-white pb-20">
      {/* IMAGE */}
      <div className="relative bg-black">
        <div className="w-full h-[340px] flex items-center justify-center overflow-hidden">
          <img src={images[imgIndex]} className="w-full h-full object-contain"/>
        </div>
        <button onClick={toggleWish} className="absolute top-4 right-4 bg-white w-10 h-10 rounded-full shadow flex items-center justify-center text-xl">
          {wish? "❤️" : "🤍"}
        </button>
        <Link href="/" className="absolute top-4 left-4 bg-white w-10 h-10 rounded-full shadow flex items-center justify-center font-bold">←</Link>
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
          {images.map((_:any,i:number)=><div key={i} className={`w-1.5 h-1.5 rounded-full ${i===imgIndex?"bg-white":"bg-white/50"}`}/>)}
        </div>
        <div className="absolute bottom-0 left-0 right-0 flex">
          {images.map((img:string,i:number)=>(
            <button key={i} onClick={()=>setImgIndex(i)} className={`flex-1 h-12 border-2 ${i===imgIndex?"border-white":"border-transparent"} overflow-hidden`}><img src={img} className="w-full h-full object-cover"/></button>
          ))}
        </div>
      </div>

      <div className="p-4">
        <p className="text-[24px] font-black text-[#002f34]">₹ {Number(product.price).toLocaleString("en-IN")}</p>
        <p className="text-[16px] font-bold mt-1">{product.title}</p>
        <p className="text-[13px] text-gray-500 mt-2">{product.location || "Mizoram"} • {product.category}</p>

        <div className="mt-5 bg-gray-50 rounded-xl p-4">
          <p className="font-black text-[14px] mb-2">Description</p>
          <p className="text-[13px] text-gray-700 whitespace-pre-wrap">{product.description || "Description awm lo"}</p>
        </div>

        <div className="mt-4 flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center font-black">{product.userEmail?.[0]?.toUpperCase() || "U"}</div>
          <div>
            <p className="font-bold text-[14px]">{product.userName || product.userEmail?.split("@")[0] || "Seller"}</p>
            <p className="text-[11px] text-gray-500">Verified Seller</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t p-3 flex gap-3">
        <button onClick={toggleWish} className={`flex-1 py-3 rounded-xl font-black border ${wish?"bg-red-50 border-red-200 text-red-600":"bg-white border-gray-300"}`}>
          {wish? "❤️ Wishlisted" : "🤍 Wishlist"}
        </button>
        <a href={`tel:${product.phone || ""}`} className="flex-1 bg-[#002f34] text-white py-3 rounded-xl font-black text-center">
          Call Seller
        </a>
      </div>
    </main>
  );
}

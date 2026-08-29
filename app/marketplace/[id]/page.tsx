"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function ProductDetail(){
  const {id}=useParams();
  const router=useRouter();
  const [product,setProduct]=useState<any>(null);
  const [currentImg,setCurrentImg]=useState(0);
  const [seller,setSeller]=useState<any>(null);

  useEffect(()=>{
    const onPop=()=>{
      router.push("/");
    };
    window.addEventListener("popstate",onPop);
    return ()=>window.removeEventListener("popstate",onPop);
  },[router]);

  useEffect(()=>{
    const getProd=async()=>{
      const snap=await getDoc(doc(db,"products",id as string));
      if(snap.exists()){
        const data=snap.data();
        setProduct(data);
        const uid = (data as any).userId || (data as any).uid || (data as any).userUid || (data as any).sellerId;
        if(uid){
          const userSnap = await getDoc(doc(db,"users",uid));
          if(userSnap.exists()) setSeller(userSnap.data());
        }
      }
    };
    if(id) getProd();
  },[id]);

  if(!product) return <div className="p-10 text-center font-black">Loading...</div>;

  const allImages = product.images && product.images.length > 0? product.images : [product.image];
  const phone = product.phone?.toString().replace(/\D/g,"").slice(-10);
  const waLink = `https://wa.me/91${phone}?text=Ka%20duh%20e%20-%20${product.title}`;
  const callLink = `tel:+91${phone}`;

  const getPostTime = () => {
    const t = product.createdAt || product.created_at || product.timestamp || product.date || product.postTime || product.createdOn;
    if (!t) return new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
    let d: Date | null = null;
    try {
      if (t.toDate) d = t.toDate();
      else if (t.seconds) d = new Date(t.seconds * 1000);
      else d = new Date(t);
    } catch { return ""; }
    if (!d || isNaN(d.getTime())) return "";
    return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const displayName = seller?.displayName || product.userName || product.userEmail?.split("@")[0] || "User";
  const displayPic = seller?.photoURL || null;
  const sellerUid = product.userId || product.uid || product.userUid || product.sellerId;

  const handleBack = ()=>{
    if(window.history.length > 1){
      router.back();
    }else{
      router.push("/");
    }
  };

  return (
    <main className="bg-white min-h-screen pb-[140px]">
      <div className="relative bg-black w-full aspect-[4/3] overflow-hidden">
        <img src={allImages[currentImg]} className="w-full h-full object-contain bg-black"/>
        <button onClick={handleBack} className="absolute top-4 left-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <button className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-[22px]">🤍</button>
      </div>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3 bg-white">
          {allImages.map((img:string,i:number)=>(
            <img
              key={i}
              onClick={()=>setCurrentImg(i)}
              src={img}
              className={`w-20 h-20 rounded-xl object-cover border-2 flex-shrink-0 cursor-pointer ${i===currentImg?"border-black":"border-gray-200"}`}
            />
          ))}
        </div>
      )}

      <div className="p-4">
        <h1 className="font-black text-[26px] text-[#002f34]">₹ {Number(product.price).toLocaleString("en-IN")}</h1>
        <h2 className="font-bold text-[18px] mt-1">{product.title}</h2>
        <p className="text-[13px] text-gray-500 mt-1">{product.village}, {product.district} • {product.category} • {getPostTime()}</p>

        <div className="bg-[#f8f9fa] rounded-2xl p-4 mt-5">
          <h3 className="font-black text-[15px] mb-2">Description</h3>
          <p className="text-[14px] whitespace-pre-wrap leading-6">{product.description}</p>
        </div>

        {/* Seller - EDITED: pic leh hming tilian, underline paih */}
        <div onClick={()=>{ if(sellerUid) router.push(`/seller/${sellerUid}`); }} className="bg-[#f8f9fa] rounded-2xl p-4 mt-4 flex items-center gap-3 cursor-pointer active:bg-gray-200">
          <div className="w-[56px] h-[56px] bg-black text-white rounded-full flex items-center justify-center font-black overflow-hidden flex-shrink-0">
            {displayPic? <img src={displayPic} className="w-full h-full object-cover"/> : <span className="text-[20px]">{displayName[0]?.toUpperCase()}</span>}
          </div>
          <div className="flex-1">
            <p className="font-bold text-[17px] capitalize">{displayName}</p>
            <p className="text-[13px] text-gray-500">Verified Seller • View Profile</p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      <div className="fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 p-3 flex gap-3 z-[100]">
        <a href={waLink} target="_blank" className="flex-1 border-2 border-black rounded-xl py-3.5 font-black text-[16px] flex items-center justify-center gap-2 bg-white text-black">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#25D366"><path d="M19.05 4.94A9.82 9.82 0 0 0 12.04 2C6.49 2 2 6.5 2 12.05c0 1.77.46 3.5 1.34 5.02L2 22l5.06-1.33a9.86 9.86 0 0 0 4.74 1.21h.02c5.54 0 10.05-4.51 10.05-10.06 0-2.69-1.05-5.22-2.95-7.12zM12.06 19.9h-.02a8.17 8.17 0 0 1-4.16-1.14l-.3-.18-3.79.8-2.93-.2-.3a8.2 8.2 0 0 1-1.26-4.38C3.92 7.47 7.64 3.74 12.06 3.74c2.19 0 4.25.85 5.79 2.4a8.14 8.14 0 0 1 2.4 5.8c0 4.42-3.73 8.14-8.19 8.14v-.18zm4.5-6.15c-.25-.12-1.47-.73-1.7-.81-.23-.09-.4-.12-.57.12-.17.25-.66.81-.81.98-.15.17-.3.19-.55.07-.25-.12-1.05-.39-2-1.24-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.3.37-.45.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.57-1.37-.78-1.88-.2-.49-.41-.42-.57-.43h-.49c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.08s.89 2.41 1.01 2.58c.12.17 1.75 2.68 4.25 3.76.59.26 1.05.41 1.41.53.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.11-.23-.17-.48-.29z"/></svg>
          WhatsApp
        </a>
        <a href={callLink} className="flex-1 bg-[#002f34] text-white rounded-xl py-3.5 font-black text-[16px] flex items-center justify-center">
          Call Seller
        </a>
      </div>
    </main>
  );
}

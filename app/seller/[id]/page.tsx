"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";

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

  useEffect(()=>{
    const unsub=onAuthStateChanged(auth,(u)=>setCurrentUser(u));
    return ()=>unsub();
  },[]);

  useEffect(()=>{
    const load=async()=>{
      const sSnap=await getDoc(doc(db,"users",id as string));
      let sellerData:any=null;
      if(sSnap.exists()){ sellerData=sSnap.data(); setSeller(sellerData); }

      // Ads zawng kim - field hming hrang hrang a awm thei
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
        ws.forEach(d=>{ const pid=d.data().productId || d.data().jobId || d.id; if(pid) set.add(pid); });
        setWished(set);
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
    }else{
      await setDoc(wishRef,{productId:pid, createdAt:serverTimestamp()});
      setWished(prev=>{ const n=new Set(prev); n.add(pid); return n; });
    }
  };

  const handleReport=async()=>{
    if(!reportMsg.trim()) return alert("Chhan ziak rawh");
    setReporting(true);
    try{
      await addDoc(collection(db,"reports"),{
        reportedUserId:id,
        reporterId: currentUser?.uid || "anonymous",
        message: reportMsg.trim(),
        sellerName: seller?.displayName || "",
        createdAt: serverTimestamp()
      });
      alert("Report pek a ni tawh");
      setShowReport(false); setReportMsg(""); setShowMenu(false);
    }catch(e:any){ alert(e.message); }
    finally{ setReporting(false); }
  };

  if(!seller) return <div className="p-10 text-center font-black">Loading...</div>;

  return (
    <main className="min-h-screen bg-white pb-10">
      {/* 1. CHUNGBER - Arrow lian leh dot 3 bold */}
      <div className="flex items-center justify-between p-3 pt-4 bg-white sticky top-0 z-50">
        <button onClick={()=>{ if(window.history.length>1) router.back(); else router.push("/"); }} className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow border">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5">
            <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
          </svg>
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

      {/* 2. Vanlalnghaka Ads - Ads by nilo in */}
      <h2 className="font-black text-[18px] px-5 mt-6">{seller.displayName} Ads</h2>

      {posts.length===0? (
        <p className="text-center text-gray-400 text-[13px] mt-10 bg-gray-50 mx-5 p-6 rounded-2xl">Ads a la awm lo - field name i product ah `userId` a nilo maithei, tun ah ka fix tawh</p>
      ):(
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
      )}

      {/* Report Popup - message type + cancel var uk + report dum */}
      {showReport && (
        <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white rounded-[22px] p-6 w-full max-w-[340px] shadow-2xl">
            <h3 className="font-black text-[18px]">Report {seller.displayName}</h3>
            <p className="text-[12px] text-gray-400 mt-1">Eng vangin?</p>
            <textarea value={reportMsg} onChange={e=>setReportMsg(e.target.value)} placeholder="Report chhan ziak rawh..." className="w-full mt-4 border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-black h-28 text-[14px] resize-none"/>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setShowReport(false)} className="flex-1 bg-[#e5e7eb] text-black font-bold py-3 rounded-xl">Cancel</button>
              <button onClick={handleReport} disabled={reporting} className="flex-1 bg-black text-white font-bold py-3 rounded-xl">{reporting?"...":"Report"}</button>
            </div>
          </div>
        </div>
      )}
      {showMenu && <div className="fixed inset-0 z-40" onClick={()=>setShowMenu(false)}></div>}
    </main>
  )
}

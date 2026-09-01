"use client";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, serverTimestamp, updateDoc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function CommentPopup({ postId, onClose, onCommentAdded }: { postId: string; onClose: () => void; onCommentAdded?: (id:string)=>void }){
  const [comments,setComments]=useState<any[]>([]);
  const [text,setText]=useState("");
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [userMap,setUserMap]=useState<Record<string,any>>({});
  const [loading,setLoading]=useState(false);
  const router = useRouter();

  const timeAgo = (ts:any) => {
    if(!ts) return "";
    try{
      const d:any = ts?.toDate? ts.toDate() : new Date(ts);
      const sec = Math.floor((Date.now() - d.getTime())/1000);
      if(sec < 60) return "just now";
      if(sec < 3600) return `${Math.floor(sec/60)}m ago`;
      if(sec < 86400) return `${Math.floor(sec/3600)}h ago`;
      if(sec < 604800) return `${Math.floor(sec/86400)}d ago`;
      return `${Math.floor(sec/604800)}w ago`;
    }catch{ return ""; }
  };

  const goSeller = (uid:string) => {
    if(!uid) return;
    onClose();
    setTimeout(()=> router.push(`/seller/${uid}`), 150);
  };

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async(u)=>{
      setUser(u);
      if(u){
        const snap = await getDoc(doc(db,"users",u.uid));
        if(snap.exists()) setUserData(snap.data());
      }
    });
    return ()=>unsub();
  },[]);

  const loadComments = async()=>{
    try{
      const q1 = query(collection(db,"products",postId,"comments"), orderBy("createdAt","asc"));
      let snap = await getDocs(q1).catch(async()=>{
        const q2 = query(collection(db,"jobs",postId,"comments"), orderBy("createdAt","asc"));
        return await getDocs(q2);
      });
      const list = snap.docs.map((d:any)=>({id:d.id,...d.data()}));
      setComments(list);
      const ids = Array.from(new Set(list.map((c:any)=>c.userId).filter(Boolean))) as string[];
      const missing = ids.filter((id:string)=>!userMap[id]);
      if(missing.length>0){
        const newMap:any = {...userMap};
        await Promise.all(missing.map(async(uid)=>{
          const s = await getDoc(doc(db,"users",uid));
          if(s.exists()) newMap[uid]=s.data();
        }));
        setUserMap(newMap);
      }
    }catch(e){ console.log(e); }
  };

  useEffect(()=>{ loadComments(); },[postId]);

  const postComment = async()=>{
    if(!text.trim() ||!user || loading) return;
    setLoading(true);
    const name = userData?.displayName || userData?.name || userData?.fullName || user.displayName || user.email?.split("@")[0] || "Mizo User";
    const pic = userData?.photoURL || userData?.profilePic || userData?.avatar || user.photoURL || "";
    try{
      try{
        await addDoc(collection(db,"products",postId,"comments"),{
          text: text.trim(), userId: user.uid, userName: name, userPic: pic, createdAt: serverTimestamp()
        });
        await updateDoc(doc(db,"products",postId), { commentsCount: increment(1) });
      }catch{
        await addDoc(collection(db,"jobs",postId,"comments"),{
          text: text.trim(), userId: user.uid, userName: name, userPic: pic, createdAt: serverTimestamp()
        });
        await updateDoc(doc(db,"jobs",postId), { commentsCount: increment(1) });
      }
      setText("");
      await loadComments();
      if(onCommentAdded) onCommentAdded(postId);
    }catch(e){ console.log(e); alert("Comment theih loh, Rules Publish hmasa rawh"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white w-full sm:max-w-[500px] h-[75vh] sm:h-[600px] rounded-t-[24px] sm:rounded-[20px] flex flex-col shadow-2xl" style={{backgroundColor:"#ffffff", colorScheme:"light"}}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <p className="font-black text-[16px] text-black">{comments.length} Comments</p>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 rounded-full text-black flex items-center justify-center font-bold">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-white">
          {comments.length===0 && <p className="text-center text-gray-400 text-[13px] mt-10">Comment la awm lo</p>}
          {comments.map(c=>{
            const u = userMap[c.userId];
            const rName = u?.displayName || u?.name || u?.fullName || c.userName || "User";
            const rPic = u?.photoURL || u?.profilePic || u?.avatar || c.userPic || `https://ui-avatars.com/api/?name=${rName}&background=002f34&color=fff&bold=true`;
            return (
              <div key={c.id} className="flex gap-2.5">
                <img onClick={()=>goSeller(c.userId)} src={rPic} className="w-8 h-8 rounded-full object-cover bg-gray-200 cursor-pointer active:scale-95"/>
                <div className="bg-[#f2f3f5] rounded-2xl px-3.5 py-2.5 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p onClick={()=>goSeller(c.userId)} className="font-bold text-[13px] text-black cursor-pointer hover:underline underline decoration-gray-300">{rName}</p>
                    <p className="text-[10px] text-gray-400 font-bold flex-shrink-0">{timeAgo(c.createdAt)}</p>
                  </div>
                  <p className="text-[13px] text-black mt-1">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-gray-100 flex gap-2 items-center bg-white">
          <img src={userData?.photoURL || userData?.profilePic || userData?.avatar || `https://ui-avatars.com/api/?name=Me&background=002f34&color=fff`} className="w-8 h-8 rounded-full bg-gray-200"/>
          <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") postComment(); }} placeholder="Comment ziak rawh..." className="flex-1 bg-[#f2f3f5] rounded-full px-4 py-2.5 text-[14px] outline-none text-black" style={{backgroundColor:"#f2f3f5", color:"#000000"}}/>
          <button onClick={postComment} disabled={!text.trim() || loading} className="bg-[#25D366] hover:bg-[#20bd5a] active:scale-90 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40 shadow-[0_2px_8px_rgba(37,211,102,0.4)] transition-all shrink-0">
            {loading? <span className="text-white text-[11px] font-bold">...</span> : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white" className="ml-[1px]"><path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.798-.011 7.931z"/></svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

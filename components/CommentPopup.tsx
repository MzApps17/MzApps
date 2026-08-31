"use client";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, orderBy, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export default function CommentPopup({ postId, onClose }: { postId: string; onClose: () => void }){
  const [comments,setComments]=useState<any[]>([]);
  const [text,setText]=useState("");
  const [user,setUser]=useState<any>(null);
  const [userData,setUserData]=useState<any>(null);
  const [userMap,setUserMap]=useState<Record<string,any>>({});
  const [loading,setLoading]=useState(false);

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
      // products ah try hmasa
      try{
        await addDoc(collection(db,"products",postId,"comments"),{
          text: text.trim(), userId: user.uid, userName: name, userPic: pic, createdAt: serverTimestamp()
        });
      }catch{
        await addDoc(collection(db,"jobs",postId,"comments"),{
          text: text.trim(), userId: user.uid, userName: name, userPic: pic, createdAt: serverTimestamp()
        });
      }
      setText("");
      await loadComments();
    }catch(e){ console.log(e); alert("Comment theih loh, Firestore Rules en rawh"); }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-end sm:items-center justify-center bg-black/50">
      {/* LIGHT MODE FORCED - dark mode pawhin a var reng */}
      <div className="bg-white w-full sm:max-w-[500px] h-[75vh] sm:h-[600px] rounded-t-[24px] sm:rounded-[20px] flex flex-col shadow-2xl" style={{backgroundColor:"#ffffff", colorScheme:"light"}}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <p className="font-black text-[16px] text-black">Comments</p>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full text-black flex items-center justify-center">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-white">
          {comments.length===0 && <p className="text-center text-gray-400 text-[13px] mt-10">Comment la awm lo, a hmasa ber ni rawh!</p>}
          {comments.map(c=>{
            const u = userMap[c.userId];
            const rName = u?.displayName || u?.name || u?.fullName || c.userName || "User";
            const rPic = u?.photoURL || u?.profilePic || u?.avatar || c.userPic || `https://ui-avatars.com/api/?name=${encodeURIComponent(rName)}&background=002f34&color=fff`;
            return (
              <div key={c.id} className="flex gap-2.5">
                <img src={rPic} className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-gray-200"/>
                <div className="bg-[#f2f3f5] rounded-2xl px-3.5 py-2.5 flex-1">
                  <p className="font-bold text-[13px] text-black leading-none">{rName}</p>
                  <p className="text-[13px] text-black mt-1 leading-snug">{c.text}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-gray-100 flex gap-2 items-center bg-white">
          <img src={userData?.photoURL || userData?.profilePic || userData?.avatar || `https://ui-avatars.com/api/?name=Me&background=002f34&color=fff`} className="w-8 h-8 rounded-full object-cover bg-gray-200 flex-shrink-0"/>
          <input
            value={text}
            onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter") postComment(); }}
            placeholder="Comment ziak rawh..."
            className="flex-1 bg-[#f2f3f5] rounded-full px-4 py-2.5 text-[14px] outline-none text-black placeholder:text-gray-400 border border-transparent focus:border-gray-200"
            style={{backgroundColor:"#f2f3f5", color:"#000000"}}
          />
          <button onClick={postComment} disabled={!text.trim() || loading} className="bg-black text-white px-5 py-2.5 rounded-full font-bold text-[13px] disabled:opacity-40 active:scale-95">
            {loading?"...":"Post"}
          </button>
        </div>
      </div>
    </div>
  );
                                      }

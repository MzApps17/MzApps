"use client";
import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase/config";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function CommentPopup({ postId, onClose }: { postId: string, onClose: () => void }) {
  const router = useRouter();
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id,...d.data() })));
    });
    return () => unsub();
  }, [postId]);

  const sendComment = async () => {
    if (!text.trim() ||!auth.currentUser) return;
    setSending(true);
    try {
      await addDoc(collection(db, "posts", postId, "comments"), {
        text: text.trim(),
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Mizo User",
        userPic: auth.currentUser.photoURL || "",
        createdAt: serverTimestamp(),
        likes: 0
      });
      await updateDoc(doc(db, "posts", postId), { comments: increment(1) });
      setText("");
    } catch (e) {
      console.log(e);
    }
    setSending(false);
  };

  const goToProfile = (userId: string) => {
    if (!userId) return;
    onClose(); // Popup khar hmasa
    router.push(`/user/${userId}`);
  };

  const timeAgo = (ts: any) => {
    if (!ts) return "just now";
    const d = ts.toDate? ts.toDate() : new Date();
    const m = Math.floor((Date.now() - d.getTime()) / 60000);
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m / 60)}h`;
    return `${Math.floor(m / 1440)}d`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Background dim */}
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Bottom Sheet */}
      <div className="relative bg-[#1a1a1a] w-full rounded-t-[28px] max-h-[85vh] flex flex-col animate-[slideUp_0.3s_ease]">
        {/* Handle */}
        <div className="w-full flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>
        <h2 className="text-white text-center font-bold text-[16px] pb-3 border-b border-white/10">Comments</h2>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
          {comments.length === 0 && (
            <p className="text-white/50 text-center mt-10">Comment hmasa ber ni rawh!</p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              {/* Pic Click = Profile Visit */}
              <img
                onClick={() => goToProfile(c.userId)}
                src={c.userPic || "https://i.pravatar.cc/100"}
                className="w-8 h-8 rounded-full mt-1 cursor-pointer active:opacity-60 hover:opacity-80"
              />
              <div className="flex-1">
                <p className="text-white text-[14px]">
                  {/* Hming Click = Profile Visit */}
                  <span
                    onClick={() => goToProfile(c.userId)}
                    className="font-bold mr-2 cursor-pointer hover:underline active:opacity-60"
                  >
                    {c.userName}
                  </span>
                  <span className="text-white/50 text-[12px]">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="text-white text-[14px] mt-0.5">{c.text}</p>
                <button className="text-white/50 text-[12px] mt-1 font-bold">Reply</button>
              </div>
              <div className="flex flex-col items-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="text-white/60 text-[11px] mt-1">{c.likes || 0}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-white/10 bg-[#1a1a1a] flex items-center gap-3">
          <img
            onClick={() => auth.currentUser && goToProfile(auth.currentUser.uid)}
            src={auth.currentUser?.photoURL || "https://i.pravatar.cc/100"}
            className="w-8 h-8 rounded-full cursor-pointer"
          />
          <div className="flex-1 bg-[#2a2a2a] rounded-full flex items-center px-4">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-white text-[14px] py-2.5 outline-none placeholder:text-white/40"
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
            />
            <button
              onClick={sendComment}
              disabled={sending ||!text.trim()}
              className="text-[#0095f6] font-bold text-[14px] disabled:opacity-30"
            >
              {sending? "..." : "Post"}
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
    </div>
  );
        }

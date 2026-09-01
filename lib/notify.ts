import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

type NotiType = "like" | "comment";

export async function sendPostNoti(
  ownerId: string,
  fromUser: any,
  post: any,
  type: NotiType,
  text?: string
){
  try{
    if(!ownerId ||!fromUser || ownerId === fromUser.uid) return;
    const notiRef = doc(collection(db, "users", ownerId, "notifications"));
    await setDoc(notiRef, {
      type,
      postId: post.id,
      postType: post._type || "product",
      postTitle: post.title || "your post",
      fromUid: fromUser.uid,
      fromName: fromUser.displayName || fromUser.email?.split("@")[0] || "Someone",
      fromPhoto: fromUser.photoURL || "",
      message: type === "like"
       ? `${fromUser.displayName || "Someone"} liked your post`
        : `${fromUser.displayName || "Someone"}: ${text?.slice(0,60) || "commented"}`,
      read: false,
      createdAt: serverTimestamp()
    });
    console.log("Noti sent to", ownerId);
  }catch(e){
    console.log("Noti failed", e);
  }
}

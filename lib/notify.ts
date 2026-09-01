import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export async function createLikeCommentNoti(
  ownerId: string,
  fromUser: any,
  post: any,
  type: "like" | "comment",
  messageText?: string
){
  if(!ownerId ||!fromUser || ownerId===fromUser.uid) return;
  try{
    const notiRef = doc(collection(db,"users",ownerId,"notifications"));
    await setDoc(notiRef,{
      type,
      postId: post.id,
      postType: post._type || "product",
      fromUid: fromUser.uid,
      fromName: fromUser.displayName || fromUser.email?.split("@")[0] || "Someone",
      fromPhoto: fromUser.photoURL || "",
      title: post.title || "your post",
      message: type==="like"
       ? `${fromUser.displayName || "Someone"} liked your post`
        : `${fromUser.displayName || "Someone"}: ${messageText?.slice(0,50)}`,
      read: false,
      createdAt: new Date()
    });
  }catch(e){ console.log("noti error",e); }
}

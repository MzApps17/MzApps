import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db, app } from "@/lib/firebase/config";

export async function setupFCM(userId: string){
  try{
    if(typeof window === "undefined") return;
    const permission = await Notification.requestPermission();
    if(permission!== "granted") return;

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: "I VAPID KEY KHAN DAH RAWH" // Firebase console > Project Settings > Cloud Messaging ah i hmu ang
    });

    if(token){
      // user doc ah save
      await setDoc(doc(db,"users",userId), {
        fcmTokens: arrayUnion(token)
      }, {merge:true});

      // global tokens collection ah pawh save (a awlsam zawk)
      await setDoc(doc(db,"fcmTokens",token), {
        token,
        userId,
        createdAt: new Date()
      });
    }

    // App hawn lai a notification lo luh chuan
    onMessage(messaging, (payload)=>{
      console.log("Message received", payload);
      if(payload.notification){
        new Notification(payload.notification.title!, {
          body: payload.notification.body,
          icon: "/icon-192.png"
        });
      }
    });

  }catch(e){ console.log("FCM error",e) }
}

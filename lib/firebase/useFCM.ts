import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { getApps, getApp } from "firebase/app";

export async function setupFCM(userId: string){
  try{
    if (typeof window === "undefined") return;
    const app = getApps().length? getApp() : getApps()[0] || getApp();

    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    if(permission!== "granted") return;

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
    });

    if(token){
      await setDoc(doc(db, "fcmTokens", userId), {
        token: token,
        userId: userId,
        createdAt: new Date()
      }, { merge: true });
      console.log("FCM Token saved:", token);
    }

    onMessage(messaging, (payload) => {
      console.log("Foreground message:", payload);
      if(Notification.permission === "granted"){
        new Notification(payload.notification?.title || "Thar a awm!", {
          body: payload.notification?.body,
          icon: "/icon-192x192.png"
        });
      }
    });

  } catch(e){
    console.log("FCM error", e);
  }
}

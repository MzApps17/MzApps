"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function Footer(){
  const pathname = usePathname();
  const isHome = pathname === "/";
  const isSell = pathname.startsWith("/sell");
  const isMyAds = pathname.startsWith("/my-ads");
  const isAccount = pathname.startsWith("/account");

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-[60px] z-50">
      <Link href="/" className={`flex flex-col items-center w-20 ${isHome?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isHome?"2.6":"1.6"}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span className={`text-[12px] ${isHome?"font-black":"font-bold"}`}>HOME</span>
      </Link>

      <Link href="/sell" className={`flex flex-col items-center w-20 ${isSell?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isSell?"2.6":"1.6"}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        <span className={`text-[12px] ${isSell?"font-black":"font-bold"}`}>SELL</span>
      </Link>

      <Link href="/my-ads" className={`flex flex-col items-center justify-center w-20 ${isMyAds?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isMyAds?"2.6":"1.6"} strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        <span className={`text-[12px] ${isMyAds?"font-black":"font-bold"}`}>MY ADS</span>
      </Link>

      <Link href="/account" className={`flex flex-col items-center w-20 ${isAccount?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isAccount?"2.6":"1.6"}><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        <span className={`text-[12px] ${isAccount?"font-black":"font-bold"}`}>ACCOUNT</span>
      </Link>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [notif, setNotif] = useState<{title: string, body: string} | null>(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const setupNotifications = async () => {
      try {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        if (permission!== 'granted') return;

        const messaging = getMessaging(app);
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration
        });

        if (token) {
          const user = auth.currentUser;
          if (user) {
            await setDoc(doc(db, "fcmTokens", user.uid), {
              token: token,
              uid: user.uid,
              createdAt: new Date()
            });
          } else {
            await setDoc(doc(db, "fcmTokens", token.slice(0, 20)), {
              token: token,
              createdAt: new Date()
            });
          }
          console.log("FCM Token saved:", token);
        }

        onMessage(messaging, (payload) => {
          setNotif({
            title: payload.notification?.title || "Post thar a awm e!",
            body: payload.notification?.body || ""
          });
          setTimeout(()=> setNotif(null), 10000);
        });

      } catch (e) {
        console.log("FCM Error:", e);
      }
    };

    setupNotifications();
  }, []);

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#002f34" />
        <link rel="apple-touch-icon" href="/IMG-20260830-WA0778.jpg" />
      </head>
      <body className="bg-white text-black">
        {notif && (
          <div className="fixed top-3 left-3 right-3 bg-[#002f34] text-white p-4 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.3)] z-[9999] flex items-center gap-3">
            <div className="bg-white/20 w-10 h-10 rounded-full flex items-center justify-center text-lg">🔔</div>
            <div className="flex-1">
              <div className="font-bold text-[13px] leading-tight">{notif.title}</div>
              <div className="text-[12px] opacity-80 leading-tight mt-0.5">{notif.body}</div>
            </div>
            <button onClick={()=> setNotif(null)} className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-xs">✕</button>
          </div>
        )}
        <div className="pb-[60px]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

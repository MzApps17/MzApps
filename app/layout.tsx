"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import IosInstallPopup from "@/components/layout/IosInstallPopup";

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
  const [userPic, setUserPic] = useState<string|null>(null);

  useEffect(()=>{
    const auth = getAuth();
    const db = getFirestore();
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(u){
        setUserPic(u.photoURL);
        try{
          const p = await getDoc(doc(db,"users",u.uid));
          if(p.exists() && p.data().photoURL) setUserPic(p.data().photoURL);
        }catch{}
      }else setUserPic(null);
    });
    return ()=>unsub();
  },[]);

  const isHome = pathname === "/";
  const isSell = pathname.startsWith("/sell");
  const isCategory = pathname.startsWith("/categories") || pathname.startsWith("/category");
  const isWishlist = pathname.startsWith("/wishlist");
  const isAccount = pathname.startsWith("/account");

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around items-center h-[58px] z-50 px-2">
      {/* 1. HOME */}
      <Link href="/" className="flex items-center justify-center w-[48px] h-[48px]">
        {isHome? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="black"><path d="M12 2.5L3 10v11a1 1 0 001 1h5a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h5a1 1 0 001-1V10l-9-7.5z"/></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        )}
      </Link>

      {/* 2. SELL - Post */}
      <Link href="/sell" className="flex items-center justify-center w-[48px] h-[48px]">
        {isSell? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="black"><rect x="2" y="2" width="20" height="20" rx="6" /><path d="M12 8v8M8 12h8" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.9" strokeLinecap="round"><rect x="2" y="2" width="20" height="20" rx="6"/><path d="M12 8v8M8 12h8"/></svg>
        )}
      </Link>

      {/* 3. CATEGORY - Page thar */}
      <Link href="/categories" className="flex items-center justify-center w-[48px] h-[48px]">
        {isCategory? (
          <svg width="27" height="27" viewBox="0 0 24 24" fill="black" stroke="black"><circle cx="11" cy="11" r="6" stroke="black" strokeWidth="2.2" fill="black"/><path d="M20 20l-3.5-3.5" stroke="black" strokeWidth="2.5" strokeLinecap="round"/></svg>
        ) : (
          <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.9" strokeLinecap="round"><circle cx="11" cy="11" r="6"/><path d="M20 20l-3.5-3.5" strokeWidth="2.2"/></svg>
        )}
      </Link>

      {/* 4. WISHLIST - Love */}
      <Link href="/wishlist" className="flex items-center justify-center w-[48px] h-[48px]">
        {isWishlist? (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="black" stroke="black"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 12 5.5C11.5 3.99 12.96 3 14.5 3C17.5 3 20 5.5 20 8.5C20 13.5 12 21 12 21Z" strokeWidth="1.6"/></svg>
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.9"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 12 5.5C11.5 3.99 12.96 3 14.5 3C17.5 3 20 5.5 20 8.5C20 13.5 12 21 12 21Z"/></svg>
        )}
      </Link>

      {/* 5. PROFILE - Pic a lang */}
      <Link href="/account" className="flex items-center justify-center w-[48px] h-[48px]">
        {userPic? (
          <div className={`w-[30px] h-[30px] rounded-full overflow-hidden ${isAccount? 'ring-[2px] ring-black ring-offset-[2px]' : 'ring-[1px] ring-gray-300'}`}>
            <img src={userPic} alt="profile" className="w-full h-full object-cover"/>
          </div>
        ) : (
          isAccount? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="black"><circle cx="12" cy="8" r="4.5"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" /></svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="1.9"><circle cx="12" cy="8" r="4.5"/><path d="M4 20c0-4 3.5-7 8-7s8 3 8 7"/></svg>
          )
        )}
      </Link>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [notif, setNotif] = useState<{title: string, body: string} | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (!isStandalone) {
      const handler = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowAndroidPrompt(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      const t = setTimeout(() => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (!isIOS) setShowAndroidPrompt(true);
      }, 3000);
    }

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
            await setDoc(doc(db, "fcmTokens", user.uid), { token: token, uid: user.uid, createdAt: new Date() });
          } else {
            await setDoc(doc(db, "fcmTokens", token.slice(0, 20)), { token: token, createdAt: new Date() });
          }
        }
        onMessage(messaging, (payload) => {
          setNotif({ title: payload.notification?.title || "Post thar a awm e!", body: payload.notification?.body || "" });
          setTimeout(()=> setNotif(null), 10000);
        });
      } catch (e) { console.log("FCM Error:", e); }
    };
    setupNotifications();
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setShowAndroidPrompt(false);
      setDeferredPrompt(null);
    } else {
      const isFirefox = /Firefox/.test(navigator.userAgent);
      if(isFirefox){
        alert("Firefox ah: Browser menu dot 3 (⋮) > Install emaw Add to Home Screen click rawh!");
      } else {
        alert("Browser Menu (⋮) > Add to Home Screen / Install App tih click rawh!");
      }
    }
  };

  return (
    <html lang="en">
      <head>
        <meta name="google-site-verification" content="1qX19xWmSKS6P49gzl2xh6snf0MJufrYwW6-s6urRsk" />
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
        <div className="pb-[58px]">{children}</div>
        <Footer />
        <IosInstallPopup />
        {showAndroidPrompt && (
          <div className="fixed bottom-[68px] left-3 right-3 z-[9998] animate-in slide-in-from-bottom">
            <div className="max-w-md mx-auto bg-black text-white rounded-[20px] p-4 flex items-center gap-3 shadow-2xl">
              <img src="/IMG-20260830-WA0778.jpg" className="w-12 h-12 rounded-xl bg-white object-cover" alt="icon"/>
              <div className="flex-1">
                <p className="font-black text-[14px]">MizoApps Install rawh! 🚀</p>
                <p className="text-[11px] text-gray-300">A ran leh awlsam zawk nan Apps install rawh!</p>
              </div>
              <button onClick={handleInstall} className="bg-white text-black font-black px-5 py-2.5 rounded-full text-[12px] active:scale-95">INSTALL</button>
              <button onClick={()=>setShowAndroidPrompt(false)} className="text-gray-400 px-2">✕</button>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}

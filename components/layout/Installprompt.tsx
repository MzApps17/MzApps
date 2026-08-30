"use client";
import { useEffect, useState } from "react";

export default function InstallPrompt(){
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(()=>{
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if(isStandalone) return;

    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    if(iOS){ setShow(true); return; }

    const handler = (e:any) => { e.preventDefault(); setDeferredPrompt(e); setShow(true); };
    window.addEventListener('beforeinstallprompt', handler);
    const t = setTimeout(()=> setShow(true), 3000);
    return ()=>{ window.removeEventListener('beforeinstallprompt', handler); clearTimeout(t); };
  },[]);

  const handleInstall = async () => {
    if(!deferredPrompt){ setShow(false); return; }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if(outcome === 'accepted') setShow(false);
    setDeferredPrompt(null);
  };

  if(!show) return null;
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3">
      <div className="max-w-md mx-auto bg-black text-white rounded-[20px] p-4 flex items-center gap-3 shadow-2xl">
        <img src="/icon-192.png" className="w-12 h-12 rounded-xl bg-white" />
        <div className="flex-1">
          <p className="font-black text-[14px]">MizoApps Install rawh! 🚀</p>
          <p className="text-[11px] text-gray-300">{isIOS? "Share > Add to Home Screen" : "A rang zawk nan!"}</p>
        </div>
        <button onClick={handleInstall} className="bg-white text-black font-black px-5 py-2.5 rounded-full text-[12px]">INSTALL</button>
        <button onClick={()=>setShow(false)} className="text-gray-400 px-2">✕</button>
      </div>
    </div>
  );
}

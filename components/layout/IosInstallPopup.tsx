"use client";
import { useEffect, useState } from "react";

export default function IosInstallPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const alreadySeen = localStorage.getItem('ios-popup-seen');
    if (isIos &&!isInStandalone &&!alreadySeen) {
      setTimeout(() => setShow(true), 2000);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-3 right-3 bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl z-[999] flex gap-3 items-start">
      <div className="text-2xl">📲</div>
      <div className="flex-1 text-[13px] leading-5">
        <b>iPhone ah App ang in dah rawh!</b><br/>
        Hnuai ah Share hmet la, Add to Home Screen hmet rawh.
      </div>
      <button
        onClick={() => {
          localStorage.setItem('ios-popup-seen','1');
          setShow(false);
        }}
        className="text-xs bg-white text-black px-3 py-1 rounded-full font-bold"
      >
        OK
      </button>
    </div>
  );
}

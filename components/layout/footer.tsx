"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer(){
  const path=usePathname();
  // Sell categories page ah footer hide duh loh chuan a lang vek ang
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50 h-[60px]">
      <Link href="/" className={`flex flex-col items-center gap-1 w-16 ${path==="/"?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={path==="/"?"2.5":"1.8"}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span className="text-[10px] font-black tracking-wide">HOME</span>
      </Link>
      <Link href="/profile" className={`flex flex-col items-center gap-1 w-16 ${path==="/profile"?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={path==="/profile"?"2.5":"1.8"}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        <span className="text-[10px] font-black tracking-wide">MY ADS</span>
      </Link>
      <Link href="/sell" className="flex flex-col items-center gap-1 w-16 text-[#002f34]">
        <div className="w-[44px] h-[44px] rounded-full border-[3px] border-[#002f34] flex items-center justify-center -mt-4 bg-white shadow-sm">
          <span className="text-[22px] font-black leading-none">+</span>
        </div>
        <span className="text-[10px] font-black tracking-wide">SELL</span>
      </Link>
      <Link href="/account" className="flex flex-col items-center gap-1 w-16 text-gray-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        <span className="text-[10px] font-black tracking-wide">ACCOUNT</span>
      </Link>
    </div>
  );
}

"use client";
import "./globals.css";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
        <span className={`text-[10px] ${isHome?"font-black":"font-bold"}`}>HOME</span>
      </Link>

      <Link href="/sell" className={`flex flex-col items-center w-20 ${isSell?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isSell?"2.6":"1.6"}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
        <span className={`text-[10px] ${isSell?"font-black":"font-bold"}`}>SELL</span>
      </Link>

      <Link href="/my-ads" className={`flex flex-col items-center w-20 ${isMyAds?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isMyAds?"2.6":"1.6"}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        <span className={`text-[10px] ${isMyAds?"font-black":"font-bold"}`}>MY ADS</span>
      </Link>

      <Link href="/account" className={`flex flex-col items-center w-20 ${isAccount?"text-[#002f34]":"text-gray-400"}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isAccount?"2.6":"1.6"}><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        <span className={`text-[10px] ${isAccount?"font-black":"font-bold"}`}>ACCOUNT</span>
      </Link>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <div className="pb-[60px]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

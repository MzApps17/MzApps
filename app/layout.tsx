import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "MZ Apps",
  description: "Mizoram Bazar & Jobs",
};

function Footer(){
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-50 h-[62px]">
      <Link href="/" className="flex flex-col items-center gap-[3px] w-20 text-[#002f34]">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span className="text-[10px] font-black tracking-widest">HOME</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center gap-[3px] w-20 text-gray-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
        <span className="text-[10px] font-black tracking-widest">MY ADS</span>
      </Link>
      <Link href="/sell" className="flex flex-col items-center gap-[3px] w-20 text-[#002f34]">
        <div className="w-[42px] h-[42px] rounded-full border-[2.5px] border-[#002f34] flex items-center justify-center -mt-3 bg-white shadow-sm">
          <span className="text-[22px] font-black leading-none">+</span>
        </div>
        <span className="text-[10px] font-black tracking-widest">SELL</span>
      </Link>
      <Link href="/profile" className="flex flex-col items-center gap-[3px] w-20 text-gray-400">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="7" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
        <span className="text-[10px] font-black tracking-widest">ACCOUNT</span>
      </Link>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-black antialiased">
        <div className="pb-[65px]">{children}</div>
        <Footer />
      </body>
    </html>
  );
}

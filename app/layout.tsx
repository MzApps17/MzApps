import "./globals.css";
import Navbar from "@/components/layout/Navbar";
export default function RootLayout({children}:{children:React.ReactNode}){
  return <html><body className="bg-gray-50"><Navbar/>{children}</body></html>
}

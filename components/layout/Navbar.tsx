"use client";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
export default function Navbar(){
  const {user}=useAuth();
  return <nav className="flex justify-between items-center p-4 bg-white border-b sticky top-0 z-10">
    <Link href="/" className="font-black text-xl">MZ</Link>
    <div className="flex gap-3 text-sm items-center">
      <Link href="/marketplace">Bazar</Link>
      <Link href="/jobs">Jobs</Link>
      {user? <button onClick={()=>signOut(auth)} className="bg-red-50 text-red-600 px-3 py-1 rounded-full">LogOut</button> : <Link href="/login" className="bg-black text-white px-4 py-1.5 rounded-full">Login</Link>}
    </div>
  </nav>
}

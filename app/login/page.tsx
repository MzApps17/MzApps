"use client";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login(){
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const login = async()=>{
    try {
      setLoading(true);
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (e:any) {
      alert("Login Error: " + e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="p-20 text-center">
      <h1 className="text-2xl font-bold mb-6">Login rawh</h1>
      <button onClick={login} disabled={loading} className="bg-black text-white px-8 py-3 rounded-full font-bold disabled:opacity-50">
        {loading ? "Lut mek..." : "Google hmangin Login"}
      </button>
    </main>
  )
}

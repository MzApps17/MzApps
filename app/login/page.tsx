"use client";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase/config";
import { useRouter } from "next/navigation";
export default function Login(){
  const router = useRouter();
  const login = async()=>{
    await signInWithPopup(auth, googleProvider);
    router.push("/");
  }
  return <main className="p-20 text-center"><h1 className="text-2xl font-bold mb-6">Login rawh</h1><button onClick={login} className="bg-black text-white px-8 py-3 rounded-full font-bold">Google hmangin Login</button></main>
}

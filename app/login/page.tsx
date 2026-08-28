"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login(){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [isSignup,setIsSignup]=useState(false); const [loading,setLoading]=useState(false);
  const [showPass,setShowPass]=useState(false);
  const router=useRouter();

  const submit=async(e:any)=>{
    e.preventDefault(); setLoading(true);
    try{
      if(isSignup){ await createUserWithEmailAndPassword(auth,email,pass); }
      else { await signInWithEmailAndPassword(auth,email,pass); }
      router.push("/");
    }catch(err:any){ alert(err.message); } finally{ setLoading(false); }
  }

  const googleLogin=async()=>{
    try{
      const provider=new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    }catch(err:any){ alert("Google Error: "+err.message); }
  }

  const resetPass=async()=>{
    if(!email){ alert("Email type hmasa rawh!"); return; }
    try{
      await sendPasswordResetEmail(auth, email);
      alert("Password Reset Link i email ah ka thawn e! En rawh - "+email);
    }catch(err:any){ alert(err.message); }
  }

  return <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
    <form onSubmit={submit} className="bg-white w-full max-w-sm rounded-[28px] p-8 border shadow-sm">
      <div className="text-4xl mb-3">👋</div>
      <h1 className="text-2xl font-black">{isSignup?"Account Siam":"Lo lut rawh"}</h1>
      <p className="text-sm text-gray-500 mt-1">MZ Apps ah i lo kal a lawm</p>

      <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="w-full mt-6 border-2 p-4 rounded-2xl" required/>

      {/* PASSWORD WITH EYE */}
      <div className="relative mt-3">
        <input value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" type={showPass?"text":"password"} className="w-full border-2 p-4 pr-12 rounded-2xl" required/>
        <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
          {showPass?"🙈":"👁️"}
        </button>
      </div>

      {!isSignup && <button type="button" onClick={resetPass} className="text-xs text-blue-600 mt-2 text-right w-full">Password i theihnghilh em?</button>}

      <button disabled={loading} className="w-full mt-4 bg-black text-white p-4 rounded-2xl font-bold">{loading?"...": isSignup?"Sign Up":"Log In"}</button>

      <div className="flex items-center my-4"><div className="flex-1 h-[1px] bg-gray-200"></div><span className="px-3 text-xs text-gray-400">OR</span><div className="flex-1 h-[1px] bg-gray-200"></div></div>

      <button type="button" onClick={googleLogin} className="w-full border-2 p-4 rounded-2xl font-bold flex items-center justify-center gap-2">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> Google hmangin lut
      </button>

      <button type="button" onClick={()=>setIsSignup(!isSignup)} className="w-full mt-4 text-sm text-gray-600">
        {isSignup?"Account i nei tawh em? Log In":"Account i nei lo em? Sign Up"}
      </button>
    </form>
  </main>
}

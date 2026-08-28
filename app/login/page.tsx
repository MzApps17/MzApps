"use client";
import { useState } from "react";
import { auth } from "@/lib/firebase/config";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail } from "firebase/auth";
import { useRouter } from "next/navigation";

export default function Login(){
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [isSignup,setIsSignup]=useState(false); const [loading,setLoading]=useState(false);
  const [showPass,setShowPass]=useState(false);
  const [alertMsg,setAlertMsg]=useState("");
  const router=useRouter();

  const showAlert=(msg:string)=>{
    // 4. Email format dik lo tih ah
    if(msg.toLowerCase().includes("invalid-email")){
      setAlertMsg("i Email format a dik lo");
    }else{
      setAlertMsg(msg);
    }
  };

  const submit=async(e:any)=>{
    e.preventDefault(); setLoading(true);
    try{
      if(isSignup){ await createUserWithEmailAndPassword(auth,email,pass); }
      else { await signInWithEmailAndPassword(auth,email,pass); }
      router.push("/");
    }catch(err:any){ showAlert(err.message); } finally{ setLoading(false); }
  }

  const googleLogin=async()=>{
    try{
      const provider=new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      router.push("/");
    }catch(err:any){ showAlert("Google Error: "+err.message); }
  }

  const resetPass=async()=>{
    if(!email){ showAlert("I email type hmasa rawh!"); return; }
    try{
      await sendPasswordResetEmail(auth, email);
      showAlert("Password Reset Link i email ah ka thawn e! En rawh - "+email);
    }catch(err:any){ showAlert(err.message); }
  }

  return (
    // 1. PAGE TUAITHEIH LOH - fixed + overflow-hidden
    <main className="h-[100dvh] w-full overflow-hidden fixed inset-0 bg-[#f5f5f5] flex flex-col overscroll-none touch-none">
      {/* 2. BACK LEH CARD INKAR TI ZIM */}
      <div className="w-full px-4 pt-3 pb-1 shrink-0">
        <button onClick={()=>router.back()} className="flex items-center gap-1 font-bold text-[16px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.8" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
          Back
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <form onSubmit={submit} className="bg-white w-full max-w-sm rounded-[28px] p-7 border shadow-sm">
          {/* 3. LO LUT RAWH / ACCOUNT SIAM PAIH - HEI CHIAH A AWM */}
          <p className="text-[15px] text-gray-500">Please continue to login</p>

          {/* 5. INPUT SIR KUAL DUM - focus ah */}
          <input
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="Email"
            className="w-full mt-6 border-2 border-gray-200 p-4 rounded-2xl outline-none focus:border-black focus:ring-1 focus:ring-black"
            required
          />

          <div className="relative mt-3">
            <input
              value={pass}
              onChange={e=>setPass(e.target.value)}
              placeholder="Password"
              type={showPass?"text":"password"}
              className="w-full border-2 border-gray-200 p-4 pr-12 rounded-2xl outline-none focus:border-black focus:ring-1 focus:ring-black"
              required
            />
            <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPass? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/><line x1="2" y1="2" x2="22" y2="22" strokeWidth="2.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>

          {!isSignup && <button type="button" onClick={resetPass} className="text-[13px] font-black text-black mt-3 text-right w-full">Forgot Password</button>}

          <button disabled={loading} className="w-full mt-5 bg-black text-white p-4 rounded-2xl font-bold">{loading?"...": isSignup?"Sign Up":"Log In"}</button>

          <div className="flex items-center my-4"><div className="flex-1 h-[1px] bg-gray-200"></div><span className="px-3 text-xs text-gray-400">OR</span><div className="flex-1 h-[1px] bg-gray-200"></div></div>

          <button type="button" onClick={googleLogin} className="w-full border-2 border-gray-200 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 focus:border-black">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5"/> Login with Google
          </button>

          <div className="w-full mt-4 text-sm text-gray-600 text-center">
            {isSignup? "Account i nei tawh em? " : "Account i nei lo em? "}
            <button type="button" onClick={()=>setIsSignup(!isSignup)} className="font-black text-blue-600">
              {isSignup?"Log In":"Sign Up"}
            </button>
          </div>
        </form>
      </div>

      {alertMsg && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs text-center shadow-xl">
            <p className="text-[15px] font-bold text-black">{alertMsg}</p>
            <button onClick={()=>setAlertMsg("")} className="mt-4 w-full bg-black text-white p-3 rounded-xl font-bold">OK</button>
          </div>
        </div>
      )}
    </main>
  );
}

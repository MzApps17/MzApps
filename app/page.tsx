"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

const allCountries = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+95", flag: "🇲🇲", name: "Myanmar" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+66", flag: "🇹🇭", name: "Thailand" },
  { code: "+84", flag: "🇻🇳", name: "Vietnam" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
];

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [otp, setOtp] = useState(["","","","","",""]);
  const [country, setCountry] = useState(allCountries[0]);
  const [showCountry, setShowCountry] = useState(false);
  const [step, setStep] = useState<"phone"|"otp"|"profile">("phone");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [name, setName] = useState("");
  const [picBase64, setPicBase64] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // AUTH CHECK - LOGIN TAWH CHUAN HOME AH DIRECT - BACK THEIH LO
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, (user)=>{
      if(user && user.phoneNumber){
        // Profile a nei tawh em check lo in Home ah replace - back theih lo
        router.replace("/home");
      }
    });
    return ()=>unsub();
  },[router]);

  // RECAPTCHA INIT
  useEffect(()=>{
    if(!(window as any).recaptchaVerifier){
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth,"recaptcha-container",{
        size:"invisible",
        callback: ()=>{},
        'expired-callback': ()=>{
          try{ (window as any).recaptchaVerifier.clear(); }catch{}
          (window as any).recaptchaVerifier = null;
        }
      });
    }
  },[]);

  useEffect(()=>{ if(step==="otp") inputsRef.current[0]?.focus(); },[step]);

  const filtered = allCountries.filter(c=> c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search));

  const handleSend = async()=>{
    if(!phone) return;
    setLoading(true);
    try{
      // Reset recaptcha thianghlim
      if((window as any).recaptchaVerifier){
        try{ (window as any).recaptchaVerifier.clear(); }catch{}
        (window as any).recaptchaVerifier = null;
      }
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth,"recaptcha-container",{size:"invisible"});

      const conf=await signInWithPhoneNumber(auth,country.code+phone,(window as any).recaptchaVerifier);
      setConfirmation(conf);
      setStep("otp");
    }catch(e:any){
      alert(e.message);
      if((window as any).recaptchaVerifier){
        try{ (window as any).recaptchaVerifier.clear(); }catch{}
        (window as any).recaptchaVerifier = null;
      }
    }
    setLoading(false);
  };

  const handleOtpChange = (v:string,i:number)=>{ if(v&&!/^\d$/.test(v)) return; const n=[...otp]; n[i]=v.slice(-1); setOtp(n); if(v&&i<5) inputsRef.current[i+1]?.focus(); };

  const handleVerify = async()=>{
    const code=otp.join(""); if(code.length!==6) return;
    setLoading(true);
    try{
      await confirmation.confirm(code);
      setStep("profile");
    }catch{
      alert("Invalid OTP");
    }
    setLoading(false);
  };

  const onFileChange = (e:any)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setPicBase64(r.result as string); r.readAsDataURL(f); };

  const handleProfileSave = async()=>{
    if(!name.trim()){ alert("Enter name"); return; }
    setLoading(true);
    try{
      const user=auth.currentUser;
      await setDoc(doc(db,"users",user!.uid),{
        name:name.trim(),
        phone:country.code+phone,
        photoURL:picBase64||"",
        uid:user!.uid,
        isOnline:true,
        lastSeen:new Date(),
        createdAt:new Date()
      },{merge:true});
      router.replace("/home");
    }catch(e:any){ alert(e.message); setLoading(false); }
  };

  return(
    <div style={{height:"100dvh", width:"100%", overflow:"hidden", position:"fixed", inset:0, background:"white", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px", boxSizing:"border-box"}}>
      <div id="recaptcha-container" style={{position:"absolute", left:"-9999px", top:"-9999px"}}></div>
      <style>{`.grecaptcha-badge{visibility:hidden!important;display:none!important;opacity:0!important;}`}</style>

      <div style={{display:"flex", flexDirection:"column", alignItems:"center", marginBottom:40, flexShrink:0, width:"100%", maxWidth:360}}>
        <div style={{width:90,height:90,background:"#7c3aed",borderRadius:28,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:42}}>💬</div>
        <h1 style={{fontSize:38,fontWeight:800,margin:0}}><span style={{color:"black"}}>Mz</span><span style={{color:"#7c3aed"}}>Apps</span></h1>
      </div>

      {step==="phone"&&(
        <div style={{width:"100%",maxWidth:360, boxSizing:"border-box"}}>
          <p style={{fontSize:14,fontWeight:600,marginBottom:8}}>Phone Number</p>
          <div style={{display:"flex",gap:10, width:"100%"}}>
            <button onClick={()=>setShowCountry(true)} style={{border:`2px solid #7c3aed`,borderRadius:16,padding:"10px 14px",fontWeight:700,background:"white",minWidth:78, flexShrink:0}}>{country.flag} {country.code}<div style={{fontSize:12}}>▼</div></button>
            <input value={phone} onFocus={()=>setIsFocused(true)} onBlur={()=>setIsFocused(false)} onChange={(e)=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="Enter your phone number" inputMode="numeric" style={{flex:1,border:`2px solid ${isFocused?"#7c3aed":"#e5e7eb"}`,borderRadius:16,padding:"14px 16px",outline:"none",fontSize:16, minWidth:0, boxSizing:"border-box"}}/>
          </div>
          <button onClick={handleSend} style={{width:"100%",marginTop:22,background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"16px",fontWeight:700, boxSizing:"border-box"}}>{loading?"Sending...":"Send OTP"}</button>
        </div>
      )}

      {step==="otp"&&(
        <div style={{width:"100%",maxWidth:360, boxSizing:"border-box"}}>
          <p style={{fontSize:14,fontWeight:700,marginBottom:16, textAlign:"center"}}>Enter OTP sent to {country.code} {phone}</p>
          <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:22}}>
            {otp.map((d,i)=><input key={i} ref={(el)=>{inputsRef.current[i]=el}} value={d} onChange={(e)=>handleOtpChange(e.target.value,i)} onKeyDown={(e)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)inputsRef.current[i-1]?.focus()}} maxLength={1} inputMode="numeric" placeholder="0" style={{width:42,height:52,textAlign:"center",fontSize:18,fontWeight:700,border:"2px solid #e5e7eb",borderRadius:12,outline:"none"}}/>)}
          </div>
          <button onClick={handleVerify} style={{width:"100%",background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"15px",fontWeight:700}}>{loading?"Verifying...":"Verify & Continue"}</button>
          <button onClick={()=>setStep("phone")} style={{width:"100%",marginTop:12,background:"black",color:"white",border:"none",borderRadius:18,padding:"15px",display:"flex",justifyContent:"center",gap:12,alignItems:"center",fontWeight:700}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Change phone number
          </button>
        </div>
      )}

      {step==="profile"&&(
        <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center", boxSizing:"border-box"}}>
          <p style={{fontWeight:800,fontSize:18,marginBottom:20}}>Setup your profile</p>
          <label style={{width:110,height:110,borderRadius:55,background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",border:"2px dashed #7c3aed",marginBottom:16}}>
            {picBase64? <img src={picBase64} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:40}}>📷</span>}
            <input type="file" accept="image/*" hidden onChange={onFileChange}/>
          </label>
          <p style={{fontSize:13,color:"#666",marginBottom:16}}>Tap to add profile photo</p>
          <div style={{width:"100%",borderBottom:`2px solid ${isNameFocused?"#7c3aed":"#ccc"}`,padding:"8px 0",marginBottom:24}}>
            <input value={name} onFocus={()=>setIsNameFocused(true)} onBlur={()=>setIsNameFocused(false)} onChange={(e)=>setName(e.target.value)} placeholder="Enter your name" style={{width:"100%",border:"none",outline:"none",fontSize:17,background:"transparent",textAlign:"center"}}/>
          </div>
          <button onClick={handleProfileSave} disabled={loading} style={{width:"100%",background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"16px",fontWeight:700}}>{loading?"Saving...":"Continue to Home"}</button>
        </div>
      )}

      {showCountry&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:50,paddingTop:20}}>
          <div style={{background:"white",width:"95%",maxWidth:360,maxHeight:"85dvh",borderRadius:24,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 12px 8px",background:"white",borderBottom:"1px solid #eee", display:"flex", flexDirection:"column", alignItems:"center"}}>
              <div style={{width:36,height:4,background:"#ddd",borderRadius:2,margin:"0 auto 10px"}}/>
              <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search country" autoFocus style={{width:"85%", border:"1.5px solid #7c3aed",borderRadius:10,padding:"9px 12px",outline:"none",fontSize:14, textAlign:"center"}}/>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {filtered.map(c=>(<button key={c.name+c.code} onClick={()=>{setCountry(c); setShowCountry(false); setSearch("");}} style={{width:"100%",display:"flex",gap:12,padding:"12px 16px",border:"none",background:"white",textAlign:"left",borderBottom:"1px solid #f5f5f5", fontSize:14}}><span>{c.flag}</span><b>{c.code}</b><span style={{color:"#555"}}>{c.name}</span></button>))}
            </div>
            <div style={{display:"flex", justifyContent:"center", padding:"12px"}}>
              <button onClick={()=>setShowCountry(false)} style={{minWidth:120, background:"black",color:"white",border:"none",borderRadius:12,padding:"10px 24px",fontWeight:700, fontSize:14}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

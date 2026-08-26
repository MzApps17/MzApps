"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/firebase/config";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useLanguage } from "./components/LanguageProvider";
import { useTheme } from "./components/ThemeProvider";

const EMAILJS_SERVICE_ID = "service_mizochatapps"
const EMAILJS_TEMPLATE_ID = "template_u8any4c"
const EMAILJS_PUBLIC_KEY = "nwa9O5wrEUf8fKcUf" // Account > API Keys atanga i hmuh kha dah rawh!

function CustomAlert({ msg, onClose }: { msg: string, onClose: () => void }) {
  if (!msg) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:'22px', maxWidth:320, width:'100%', textAlign:'center' }}>
        <p style={{ fontSize:14, fontWeight:600 }}>{msg}</p>
        <button onClick={onClose} style={{ background:'#7C3AED', color:'white', border:'none', borderRadius:12, padding:'10px 28px', fontWeight:700, width:'100%', marginTop:12 }}>OK</button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["","","","","",""]);
  const [step, setStep] = useState<"email"|"otp"|"profile">("email");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [picBase64, setPicBase64] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const router = useRouter();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const { t, currentLang, changeLang, allLanguages } = useLanguage();
  const [showLang, setShowLang] = useState(false);
  const [langSearch, setLangSearch] = useState("");
  const { fontSize } = useTheme();

  useEffect(()=>{ const unsub = onAuthStateChanged(auth, (u)=>{ if(u) router.replace("/home"); }); return ()=>unsub(); },[router]);

  const handleSend = async()=>{
    if(!email.includes("@")){ setAlertMsg("Email dik lo"); return; }
    setLoading(true);
    try{
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await setDoc(doc(db, "emailOtps", email), { otp: otpCode, createdAt: new Date().getTime() });

      // REAL EMAIL - EmailJS
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_SERVICE_ID,
          template_id: EMAILJS_TEMPLATE_ID,
          user_id: EMAILJS_PUBLIC_KEY,
          template_params: { to_email: email, otp_code: otpCode, to_name: "MzApps User" }
        })
      });

      if(res.ok){
        setStep("otp");
        setAlertMsg(`OTP thawn a ni! ${email} ah en rawh - 30 mins valid! Spam folder pawh en rawh`);
      } else {
        setAlertMsg("Email thawn theih loh - Public Key dik lo emaw To Email {{to_email}} ah i dah lo em?");
      }
    }catch(e:any){ setAlertMsg(e.message); }
    setLoading(false);
  };

  const handleOtpChange = (v:string,i:number)=>{ const n=[...otp]; n[i]=v.slice(-1); setOtp(n); if(v&&i<5) inputsRef.current[i+1]?.focus(); };

  const handleVerify = async()=>{
    const code=otp.join(""); if(code.length!==6) return; setLoading(true);
    const snap = await getDoc(doc(db, "emailOtps", email));
    if(!snap.exists()){ setAlertMsg("OTP expired - thawn nawn leh rawh"); setLoading(false); return; }
    const data = snap.data();
    const diff = new Date().getTime() - data.createdAt;
    if(diff > 30*60*1000){ setAlertMsg("OTP expired (30 min pel tawh) - thawn nawn leh rawh"); setLoading(false); return; }
    if(data.otp!==code){ setAlertMsg("OTP dik lo"); setLoading(false); return; }
    try{ await signInWithEmailAndPassword(auth, email, code+"MzApps2024!"); }
    catch{ await createUserWithEmailAndPassword(auth, email, code+"MzApps2024!"); }
    setStep("profile"); setLoading(false);
  };

  const onFileChange = (e:any)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setPicBase64(r.result as string); r.readAsDataURL(f); };
  const handleProfileSave = async()=>{
    if(!name.trim()){ setAlertMsg("Hming dah rawh"); return; } setLoading(true);
    const user=auth.currentUser;
    await setDoc(doc(db,"users",user!.uid),{ name:name.trim(), email, photoURL:picBase64||"", uid:user!.uid, isOnline:true, lastSeen:new Date() },{merge:true});
    router.replace("/home");
  };

  return(
    <div style={{height:"100dvh", position:"fixed", inset:0, background:"white", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:20}}>
      <CustomAlert msg={alertMsg} onClose={()=>setAlertMsg("")} />
      <div style={{position:"absolute", top:16, right:16}}><button onClick={()=>setShowLang(true)} style={{border:"1.5px solid #7C3AED", borderRadius:20, padding:"6px 12px", background:"white", fontWeight:700}}>{currentLang.flag} {currentLang.code.toUpperCase()} ▼</button></div>
      <div style={{width:90,height:90,background:"#7c3aed",borderRadius:28,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:42}}>💬</div>
      <h1 style={{fontSize:38,fontWeight:800,margin:"0 0 40px 0"}}><span style={{color:"black"}}>Mz</span><span style={{color:"#7c3aed"}}>Apps</span></h1>
      {step==="email"&&(<div style={{width:"100%",maxWidth:360}}><input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email dah rawh" style={{width:"100%",border:"2px solid #e5e7eb",borderRadius:16,padding:"14px 16px",fontSize:16, boxSizing:"border-box"}}/><button onClick={handleSend} style={{width:"100%",marginTop:22,background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"16px",fontWeight:700}}>{loading?"Sending...":t.send}</button></div>)}
      {step==="otp"&&(<div style={{width:"100%",maxWidth:360}}><p style={{textAlign:"center", fontWeight:700}}>{email}</p><div style={{display:"flex",justifyContent:"center",gap:8,margin:"16px 0"}}>{otp.map((d,i)=><input key={i} ref={(el)=>{inputsRef.current[i]=el}} value={d} onChange={(e)=>handleOtpChange(e.target.value,i)} maxLength={1} inputMode="numeric" style={{width:42,height:52,textAlign:"center",fontSize:18,fontWeight:700,border:"2px solid #e5e7eb",borderRadius:12}}/> )}</div><button onClick={handleVerify} style={{width:"100%",background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"15px",fontWeight:700}}>{loading?"Verifying...":t.verify}</button><button onClick={()=>setStep("email")} style={{width:"100%",marginTop:10,background:"transparent",border:"none",color:"#7c3aed",fontWeight:700}}>Thawn nawn leh</button></div>)}
      {step==="profile"&&(<div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center"}}><label style={{width:110,height:110,borderRadius:55,background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:"2px dashed #7c3aed"}}>{picBase64? <img src={picBase64} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:40}}>📷</span>}<input type="file" accept="image/*" hidden onChange={onFileChange}/></label><input value={name} onChange={(e)=>setName(e.target.value)} placeholder={t.enterName} style={{width:"100%",border:"none",borderBottom:"2px solid #ccc",textAlign:"center",padding:"10px",margin:"20px 0", outline:"none"}}/><button onClick={handleProfileSave} style={{width:"100%",background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"16px",fontWeight:700}}>{t.continue}</button></div>)}
    </div>
  );
}

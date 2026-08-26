"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/app/firebase/config";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";
import { useLanguage } from "./components/LanguageProvider";
import { useTheme } from "./components/ThemeProvider";

function CustomAlert({ msg, onClose }: { msg: string, onClose: () => void }) {
  if (!msg) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:99999, padding:20 }}>
      <div style={{ background:'white', borderRadius:20, padding:'22px', maxWidth:320, width:'100%', textAlign:'center', boxShadow:'0 15px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ width:48, height:48, background:'#FEE2E2', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:22 }}>⚠️</div>
        <p style={{ fontSize:14, fontWeight:600, color:'#1F2937', marginBottom:18, lineHeight:1.4 }}>{msg}</p>
        <button onClick={onClose} style={{ background:'#7C3AED', color:'white', border:'none', borderRadius:12, padding:'10px 28px', fontWeight:700, fontSize:14, width:'100%' }}>OK</button>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [otp, setOtp] = useState(["","","","","",""]);
  const [showLang, setShowLang] = useState(false);
  const [step, setStep] = useState<"email"|"otp"|"profile">("email");
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [picBase64, setPicBase64] = useState("");
  const [alertMsg, setAlertMsg] = useState("");
  const [langSearch, setLangSearch] = useState("");
  const router = useRouter();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const { t, currentLang, allLanguages, changeLang } = useLanguage();
  const { fontSize } = useTheme();

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, (user)=>{ if(user) router.replace("/home"); });
    return ()=>unsub();
  },[router]);

  useEffect(()=>{ if(step==="otp") inputsRef.current[0]?.focus(); },[step]);

  const filteredLang = allLanguages.filter((l:any)=> l.name.toLowerCase().includes(langSearch.toLowerCase()) || l.code.includes(langSearch.toLowerCase()));

  // REAL EMAIL OTP - 100% FREE - THAWN NGHAL
  const handleSend = async()=>{
    if(!email ||!email.includes("@")){ setAlertMsg("Please enter valid email"); return; }
    setLoading(true);
    try{
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // 1. Save OTP in Firestore for verification
      await setDoc(doc(db, "emailOtps", email), {
        otp: otpCode,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10*60*1000)
      });

      // 2. SEND REAL EMAIL via Firebase Trigger Email Extension (FREE - 100% real email)
      // Firebase Console -> Extensions -> Trigger Email -> Install -> collection: mail
      await addDoc(collection(db, "mail"), {
        to: email,
        message: {
          subject: `MzApps - Your OTP is ${otpCode}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #ffffff; border-radius: 20px; border: 1px solid #E5E7EB;">
              <div style="text-align: center; margin-bottom: 20px;">
                <div style="width: 60px; height: 60px; background: #7C3AED; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; font-size: 28px;">💬</div>
                <h1 style="margin: 12px 0 0; font-size: 28px;"><span style="color: #000;">Mz</span><span style="color: #7C3AED;">Apps</span></h1>
              </div>
              <h2 style="color: #111827; font-size: 18px; text-align: center;">Your verification code</h2>
              <div style="background: #F3F4F6; border-radius: 16px; padding: 20px; text-align: center; margin: 20px 0;">
                <h1 style="font-size: 36px; letter-spacing: 10px; margin: 0; color: #7C3AED; font-weight: 800;">${otpCode}</h1>
              </div>
              <p style="color: #6B7280; font-size: 14px; text-align: center;">This code expires in 10 minutes. Do not share this code with anyone.</p>
              <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin-top: 20px;">MzApps - Mizo Social App</p>
            </div>
          `
        }
      });

      setStep("otp");
      setAlertMsg(`OTP sent to ${email} - Check Inbox & Spam folder`);
    }catch(e:any){
      setAlertMsg(e.message || "Failed to send OTP. Make sure Trigger Email extension is installed in Firebase.");
    }
    setLoading(false);
  };

  const handleOtpChange = (v:string,i:number)=>{ if(v&&!/^\d$/.test(v)) return; const n=[...otp]; n[i]=v.slice(-1); setOtp(n); if(v&&i<5) inputsRef.current[i+1]?.focus(); };

  const handleVerify = async()=>{
    const code=otp.join(""); if(code.length!==6) return;
    setLoading(true);
    try{
      const snap = await getDoc(doc(db, "emailOtps", email));
      if(!snap.exists()){ setAlertMsg("OTP expired. Send again."); setLoading(false); return; }
      const data = snap.data();
      if(data.expiresAt && data.expiresAt.toDate() < new Date()){ setAlertMsg("OTP expired. Send again."); setLoading(false); return; }
      if(data.otp!== code){ setAlertMsg("Invalid OTP"); setLoading(false); return; }

      // OTP OK - Create / Login user - FREE
      try{
        await signInWithEmailAndPassword(auth, email, code + "MzApps_Secret_2024!");
      }catch{
        try{
          await createUserWithEmailAndPassword(auth, email, code + "MzApps_Secret_2024!");
        }catch(err:any){
          if(err.code === "auth/email-already-in-use"){
            // Try different password pattern
            try{ await signInWithEmailAndPassword(auth, email, code + "MzApps_Secret_2024!"); }
            catch{ setAlertMsg("Email already exists. Please use different email."); setLoading(false); return; }
          }else throw err;
        }
      }
      setStep("profile");
    }catch(e:any){ setAlertMsg(e.message); }
    setLoading(false);
  };

  const onFileChange = (e:any)=>{ const f=e.target.files?.[0]; if(!f) return; const r=new FileReader(); r.onload=()=>setPicBase64(r.result as string); r.readAsDataURL(f); };

  const handleProfileSave = async()=>{
    if(!name.trim()){ setAlertMsg(t.enterName); return; }
    setLoading(true);
    try{
      const user=auth.currentUser;
      await setDoc(doc(db,"users",user!.uid),{
        name:name.trim(),
        email: email,
        phone:"",
        photoURL:picBase64||"",
        uid:user!.uid,
        isOnline:true,
        lastSeen:new Date(),
        createdAt:new Date()
      },{merge:true});
      router.replace("/home");
    }catch(e:any){ setAlertMsg(e.message); setLoading(false); }
  };

  return(
    <div style={{height:"100dvh", width:"100%", overflow:"hidden", position:"fixed", inset:0, background:"white", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"20px", boxSizing:"border-box", fontSize: fontSize==='small'?'13px':fontSize==='large'?'18px':'15px'}}>
      <CustomAlert msg={alertMsg} onClose={()=>setAlertMsg("")} />

      <div style={{position:"absolute", top:16, right:16, zIndex:20}}>
        <button onClick={()=>setShowLang(true)} style={{border:"1.5px solid #7C3AED", borderRadius:20, padding:"6px 12px", background:"white", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", gap:5}}>{currentLang.flag} {currentLang.code.toUpperCase()} ▼</button>
      </div>

      <div style={{display:"flex", flexDirection:"column", alignItems:"center", marginBottom:40, flexShrink:0, width:"100%", maxWidth:360}}>
        <div style={{width:90,height:90,background:"#7c3aed",borderRadius:28,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14,fontSize:42}}>💬</div>
        <h1 style={{fontSize:38,fontWeight:800,margin:0}}><span style={{color:"black"}}>Mz</span><span style={{color:"#7c3aed"}}>Apps</span></h1>
      </div>

      {step==="email"&&(
        <div style={{width:"100%",maxWidth:360, boxSizing:"border-box"}}>
          <p style={{fontSize:14,fontWeight:600,marginBottom:8}}>{t.email}</p>
          <input value={email} onFocus={()=>setIsFocused(true)} onBlur={()=>setIsFocused(false)} onChange={(e)=>setEmail(e.target.value)} placeholder={t.enterEmail} style={{width:"100%",border:`2px solid ${isFocused?"#7c3aed":"#e5e7eb"}`,borderRadius:16,padding:"14px 16px",outline:"none",fontSize:16, boxSizing:"border-box"}}/>
          <button onClick={handleSend} style={{width:"100%",marginTop:22,background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"16px",fontWeight:700}}>{loading?"Sending...":t.send}</button>
        </div>
      )}

      {step==="otp"&&(
        <div style={{width:"100%",maxWidth:360, boxSizing:"border-box"}}>
          <p style={{fontSize:14,fontWeight:700,marginBottom:16, textAlign:"center"}}>{t.enterOtp} {email}</p>
          <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:22}}>
            {otp.map((d,i)=><input key={i} ref={(el)=>{inputsRef.current[i]=el}} value={d} onChange={(e)=>handleOtpChange(e.target.value,i)} onKeyDown={(e)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)inputsRef.current[i-1]?.focus()}} maxLength={1} inputMode="numeric" placeholder="0" style={{width:42,height:52,textAlign:"center",fontSize:18,fontWeight:700,border:"2px solid #e5e7eb",borderRadius:12,outline:"none"}}/>)}
          </div>
          <button onClick={handleVerify} style={{width:"100%",background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"15px",fontWeight:700}}>{loading?"Verifying...":t.verify}</button>
          <button onClick={()=>setStep("email")} style={{width:"100%",marginTop:12,background:"black",color:"white",border:"none",borderRadius:18,padding:"15px",display:"flex",justifyContent:"center",gap:12,alignItems:"center",fontWeight:700}}>{t.change}</button>
        </div>
      )}

      {step==="profile"&&(
        <div style={{width:"100%",maxWidth:360,display:"flex",flexDirection:"column",alignItems:"center", boxSizing:"border-box"}}>
          <p style={{fontWeight:800,fontSize:18,marginBottom:20}}>{t.setup}</p>
          <label style={{width:110,height:110,borderRadius:55,background:"#f3f4f6",display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",cursor:"pointer",border:"2px dashed #7c3aed",marginBottom:16}}>
            {picBase64? <img src={picBase64} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span style={{fontSize:40}}>📷</span>}
            <input type="file" accept="image/*" hidden onChange={onFileChange}/>
          </label>
          <p style={{fontSize:13,color:"#666",marginBottom:16}}>{t.addPhoto}</p>
          <div style={{width:"100%",borderBottom:`2px solid ${isNameFocused?"#7c3aed":"#ccc"}`,padding:"8px 0",marginBottom:24}}>
            <input value={name} onFocus={()=>setIsNameFocused(true)} onBlur={()=>setIsNameFocused(false)} onChange={(e)=>setName(e.target.value)} placeholder={t.enterName} style={{width:"100%",border:"none",outline:"none",fontSize:17,background:"transparent",textAlign:"center"}}/>
          </div>
          <button onClick={handleProfileSave} disabled={loading} style={{width:"100%",background:"#7c3aed",color:"white",border:"none",borderRadius:18,padding:"16px",fontWeight:700}}>{loading?"Saving...":t.continue}</button>
        </div>
      )}

      {showLang&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:60,paddingTop:20}}>
          <div style={{background:"white",width:"95%",maxWidth:360,maxHeight:"85dvh",borderRadius:24,display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 12px 8px",background:"white",borderBottom:"1px solid #eee", display:"flex", flexDirection:"column", alignItems:"center"}}>
              <div style={{width:36,height:4,background:"#ddd",borderRadius:2,margin:"0 auto 10px"}}/>
              <input value={langSearch} onChange={(e)=>setLangSearch(e.target.value)} placeholder={t.searchLang} autoFocus style={{width:"85%", border:"1.5px solid #7c3aed",borderRadius:10,padding:"9px 12px",outline:"none",fontSize:14, textAlign:"center"}}/>
            </div>
            <div style={{overflowY:"auto",flex:1}}>
              {filteredLang.map((l:any)=>(<button key={l.code} onClick={()=>{changeLang(l.code); setShowLang(false); setLangSearch("");}} style={{width:"100%",display:"flex",gap:12,padding:"12px 16px",border:"none",background: currentLang.code===l.code? "#F3E8FF":"white",textAlign:"left",borderBottom:"1px solid #f5f5f5", fontSize:14}}><span>{l.flag}</span><b>{l.code.toUpperCase()}</b><span style={{color:"#555"}}>{l.name}</span>{currentLang.code===l.code&&<span style={{marginLeft:"auto", color:"#7C3AED"}}>✓</span>}</button>))}
            </div>
            <div style={{display:"flex", justifyContent:"center", padding:"12px"}}>
              <button onClick={()=>setShowLang(false)} style={{minWidth:120, background:"black",color:"white",border:"none",borderRadius:12,padding:"10px 24px",fontWeight:700, fontSize:14}}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
          }

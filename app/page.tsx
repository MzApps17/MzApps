"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const countries = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+95", flag: "🇲🇲", name: "Myanmar" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
];

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [country, setCountry] = useState(countries[0]);
  const [showCountry, setShowCountry] = useState(false);
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const router = useRouter();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
  }, []);
  useEffect(() => { if (step === "otp") inputsRef.current[0]?.focus(); }, [step]);

  const handleSend = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const conf = await signInWithPhoneNumber(auth, country.code + phone, (window as any).recaptchaVerifier);
      setConfirmation(conf); setStep("otp");
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };
  const handleOtpChange = (v: string, i: number) => {
    if (!/^\d*$/.test(v)) return;
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };
  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length!== 6) return;
    setLoading(true);
    try { await confirmation.confirm(code); router.push("/home"); } catch { alert("Invalid OTP"); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh", background:"white", display:"flex", flexDirection:"column", alignItems:"center", padding:"80px 24px"}}>
      <div id="recaptcha-container"></div>

      {/* 1. MzApps + icon lian */}
      <div style={{display:"flex", flexDirection:"column", alignItems:"center", marginBottom:48}}>
        <div style={{width:80, height:80, background:"linear-gradient(135deg,#8b5cf6,#7c3aed)", borderRadius:24, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16, fontSize:40}}>💬</div>
        <h1 style={{fontSize:36, fontWeight:800, margin:0}}><span style={{color:"black"}}>Mz</span><span style={{color:"#7c3aed"}}>Apps</span></h1>
      </div>

      {step === "phone"? (
        <div style={{width:"100%", maxWidth:360}}>
          <p style={{fontSize:14, fontWeight:600, marginBottom:8}}>Phone Number</p>
          <div style={{display:"flex", gap:12}}>
            <button onClick={()=>setShowCountry(!showCountry)} style={{display:"flex", alignItems:"center", gap:6, border:"2px solid #7c3aed", borderRadius:16, padding:"14px 16px", fontWeight:600, background:"white"}}>{country.flag} {country.code} ▼</button>
            <input value={phone} onChange={(e)=>setPhone(e.target.value.replace(/\D/g,""))} placeholder="7005..." style={{flex:1, border:"1px solid #ddd", borderRadius:16, padding:"14px 16px", outline:"none", fontSize:16}}/>
          </div>
          {showCountry && <div style={{marginTop:8, border:"1px solid #eee", borderRadius:16, overflow:"hidden", boxShadow:"0 10px 30px rgba(0,0,0,0.1)"}}>{countries.map(c=><button key={c.code} onClick={()=>{setCountry(c); setShowCountry(false);}} style={{width:"100%", padding:"12px 16px", textAlign:"left", background:"white", border:"none", borderBottom:"1px solid #f5f5f5"}}>{c.flag} {c.code} {c.name}</button>)}</div>}
          <button onClick={handleSend} style={{width:"100%", marginTop:24, background:"#7c3aed", color:"white", border:"none", borderRadius:16, padding:"16px", fontSize:18, fontWeight:600}}>{loading?"Sending...":"Send OTP"}</button>
        </div>
      ) : (
        <div style={{width:"100%", maxWidth:360}}>
          <p style={{fontSize:14, fontWeight:700, marginBottom:16}}>Enter OTP sent to {country.code} {phone}</p>
          <div style={{display:"flex", justifyContent:"space-between", gap:8, marginBottom:24}}>
            {otp.map((d,i)=><input key={i} ref={(el)=>{inputsRef.current[i]=el}} value={d} onChange={(e)=>handleOtpChange(e.target.value,i)} onKeyDown={(e)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)inputsRef.current[i-1]?.focus()}} maxLength={1} placeholder="0" style={{width:48, height:56, textAlign:"center", fontSize:20, fontWeight:700, border:"2px solid #ddd", borderRadius:12, outline:"none"}}/>)}
          </div>
          <button onClick={handleVerify} style={{width:"100%", background:"#7c3aed", color:"white", border:"none", borderRadius:16, padding:"16px", fontSize:18, fontWeight:600}}>{loading?"Verifying...":"Verify & Continue"}</button>
          <button onClick={()=>setStep("phone")} style={{width:"100%", marginTop:12, background:"black", color:"white", border:"none", borderRadius:16, padding:"16px", fontSize:16}}>← Change phone number</button>
        </div>
      )}
    </div>
  );
}

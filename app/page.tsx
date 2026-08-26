"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db, storage } from "@/app/firebase/config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  { code: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+351", flag: "🇵🇹", name: "Portugal" },
  { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+43", flag: "🇦🇹", name: "Austria" },
  { code: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "+353", flag: "🇮🇪", name: "Ireland" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+971", flag: "🇦🇪", name: "Dubai" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+7", flag: "🇷🇺", name: "Russia" },
];

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [country, setCountry] = useState(allCountries[0]);
  const [showCountry, setShowCountry] = useState(false);
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [loading, setLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<any>(null);
  const [name, setName] = useState("");
  const [pic, setPic] = useState<File | null>(null);
  const [picPreview, setPicPreview] = useState("");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", { size: "invisible" });
    }
  }, []);
  useEffect(() => { if (step === "otp") inputsRef.current[0]?.focus(); }, [step]);

  const filtered = allCountries.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.includes(search));

  const handleSend = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const conf = await signInWithPhoneNumber(auth, country.code + phone, (window as any).recaptchaVerifier);
      setConfirmation(conf); setStep("otp");
    } catch (e: any) { alert(e.message); (window as any).recaptchaVerifier?.render().then((id:any)=>{(window as any).grecaptcha?.reset(id)}); }
    setLoading(false);
  };

  const handleOtpChange = (v: string, i: number) => {
    if (v &&!/^\d$/.test(v)) return; // 7. number chiah
    const n = [...otp]; n[i] = v.slice(-1); setOtp(n);
    if (v && i < 5) inputsRef.current[i + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length!== 6) return;
    setLoading(true);
    try { await confirmation.confirm(code); setStep("profile"); } catch { alert("Invalid OTP"); }
    setLoading(false);
  };

  const handleProfileSave = async () => {
    if (!name.trim()) { alert("Enter name"); return; }
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) return;
      let photoURL = "";
      if (pic) {
        const r = ref(storage, `profiles/${user.uid}`);
        await uploadBytes(r, pic);
        photoURL = await getDownloadURL(r);
      }
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        phone: country.code + phone,
        photoURL,
        createdAt: new Date(),
      }, { merge: true });
      router.push("/home");
    } catch (e: any) { alert(e.message); }
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh", background:"white", display:"flex", flexDirection:"column", alignItems:"center", padding:"60px 20px", fontFamily:"system-ui"}}>
      <div id="recaptcha-container"></div>

      <div style={{display:"flex", flexDirection:"column", alignItems:"center", marginBottom:40}}>
        <div style={{width:90, height:90, background:"#7c3aed", borderRadius:28, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14, fontSize:42}}>💬</div>
        <h1 style={{fontSize:38, fontWeight:800, margin:0, letterSpacing:-1}}><span style={{color:"black"}}>Mz</span><span style={{color:"#7c3aed"}}>Apps</span></h1>
      </div>

      {step === "phone" && (
        <div style={{width:"100%", maxWidth:360}}>
          <p style={{fontSize:14, fontWeight:600, marginBottom:8}}>Phone Number</p>
          <div style={{display:"flex", gap:10}}>
            <button onClick={()=>setShowCountry(true)} style={{display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", border:`2px solid #7c3aed`, borderRadius:16, padding:"10px 14px", fontWeight:700, background:"white", minWidth:70}}>
              <div>{country.flag} {country.code}</div><div style={{fontSize:12}}>▼</div>
            </button>
            {/* 1. sirkual pawl ve rawh se - focus in purple */}
            <input
              value={phone}
              onFocus={()=>setIsFocused(true)}
              onBlur={()=>setIsFocused(false)}
              onChange={(e)=>setPhone(e.target.value.replace(/\D/g,""))}
              placeholder="Enter your phone number"
              inputMode="numeric"
              style={{flex:1, border:`2px solid ${isFocused? "#7c3aed" : "#e5e7eb"}`, borderRadius:16, padding:"14px 16px", outline:"none", fontSize:16, transition:"0.2s"}}/>
          </div>

          <button onClick={handleSend} style={{width:"100%", marginTop:22, background:"#7c3aed", color:"white", border:"none", borderRadius:18, padding:"16px", fontSize:17, fontWeight:700}}>{loading?"Sending...":"Send OTP"}</button>
        </div>
      )}

      {step === "otp" && (
        <div style={{width:"100%", maxWidth:360}}>
          <p style={{fontSize:14, fontWeight:700, marginBottom:16}}>Enter OTP sent to {country.code} {phone}</p>
          {/* 6. OTP thui mah mah - te deuh in */}
          <div style={{display:"flex", justifyContent:"center", gap:8, marginBottom:22}}>
            {otp.map((d,i)=><input key={i} ref={(el)=>{inputsRef.current[i]=el}} value={d} onChange={(e)=>handleOtpChange(e.target.value,i)} onKeyDown={(e)=>{if(e.key==="Backspace"&&!otp[i]&&i>0)inputsRef.current[i-1]?.focus()}} maxLength={1} inputMode="numeric" placeholder="0" style={{width:42, height:52, textAlign:"center", fontSize:18, fontWeight:700, border:"2px solid #e5e7eb", borderRadius:12, outline:"none"}}/>)}
          </div>
          <button onClick={handleVerify} style={{width:"100%", background:"#7c3aed", color:"white", border:"none", borderRadius:18, padding:"15px", fontSize:16, fontWeight:700}}>{loading?"Verifying...":"Verify & Continue"}</button>
          {/* 5. Arrow lian */}
          <button onClick={()=>setStep("phone")} style={{width:"100%", marginTop:12, background:"black", color:"white", border:"none", borderRadius:18, padding:"15px", fontSize:15, display:"flex", justifyContent:"center", gap:8, alignItems:"center"}}>
            <span style={{fontSize:22, fontWeight:900}}>←</span> Change phone number
          </button>
        </div>
      )}

      {step === "profile" && (
        <div style={{width:"100%", maxWidth:360, display:"flex", flexDirection:"column", alignItems:"center"}}>
          <p style={{fontWeight:800, fontSize:18, marginBottom:20}}>Setup your profile</p>
          <label style={{width:110, height:110, borderRadius:55, background:"#f3f4f6", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", cursor:"pointer", border:"2px dashed #7c3aed", marginBottom:16}}>
            {picPreview? <img src={picPreview} style={{width:"100%", height:"100%", objectFit:"cover"}}/> : <span style={{fontSize:40}}>📷</span>}
            <input type="file" accept="image/*" hidden onChange={(e)=>{ const f=e.target.files?.[0]; if(f){ setPic(f); setPicPreview(URL.createObjectURL(f)); }}}/>
          </label>
          <p style={{fontSize:13, color:"#666", marginBottom:16}}>Tap to add profile photo</p>
          <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Enter your name" style={{width:"100%", border:"2px solid #e5e7eb", borderRadius:16, padding:"14px 16px", fontSize:16, outline:"none", marginBottom:20}}/>
          <button onClick={handleProfileSave} disabled={loading} style={{width:"100%", background:"#7c3aed", color:"white", border:"none", borderRadius:18, padding:"16px", fontSize:17, fontWeight:700}}>{loading?"Saving...":"Continue to Home"}</button>
        </div>
      )}

      {/* 4. Country popup modal */}
      {showCountry && (
        <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"flex-end", zIndex:50}}>
          <div style={{background:"white", width:"100%", maxHeight:"80vh", borderTopLeftRadius:24, borderTopRightRadius:24, display:"flex", flexDirection:"column"}}>
            <div style={{padding:16, borderBottom:"1px solid #eee"}}>
              <div style={{width:40, height:4, background:"#ddd", borderRadius:2, margin:"0 auto 12px"}}/>
              <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search country..." autoFocus style={{width:"100%", border:"1px solid #ddd", borderRadius:12, padding:"12px 14px", outline:"none"}}/>
            </div>
            <div style={{overflowY:"auto", flex:1}}>
              {filtered.map(c=>(
                <button key={c.name+c.code} onClick={()=>{setCountry(c); setShowCountry(false); setSearch("");}} style={{width:"100%", display:"flex", gap:12, padding:"14px 20px", border:"none", background:"white", textAlign:"left", borderBottom:"1px solid #f5f5f5", fontSize:15}}>
                  <span>{c.flag}</span><b>{c.code}</b><span style={{color:"#555"}}>{c.name}</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setShowCountry(false)} style={{margin:16, background:"black", color:"white", border:"none", borderRadius:14, padding:"14px"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
                                               }

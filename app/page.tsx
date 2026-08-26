"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

const countries = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+95", flag: "🇲🇲", name: "Myanmar" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+1", flag: "🇺🇸", name: "USA" },
  { code: "+44", flag: "🇬🇧", name: "UK" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
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
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
  }, []);

  // Auto focus first OTP box
  useEffect(() => {
    if (step === "otp") {
      inputsRef.current[0]?.focus();
    }
  }, [step]);

  const handleSend = async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const fullPhone = country.code + phone;
      const appVerifier = (window as any).recaptchaVerifier;
      const conf = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
      setConfirmation(conf);
      setStep("otp");
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleOtpChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" &&!otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length!== 6) return;
    setLoading(true);
    try {
      await confirmation.confirm(code);
      router.push("/home"); // 5. Users list ah nilo, Home ah a lut
    } catch (e: any) {
      alert("Invalid OTP");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-6 pt-20">
      <div id="recaptcha-container"></div>

      {/* 1. MzChat nilo in MzApps + Chat icon lian */}
      <div className="flex flex-col items-center mb-12">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl flex items-center justify-center mb-4 shadow-lg shadow-purple-200">
          <span className="text-4xl">💬</span>
        </div>
        <h1 className="text-4xl font-bold">
          <span className="text-black">Mz</span>
          <span className="text-violet-600">Apps</span>
        </h1>
      </div>

      {step === "phone"? (
        <>
          <div className="w-full max-w-sm">
            <p className="text-sm font-semibold mb-2">Phone Number</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCountry(!showCountry)}
                className="flex items-center gap-2 border-2 border-violet-500 rounded-2xl px-4 py-3.5 font-semibold"
              >
                {country.flag} {country.code} <span className="text-xs">▼</span>
              </button>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="7005697815"
                className="flex-1 border border-gray-200 rounded-2xl px-4 py-3.5 outline-none focus:border-violet-500"
              />
            </div>

            {showCountry && (
              <div className="mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden">
                {countries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      setCountry(c);
                      setShowCountry(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-violet-50 text-left"
                  >
                    <span>{c.flag}</span> <b>{c.code}</b> <span className="text-gray-500">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full max-w-sm mt-6 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-4 font-semibold text-lg disabled:opacity-50"
          >
            {loading? "Sending..." : "Send OTP"}
          </button>
        </>
      ) : (
        <>
          <div className="w-full max-w-sm">
            <p className="text-sm font-bold mb-4">Enter OTP sent to {country.code} {phone}</p>

            {/* 2. OTP input | cursor a hmasa ber atanga phei zel */}
            <div className="flex justify-between gap-2 mb-6">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputsRef.current[i] = el; }}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  maxLength={1}
                  className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl focus:border-violet-500 outline-none"
                  placeholder="0"
                />
              ))}
            </div>

            {/* 3. Verify & Continue button pawl */}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-2xl py-4 font-semibold text-lg disabled:opacity-50"
            >
              {loading? "Verifying..." : "Verify & Continue"}
            </button>

            {/* 4. Change phone number button dum */}
            <button
              onClick={() => setStep("phone")}
              className="w-full mt-3 bg-black text-white rounded-2xl py-4 font-medium"
            >
              ← Change phone number
            </button>
          </div>
        </>
      )}
    </div>
  );
}

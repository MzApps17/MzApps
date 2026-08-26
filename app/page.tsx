'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@firebase/config'

const countries = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+95', name: 'Myanmar', flag: '🇲🇲' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+1', name: 'USA', flag: '🇺🇸' },
  { code: '+44', name: 'UK', flag: '🇬🇧' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
]

export default function LoginPage() {
  const router = useRouter()
  const [countryCode, setCountryCode] = useState('+91')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [confirmResult, setConfirmResult] = useState<any>(null)
  const [showCountry, setShowCountry] = useState(false)

  useEffect(() => {
    const uid = localStorage.getItem('mz_uid')
    if (uid) router.replace('/users')
  }, [])

  const setupRecaptcha = () => {
    if (typeof window === 'undefined') return null
    if ((window as any).recaptchaVerifier) {
      try { (window as any).recaptchaVerifier.clear() } catch {}
    }
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
    })
    ;(window as any).recaptchaVerifier = verifier
    return verifier
  }

  const sendOtp = async () => {
    if (phone.length < 6) return alert('Phone number dik lo')
    setLoading(true)
    try {
      const verifier = setupRecaptcha()
      if(!verifier) throw new Error('Recaptcha error')
      const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`
      const result = await signInWithPhoneNumber(auth, fullPhone, verifier)
      setConfirmResult(result)
      setStep('otp')
    } catch (err: any) {
      console.error(err)
      alert('Error: ' + err.message + '\nVercel Env a awm em check rawh!')
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear()
        ;(window as any).recaptchaVerifier = null
      }
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) return alert('OTP 6 digit a ni tur')
    setLoading(true)
    try {
      const res = await confirmResult.confirm(otp)
      const user = res.user
      const fullPhone = `${countryCode}${phone}`

      localStorage.setItem('mz_uid', user.uid)
      localStorage.setItem('mz_phone', fullPhone)

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        phone: fullPhone,
        country: countryCode,
        name: fullPhone,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      }, { merge: true })

      router.replace('/users')
    } catch (err: any) {
      alert('OTP dik lo: ' + err.message)
    }
    setLoading(false)
  }

  const selected = countries.find(c => c.code === countryCode)

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px' }}>
      <div id="recaptcha-container"></div>
      
      <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px' }}>Mz<span style={{ color: '#7C3AED' }}>Chat</span></h1>
      <p style={{ color: '#666', marginTop: '6px', fontSize: '14px' }}>Worldwide login</p>

      <div style={{ width: '90%', maxWidth: '360px', marginTop: '32px' }}>
        {step === 'phone' ? (
          <>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>Phone Number</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setShowCountry(!showCountry)} style={{ height: '48px', minWidth: '98px', border: '1px solid #ddd', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700' }}>
                <span>{selected?.flag}</span> {countryCode} <span style={{ fontSize: '10px' }}>▼</span>
              </button>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))} placeholder="98765 43210" type="tel" style={{ flex: 1, height: '48px', border: '1px solid #ddd', borderRadius: '12px', padding: '0 16px', outline: 'none', fontSize: '16px' }} />
            </div>

            {showCountry && (
              <div style={{ marginTop: '8px', border: '1px solid #eee', borderRadius: '12px', maxHeight: '200px', overflowY: 'auto', background:'#fff' }}>
                {countries.map(c => (
                  <div key={c.code} onClick={() => { setCountryCode(c.code); setShowCountry(false) }} style={{ padding: '12px 14px', display: 'flex', gap: '10px', cursor: 'pointer', background: c.code === countryCode ? '#F5F3FF' : '#fff', borderBottom: '1px solid #f5f5f5' }}>
                    <span>{c.flag}</span><b>{c.code}</b><span style={{ color: '#666' }}>{c.name}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={sendOtp} disabled={loading} style={{ width: '100%', height: '50px', marginTop: '18px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '16px', opacity: loading ? 0.6 : 1, cursor:'pointer' }}>
              {loading ? 'Thawn mek...' : 'OTP Thawn'}
            </button>
            <p style={{ fontSize: '11px', color: '#999', marginTop: '12px', textAlign: 'center' }}>Test phone i hman chuan OTP i set kha hmang rawh<br/>Eg: 123456</p>
          </>
        ) : (
          <>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>OTP Code - {countryCode}{phone}</label>
            <input value={otp} onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ''))} placeholder="6-digit OTP" maxLength={6} style={{ width: '100%', height: '50px', marginTop: '8px', border: '1px solid #ddd', borderRadius: '12px', padding: '0 16px', outline: 'none', fontSize: '20px', letterSpacing: '8px', textAlign: 'center', fontWeight: '800' }} />
            <button onClick={verifyOtp} disabled={loading} style={{ width: '100%', height: '50px', marginTop: '16px', background: '#111', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '16px', cursor:'pointer' }}>
              {loading ? 'Check mek...' : 'Verify & Login'}
            </button>
            <button onClick={() => setStep('phone')} style={{ width: '100%', marginTop: '12px', background: 'transparent', border: 'none', color: '#666', fontSize: '13px' }}>← Number thlak</button>
          </>
        )}
      </div>
    </div>
  )
}

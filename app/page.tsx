'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
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
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const recaptchaRef = useRef<any>(null)

  useEffect(() => {
    const uid = localStorage.getItem('mz_uid')
    if (uid) router.replace('/users')
    if (typeof window !== 'undefined' && !recaptchaRef.current) {
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    }
  }, [])

  const sendOtp = async () => {
    if (phone.length < 7) { setError('Please enter a valid phone number'); return }
    setError(''); setLoading(true)
    try {
      const fullPhone = `${countryCode}${phone.replace(/\s/g, '')}`
      const result = await signInWithPhoneNumber(auth, fullPhone, recaptchaRef.current)
      setConfirmResult(result)
      setStep('otp')
    } catch (err: any) {
      let msg = err.message
      if (msg.includes('operation-not-allowed')) msg = 'SMS region not enabled. Go to Firebase > Auth > Settings > SMS Region Policy and enable India.'
      if (msg.includes('invalid-phone')) msg = 'Invalid phone number format.'
      setError(msg)
      try { recaptchaRef.current?.clear(); recaptchaRef.current = null } catch {}
      recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
    }
    setLoading(false)
  }

  const verifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter 6-digit OTP'); return }
    setError(''); setLoading(true)
    try {
      const res = await confirmResult.confirm(otp)
      const user = res.user
      const fullPhone = `${countryCode}${phone}`
      localStorage.setItem('mz_uid', user.uid)
      localStorage.setItem('mz_phone', fullPhone)
      await setDoc(doc(db, 'users', user.uid), { uid: user.uid, phone: fullPhone, country: countryCode, name: fullPhone, createdAt: serverTimestamp(), lastSeen: serverTimestamp() }, { merge: true })
      router.replace('/users')
    } catch { setError('Invalid OTP. Please try again.') }
    setLoading(false)
  }

  const selected = countries.find(c => c.code === countryCode)

  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '70px' }}>
      <div id="recaptcha-container"></div>

      <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px' }}>Mz<span style={{ color: '#7C3AED' }}>Chat</span></h1>
      <p style={{ color: '#888', marginTop: '6px', fontSize: '14px' }}>Worldwide login</p>

      <div style={{ width: '90%', maxWidth: '380px', marginTop: '36px' }}>
        {/* Error box - mawi deuh */}
        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', padding: '12px 14px', borderRadius: '12px', fontSize: '13px', marginBottom: '16px', lineHeight: '1.4' }}>
            {error}
          </div>
        )}

        {step === 'phone' ? (
          <>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#222' }}>Phone Number</label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setShowCountry(!showCountry)} style={{ height: '50px', minWidth: '102px', border: `1.5px solid ${showCountry ? '#7C3AED' : '#E5E7EB'}`, borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: '700', cursor:'pointer' }}>
                <span>{selected?.flag}</span> {countryCode} <span style={{ fontSize: '10px' }}>▼</span>
              </button>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
                  placeholder="Enter phone number"
                  type="tel"
                  style={{ width: '100%', height: '50px', border: `1.5px solid ${focused ? '#7C3AED' : '#E5E7EB'}`, borderRadius: '12px', padding: '0 16px', outline: 'none', fontSize: '16px', transition:'0.2s', boxShadow: focused ? '0 0 0 3px #F5F3FF' : 'none' }}
                />
                {focused && phone.length > 0 && (
                  <div style={{ position: 'absolute', right: '12px', top: '16px', width: '18px', height: '18px', border: '2px solid #E5E7EB', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }}></div>
                )}
              </div>
            </div>

            {showCountry && (
              <div style={{ marginTop: '10px', border: '1px solid #eee', borderRadius: '12px', maxHeight: '220px', overflowY: 'auto', background:'#fff', boxShadow:'0 10px 30px rgba(0,0,0,0.08)' }}>
                {countries.map(c => (
                  <div key={c.code} onClick={() => { setCountryCode(c.code); setShowCountry(false) }} style={{ padding: '13px 14px', display: 'flex', gap: '10px', cursor: 'pointer', background: c.code === countryCode ? '#F5F3FF' : '#fff' }}>
                    <span>{c.flag}</span><b>{c.code}</b><span style={{ color: '#666' }}>{c.name}</span>
                  </div>
                ))}
              </div>
            )}

            <button onClick={sendOtp} disabled={loading} style={{ width: '100%', height: '52px', marginTop: '20px', background: '#7C3AED', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', opacity: loading?0.8:1 }}>
              {loading ? <><div style={{ width:'18px', height:'18px', border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></div> Sending OTP...</> : 'Send OTP'}
            </button>
          </>
        ) : (
          <>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Enter OTP sent to {countryCode} {phone}</label>
            <input value={otp} onChange={e => { setOtp(e.target.value.replace(/[^0-9]/g, '')); setError('') }} placeholder="000000" maxLength={6} style={{ width: '100%', height: '54px', marginTop: '8px', border: '1.5px solid #E5E7EB', borderRadius: '12px', padding: '0 16px', outline: 'none', fontSize: '22px', letterSpacing: '10px', textAlign: 'center', fontWeight: '800' }} />
            <button onClick={verifyOtp} disabled={loading} style={{ width: '100%', height: '52px', marginTop: '16px', background: '#111', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '700', fontSize: '15px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px' }}>
              {loading ? <><div style={{ width:'18px', height:'18px', border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}></div> Verifying...</> : 'Verify & Continue'}
            </button>
            <button onClick={() => { setStep('phone'); setError('') }} style={{ width: '100%', marginTop: '12px', background: 'transparent', border: 'none', color: '#666', fontSize: '13px', cursor:'pointer' }}>← Change number</button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .grecaptcha-badge { visibility: hidden !important; }
      `}</style>
    </div>
  )
            }

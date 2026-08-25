'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=phone, 2=otp, 3=name
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')

  return (
    <div style={{
      minHeight:'100vh', background:'#fff',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      padding:'20px'
    }}>
      <h1 style={{fontWeight:'900', fontSize:'32px', marginBottom:'5px'}}>MzApps</h1>
      <p style={{fontWeight:'700', color:'#999', marginBottom:'30px'}}>Mizo Social App</p>

      <div style={{
        width:'100%', maxWidth:'340px',
        border:'2px solid #eee', borderRadius:'20px',
        padding:'24px', background:'#fff'
      }}>
        {step === 1 && (
          <>
            <div style={{fontWeight:'900', fontSize:'18px', marginBottom:'12px'}}>Phone Number chhu lut rawh</div>
            <input
              value={phone}
              onChange={e=>setPhone(e.target.value)}
              placeholder="9862XXXXXX"
              type="tel"
              style={{width:'100%', padding:'14px', borderRadius:'12px', border:'2px solid #111', fontWeight:'800', fontSize:'16px', outline:'none'}}
            />
            <button
              onClick={()=> phone.length >= 10 && setStep(2)}
              style={{width:'100%', marginTop:'16px', padding:'14px', borderRadius:'12px', background:'#111', color:'#fff', fontWeight:'900', fontSize:'15px', border:'none'}}
            >
              OTP Thawn rawh
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{fontWeight:'900', fontSize:'18px', marginBottom:'5px'}}>OTP chhu lut rawh</div>
            <div style={{fontWeight:'700', fontSize:'12px', color:'#999', marginBottom:'12px'}}>{phone} ah thawn a ni</div>
            <input
              value={otp}
              onChange={e=>setOtp(e.target.value)}
              placeholder="123456"
              style={{width:'100%', padding:'14px', borderRadius:'12px', border:'2px solid #111', fontWeight:'800', fontSize:'18px', letterSpacing:'4px', textAlign:'center', outline:'none'}}
            />
            <button
              onClick={()=> otp.length >= 4 && setStep(3)}
              style={{width:'100%', marginTop:'16px', padding:'14px', borderRadius:'12px', background:'#111', color:'#fff', fontWeight:'900', fontSize:'15px', border:'none'}}
            >
              Verify
            </button>
            <button onClick={()=>setStep(1)} style={{width:'100%', marginTop:'10px', background:'none', border:'none', fontWeight:'800', color:'#999'}}>Back</button>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{fontWeight:'900', fontSize:'18px', marginBottom:'12px'}}>I hming leh thlalak</div>
            <input
              value={name}
              onChange={e=>setName(e.target.value)}
              placeholder="I hming"
              style={{width:'100%', padding:'14px', borderRadius:'12px', border:'2px solid #111', fontWeight:'800', fontSize:'16px', outline:'none', marginBottom:'12px'}}
            />
            <div style={{width:'80px', height:'80px', borderRadius:'50%', background:'#f0f0f0', margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'30px', border:'2px dashed #999'}}>📷</div>
            <button
              onClick={()=> {
                if(name.length >=2){
                  localStorage.setItem('mz_user', name)
                  router.push('/home')
                }
              }}
              style={{width:'100%', padding:'14px', borderRadius:'12px', background:'#25D366', color:'#fff', fontWeight:'900', fontSize:'16px', border:'none'}}
            >
              HOME LUT RAWH
            </button>
          </>
        )}
      </div>

      <div style={{marginTop:'20px', fontWeight:'700', fontSize:'11px', color:'#bbb'}}>No Signup • No Password • OTP chauh</div>
    </div>
  )
                }

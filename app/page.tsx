'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [name, setName] = useState('')
  const [pic, setPic] = useState<string>('')
  const [checking, setChecking] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  // LOGIN TAWN CHUAN HOME AH AUTO LUT
  useEffect(()=>{
    const savedUser = localStorage.getItem('mz_user')
    if(savedUser){
      // Online leh ang
      localStorage.setItem('mz_online', 'true')
      localStorage.setItem('mz_lastSeen', new Date().toISOString())
      router.replace('/home')
    } else {
      setChecking(false)
    }

    // APP CLOSE CHUAN OFFLINE ANGIIN AWM - WHATSAPP ANG
    const goOffline = () => {
      localStorage.setItem('mz_online', 'false')
      localStorage.setItem('mz_lastSeen', new Date().toISOString())
    }
    const goOnline = () => {
      if(localStorage.getItem('mz_user')){
        localStorage.setItem('mz_online', 'true')
      }
    }

    window.addEventListener('beforeunload', goOffline)
    document.addEventListener('visibilitychange', ()=>{
      if(document.hidden) goOffline()
      else goOnline()
    })

    return ()=>{
      window.removeEventListener('beforeunload', goOffline)
    }
  },[])

  const handlePic = (e:any) => {
    const file = e.target.files[0]
    if(!file) return
    const reader = new FileReader()
    reader.onload = () => setPic(reader.result as string)
    reader.readAsDataURL(file)
  }

  if(checking){
    return <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900'}}>Loading MzApps...</div>
  }

  return (
    <div style={{minHeight:'100vh', background:'#FAFAFA', display:'flex', flexDirection:'column', alignItems:'center', padding:'30px 20px'}}>
      <div style={{textAlign:'center', marginTop:'40px', marginBottom:'20px'}}>
        <div style={{fontSize:'50px'}}>💬</div>
        <h1 style={{fontWeight:'900', fontSize:'32px', margin:'5px 0', letterSpacing:'-1px'}}>MzApps</h1>
        <p style={{fontWeight:'700', color:'#999', fontSize:'14px', letterSpacing:'1px'}}>MIZO SOCIAL APP</p>
      </div>

      <div style={{width:'100%', maxWidth:'360px', background:'#fff', borderRadius:'28px', padding:'28px', boxShadow:'0 10px 40px rgba(0,0,0,0.08)', border:'1px solid #f0f0f0'}}>

        <div style={{display:'flex', gap:'8px', marginBottom:'24px'}}>
          <div style={{flex:1, height:'4px', borderRadius:'10px', background: step>=1? '#111' : '#eee'}}></div>
          <div style={{flex:1, height:'4px', borderRadius:'10px', background: step>=2? '#111' : '#eee'}}></div>
          <div style={{flex:1, height:'4px', borderRadius:'10px', background: step>=3? '#111' : '#eee'}}></div>
        </div>

        {step === 1 && (
          <>
            <div style={{fontWeight:'900', fontSize:'20px'}}>Phone Number</div>
            <div style={{fontWeight:'600', fontSize:'13px', color:'#888', marginBottom:'16px'}}>OTP kan rawn thawn ang che</div>
            <div style={{display:'flex', alignItems:'center', border:'2.5px solid #111', borderRadius:'16px', padding:'4px 14px'}}>
              <span style={{fontWeight:'900', fontSize:'16px'}}>+91</span>
              <input value={phone} onChange={e=>setPhone(e.target.value.replace(/\D/g,''))} placeholder="9862 123 456" type="tel" maxLength={10} style={{flex:1, border:'none', padding:'14px 10px', fontWeight:'800', fontSize:'18px', outline:'none'}} />
            </div>
            <button onClick={()=> phone.length===10 && setStep(2)} disabled={phone.length!==10} style={{width:'100%', marginTop:'18px', padding:'16px', borderRadius:'16px', background: phone.length===10? '#111' : '#ccc', color:'#fff', fontWeight:'900', fontSize:'15px', border:'none'}}>GET OTP ➔</button>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{fontWeight:'900', fontSize:'20px'}}>OTP Code</div>
            <div style={{fontWeight:'600', fontSize:'13px', color:'#888', marginBottom:'16px'}}>{phone} ah kan thawn e</div>
            <input value={otp} onChange={e=>setOtp(e.target.value.replace(/\D/g,''))} placeholder="• • • • • •" maxLength={6} style={{width:'100%', padding:'16px', borderRadius:'16px', border:'2.5px solid #111', fontWeight:'900', fontSize:'22px', letterSpacing:'8px', textAlign:'center', outline:'none'}} />
            <button onClick={()=> otp.length>=4 && setStep(3)} disabled={otp.length<4} style={{width:'100%', marginTop:'18px', padding:'16px', borderRadius:'16px', background: otp.length>=4? '#111' : '#ccc', color:'#fff', fontWeight:'900', fontSize:'15px', border:'none'}}>VERIFY OTP ✓</button>
            <button onClick={()=>setStep(1)} style={{width:'100%', marginTop:'10px', background:'none', border:'none', fontWeight:'800', color:'#999', fontSize:'13px'}}>← Phone thlak</button>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{fontWeight:'900', fontSize:'20px', textAlign:'center'}}>Profile Siam rawh</div>
            <div style={{fontWeight:'600', fontSize:'13px', color:'#888', marginBottom:'20px', textAlign:'center'}}>I hming leh thlalak a lang nghal ang</div>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="I hming (eg: Nghaka)" style={{width:'100%', padding:'14px 16px', borderRadius:'16px', border:'2.5px solid #111', fontWeight:'800', fontSize:'16px', outline:'none', marginBottom:'18px'}} />
            <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
              <div onClick={()=>fileRef.current?.click()} style={{width:'110px', height:'110px', borderRadius:'50%', background: pic? `url(${pic}) center/cover` : '#f5f5f5', border: pic? '3px solid #111' : '2.5px dashed #bbb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'36px', cursor:'pointer', position:'relative'}}>
                {!pic && '📷'}
                <div style={{position:'absolute', bottom:'0', right:'0', background:'#111', color:'#fff', width:'32px', height:'32px', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', border:'2px solid #fff'}}>✎</div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePic} style={{display:'none'}} />
              {name && (
                <div style={{marginTop:'16px', padding:'10px 20px', background:'#f5f5f5', borderRadius:'20px', display:'flex', alignItems:'center', gap:'10px'}}>
                  <div style={{width:'32px', height:'32px', borderRadius:'50%', background: pic? `url(${pic}) center/cover` : '#ddd'}}></div>
                  <div><div style={{fontWeight:'900', fontSize:'14px'}}>{name}</div><div style={{fontWeight:'700', fontSize:'11px', color:'#25D366'}}>● Online nghal ang</div></div>
                </div>
              )}
            </div>
            <button onClick={()=> {
                if(name.length>=2){
                  localStorage.setItem('mz_user', name)
                  if(pic) localStorage.setItem('mz_pic', pic)
                  localStorage.setItem('mz_online', 'true')
                  localStorage.setItem('mz_lastSeen', new Date().toISOString())
                  router.push('/home')
                }
              }} disabled={name.length<2} style={{width:'100%', marginTop:'22px', padding:'16px', borderRadius:'16px', background: name.length>=2? '#25D366' : '#ccc', color:'#fff', fontWeight:'900', fontSize:'16px', border:'none'}}>
              HOME LUT RAWH 🚀
            </button>
          </>
        )}
      </div>
    </div>
  )
}

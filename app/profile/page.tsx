'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage(){
  const router = useRouter()
  const [name,setName]=useState('Mizo')
  const [pic,setPic]=useState('')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    // Key hrang hrang check - eng key pawh nise a hmu ang
    const userStr = localStorage.getItem('mz_user') ||
                    localStorage.getItem('user') ||
                    localStorage.getItem('mz_user_email') ||
                    localStorage.getItem('mz_user_name')

    const p = localStorage.getItem('mz_pic') || localStorage.getItem('photoURL') || localStorage.getItem('mz_user_pic')

    // JSON a nih chuan parse
    let finalName = userStr
    try {
      if(userStr && userStr.includes('{')) {
        const parsed = JSON.parse(userStr)
        finalName = parsed.displayName || parsed.name || parsed.email || 'Mizo'
      }
    } catch {}

    if(finalName) setName(finalName)
    if(p) setPic(p)

    setLoading(false)

    // IMPORTANT: Redirect ti lo - i sawi ang khan login loh chuan profile a hmu lo ang
    // Chuvangin hetah redirect a ngai lo!
    // if(!n) router.replace('/') <- HEI HI DELETE!
  },[])

  if(loading) return <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>Loading...</div>

  return <div style={{minHeight:'100vh', background:'#FAFAFA', paddingBottom:'100px'}}>
    <div style={{height:'140px', background:'#7C3AED'}}></div>
    <div style={{margin:'-50px 16px 0', background:'#fff', borderRadius:'20px', padding:'20px', border:'2px solid #111', textAlign:'center'}}>
      <div style={{width:'80px', height:'80px', borderRadius:'50%', background: pic?`url(${pic}) center/cover`:'#111', margin:'0 auto', border:'3px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'900', fontSize:'28px'}}>{!pic && name[0]?.toUpperCase()}</div>
      <div style={{fontWeight:'900', fontSize:'20px', marginTop:'10px'}}>{name}</div>
      <div style={{color:'#7C3AED', fontWeight:'900', fontSize:'12px', background:'#F3E8FF', display:'inline-block', padding:'4px 12px', borderRadius:'20px', marginTop:'6px'}}>● ONLINE</div>
      <button onClick={()=>{
        localStorage.setItem('mz_online','false');
        localStorage.removeItem('mz_user');
        localStorage.removeItem('user');
        localStorage.removeItem('mz_user_email');
        router.push('/')
      }} style={{width:'100%', marginTop:'16px', padding:'12px', borderRadius:'12px', background:'#111', color:'#fff', fontWeight:'900', border:'none'}}>LOGOUT</button>
    </div>
  </div>
}

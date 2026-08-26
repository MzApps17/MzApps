'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ViewProfile(){
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  useEffect(()=>{
    const u = localStorage.getItem('mz_view_user')
    if(u) setUser(JSON.parse(u))
  },[])
  if(!user) return <div style={{padding:'20px'}}>Loading...</div>
  return (
    <div style={{padding:'20px', paddingBottom:'90px'}}>
      <button onClick={()=>router.back()} style={{width:'44px', height:'44px', borderRadius:'12px', border:'1px solid #eee', background:'#fff', fontSize:'20px', fontWeight:'900'}}>←</button>
      <div style={{textAlign:'center', marginTop:'30px'}}>
        <img src={user.pic} style={{width:'100px', height:'100px', borderRadius:'50%'}} />
        <div style={{fontWeight:'900', fontSize:'22px', marginTop:'14px'}}>{user.name}</div>
        <div style={{color:'#888'}}>{user.bio}</div>
      </div>
    </div>
  )
}

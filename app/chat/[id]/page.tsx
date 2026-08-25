'use client'
import { useRouter, useParams } from 'next/navigation'
export default function ChatRoom(){
  const router = useRouter()
  const params = useParams()
  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', background:'#FAFAFA'}}>
      <div style={{padding:'12px 16px', background:'#fff', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:'12px'}}>
        <button onClick={()=>router.back()} style={{border:'none', background:'#f5f5f5', width:'36px', height:'36px', borderRadius:'10px', fontWeight:'900'}}>←</button>
        <div style={{fontWeight:'900'}}>Chat {params.id}</div>
      </div>
      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'800', color:'#999'}}>Chat la in be tan ang!</div>
      <div style={{padding:'12px', background:'#fff', display:'flex', gap:'8px', borderTop:'1px solid #eee'}}>
        <input placeholder="Message type rawh..." style={{flex:1, padding:'12px 14px', borderRadius:'20px', border:'2px solid #111', fontWeight:'700', outline:'none'}} />
        <button style={{width:'44px', height:'44px', borderRadius:'50%', background:'#7C3AED', color:'#fff', border:'none', fontWeight:'900'}}>➤</button>
      </div>
    </div>
  )
}

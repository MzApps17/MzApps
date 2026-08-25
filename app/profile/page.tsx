'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
export default function ProfilePage(){
  const router = useRouter()
  const [name,setName]=useState('Mizo')
  const [pic,setPic]=useState('')
  useEffect(()=>{
    const n=localStorage.getItem('mz_user')
    const p=localStorage.getItem('mz_pic')
    if(n) setName(n)
    if(p) setPic(p)
    if(!n) router.replace('/')
  },[])
  return <div style={{minHeight:'100vh', background:'#FAFAFA', paddingBottom:'100px'}}>
    <div style={{height:'140px', background:'#7C3AED'}}></div>
    <div style={{margin:'-50px 16px 0', background:'#fff', borderRadius:'20px', padding:'20px', border:'2px solid #111', textAlign:'center'}}>
      <div style={{width:'80px', height:'80px', borderRadius:'50%', background: pic?`url(${pic}) center/cover`:'#111', margin:'0 auto', border:'3px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:'900', fontSize:'28px'}}>{!pic && name[0]}</div>
      <div style={{fontWeight:'900', fontSize:'20px', marginTop:'10px'}}>{name}</div>
      <div style={{color:'#7C3AED', fontWeight:'900', fontSize:'12px', background:'#F3E8FF', display:'inline-block', padding:'4px 12px', borderRadius:'20px', marginTop:'6px'}}>● ONLINE</div>
      <button onClick={()=>{localStorage.setItem('mz_online','false'); localStorage.removeItem('mz_user'); router.push('/')}} style={{width:'100%', marginTop:'16px', padding:'12px', borderRadius:'12px', background:'#111', color:'#fff', fontWeight:'900', border:'none'}}>LOGOUT</button>
    </div>
  </div>
}

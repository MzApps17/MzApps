'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [name, setName] = useState('Nghaka')
  const [pic, setPic] = useState('')
  const [bio, setBio] = useState('Mizo nula/duhpa ka zawng e 😍 | Aizawl')
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBio, setNewBio] = useState('')

  useEffect(()=>{
    const n = localStorage.getItem('mz_user')
    const p = localStorage.getItem('mz_pic')
    if(n) { setName(n); setNewName(n) }
    if(p) setPic(p)
    const b = localStorage.getItem('mz_bio')
    if(b) { setBio(b); setNewBio(b) }
    if(!n) router.replace('/')
    else {
      localStorage.setItem('mz_online','true')
    }
  },[])

  const save = () => {
    localStorage.setItem('mz_user', newName)
    localStorage.setItem('mz_bio', newBio)
    setName(newName)
    setBio(newBio)
    setEditing(false)
  }

  const logout = () => {
    localStorage.setItem('mz_online', 'false')
    localStorage.setItem('mz_lastSeen', new Date().toISOString())
    setTimeout(()=>{
      localStorage.removeItem('mz_user')
      localStorage.removeItem('mz_pic')
      router.push('/')
    },300)
  }

  return (
    <div style={{minHeight:'100vh', background:'#FAFAFA', paddingBottom:'90px'}}>
      <div style={{height:'160px', background:'linear-gradient(135deg,#111 0%, #444 100%)'}}></div>
      <div style={{margin:'-60px 16px 0', background:'#fff', borderRadius:'24px', padding:'20px', boxShadow:'0 8px 30px rgba(0,0,0,0.08)', border:'2px solid #111', textAlign:'center'}}>
        <div style={{display:'flex', justifyContent:'center'}}>
          <div style={{width:'96px', height:'96px', borderRadius:'50%', background: pic? `url(${pic}) center/cover` : '#111', border:'4px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', color:'#fff', fontWeight:'900'}}>
            {!pic && name[0]?.toUpperCase()}
          </div>
        </div>
        <div style={{marginTop:'12px', fontWeight:'900', fontSize:'22px'}}>{name}</div>
        <div style={{fontWeight:'700', fontSize:'13px', color:'#999'}}>@{name.toLowerCase().replace(/\s/g,'')}_mz • 🟢 Online</div>
        <div style={{fontWeight:'600', fontSize:'14px', color:'#444', marginTop:'10px'}}>{bio}</div>
        <div style={{display:'flex', gap:'10px', marginTop:'16px'}}>
          <button onClick={()=>setEditing(!editing)} style={{flex:1, padding:'12px', borderRadius:'12px', border:'2px solid #111', background:'#fff', fontWeight:'900', fontSize:'13px'}}>✏️ EDIT</button>
          <button onClick={logout} style={{flex:1, padding:'12px', borderRadius:'12px', border:'none', background:'#FFEBEE', color:'#E53935', fontWeight:'900', fontSize:'13px'}}>🚪 LOGOUT</button>
        </div>
        {editing && (
          <div style={{marginTop:'16px', textAlign:'left', background:'#f9f9f9', padding:'14px', borderRadius:'14px', border:'2px solid #111'}}>
            <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Hming thar" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'2px solid #111', fontWeight:'800', marginBottom:'8px'}} />
            <input value={newBio} onChange={e=>setNewBio(e.target.value)} placeholder="Bio thar" style={{width:'100%', padding:'12px', borderRadius:'10px', border:'2px solid #111', fontWeight:'700', marginBottom:'10px'}} />
            <button onClick={save} style={{width:'100%', padding:'12px', borderRadius:'10px', background:'#111', color:'#fff', fontWeight:'900', border:'none'}}>SAVE ✓</button>
          </div>
        )}
      </div>
      <div style={{padding:'16px', fontWeight:'900'}}>My Posts</div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'2px'}}>
        {[1,2,3,4,5,6].map(i=>(<div key={i} style={{aspectRatio:'1', background:`url(https://picsum.photos/300/300?random=${i+10}) center/cover`}}></div>))}
      </div>
    </div>
  )
}

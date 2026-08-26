'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/app/firebase/config'
import { doc, getDoc } from 'firebase/firestore'

export default function ProfilePage(){
  const router = useRouter()
  const [name,setName]=useState('Mizo User')
  const [email,setEmail]=useState('')
  const [pic,setPic]=useState('')
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    const fetchProfile = async()=>{
      // 1. Local atangin la hmasa - CHAK
      const localName = localStorage.getItem('mz_user_name') || localStorage.getItem('mz_name')
      const localEmail = localStorage.getItem('mz_user_email') || localStorage.getItem('mz_user') || localStorage.getItem('user')
      const localPic = localStorage.getItem('mz_pic') || localStorage.getItem('photoURL') || localStorage.getItem('mz_user_pic')

      if(localName) setName(localName)
      if(localEmail) setEmail(localEmail)
      if(localPic) setPic(localPic)

      // 2. Firebase atangin hming dik tak la
      try{
        const uid = auth.currentUser?.uid
        if(uid){
          const snap = await getDoc(doc(db,"users",uid))
          if(snap.exists()){
            const data = snap.data()
            if(data.name) {
              setName(data.name)
              localStorage.setItem('mz_user_name', data.name)
            }
            if(data.email) setEmail(data.email)
            if(data.photoURL) {
              setPic(data.photoURL)
              localStorage.setItem('mz_pic', data.photoURL)
            }
          }
        }
      }catch{}
      setLoading(false)
    }
    fetchProfile()
  },[])

  if(loading) return <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}>Loading...</div>

  return <div style={{minHeight:'100vh', background:'#fff', paddingBottom:'90px'}}>
    {/* HEADER - Instagram ang */}
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #efefef', position:'sticky', top:0, background:'#fff', zIndex:10}}>
      <div style={{display:'flex', alignItems:'center', gap:'6px'}}>
        <span style={{fontWeight:'800', fontSize:'20px'}}>{name.toLowerCase().replace(/\s+/g,'_')}</span>
        <span style={{color:'#7C3AED'}}>▼</span>
      </div>
      <div style={{display:'flex', gap:'16px', fontSize:'22px'}}>
        <span>⊕</span>
        <span>☰</span>
      </div>
    </div>

    {/* PROFILE INFO */}
    <div style={{padding:'16px'}}>
      <div style={{display:'flex', gap:'20px', alignItems:'center'}}>
        {/* PIC - Story ring ang */}
        <div style={{position:'relative'}}>
          <div style={{width:'86px', height:'86px', borderRadius:'50%', padding:'3px', background:'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)'}}>
            <div style={{width:'100%', height:'100%', borderRadius:'50%', background:'#fff', padding:'3px'}}>
              <div style={{width:'100%', height:'100%', borderRadius:'50%', background: pic?`url(${pic}) center/cover`:'#eee', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'28px'}}>
                {!pic && name[0]?.toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{position:'absolute', bottom:'0', right:'0', width:'22px', height:'22px', background:'#7C3AED', borderRadius:'50%', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:'14px', fontWeight:'900'}}>+</div>
        </div>

        {/* STATS - Instagram ang */}
        <div style={{flex:1, display:'flex', justifyContent:'space-around', textAlign:'center'}}>
          <div><div style={{fontWeight:'800', fontSize:'18px'}}>0</div><div style={{fontSize:'14px'}}>Posts</div></div>
          <div><div style={{fontWeight:'800', fontSize:'18px'}}>0</div><div style={{fontSize:'14px'}}>Followers</div></div>
          <div><div style={{fontWeight:'800', fontSize:'18px'}}>0</div><div style={{fontSize:'14px'}}>Following</div></div>
        </div>
      </div>

      {/* NAME & BIO - Email nilo Hming */}
      <div style={{marginTop:'14px'}}>
        <div style={{fontWeight:'700', fontSize:'15px'}}>{name}</div>
        <div style={{fontSize:'14px', color:'#666', marginTop:'2px'}}>💬 MzApps User</div>
        <div style={{fontSize:'14px', marginTop:'2px'}}>{email}</div>
        <div style={{marginTop:'6px', display:'flex', alignItems:'center', gap:'6px'}}>
          <span style={{background:'#F3E8FF', color:'#7C3AED', fontSize:'11px', fontWeight:'800', padding:'3px 10px', borderRadius:'20px'}}>● ONLINE</span>
        </div>
      </div>

      {/* BUTTONS */}
      <div style={{display:'flex', gap:'8px', marginTop:'14px'}}>
        <button style={{flex:1, padding:'7px', borderRadius:'8px', background:'#efefef', border:'none', fontWeight:'700', fontSize:'14px'}}>Edit profile</button>
        <button style={{flex:1, padding:'7px', borderRadius:'8px', background:'#efefef', border:'none', fontWeight:'700', fontSize:'14px'}}>Share profile</button>
      </div>
    </div>

    {/* POSTS GRID - Instagram ang */}
    <div style={{borderTop:'1px solid #efefef'}}>
      <div style={{display:'flex', justifyContent:'space-around', padding:'10px 0'}}>
        <span style={{fontSize:'20px', borderBottom:'1px solid #000', paddingBottom:'4px'}}>⊞</span>
        <span style={{fontSize:'20px', opacity:0.3}}>▶</span>
        <span style={{fontSize:'20px', opacity:0.3}}>👤</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'2px'}}>
        {[1,2,3,4,5,6].map(i=>(
          <div key={i} style={{aspectRatio:'1', background:'#f5f5f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px'}}>🖼️</div>
        ))}
      </div>
    </div>

    {/* LOGOUT - Hnuai ah */}
    <div style={{padding:'16px'}}>
      <button onClick={()=>{
        localStorage.setItem('mz_online','false');
        localStorage.setItem('mz_logged_out','true');
        localStorage.removeItem('mz_user');
        localStorage.removeItem('user');
        router.push('/')
      }} style={{width:'100%', padding:'12px', borderRadius:'12px', background:'#111', color:'#fff', fontWeight:'900', border:'none'}}>LOGOUT</button>
    </div>
  </div>
            }

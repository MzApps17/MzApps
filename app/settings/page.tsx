'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../components/ThemeProvider'
import { auth, db } from '@/app/firebase/config'
import { collection, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore'

export default function SettingsPage(){
  const router = useRouter()
  const { darkMode, setDarkMode, fontSize, setFontSize } = useTheme()
  const [blocked, setBlocked] = useState<any[]>([])
  const [showBlocked, setShowBlocked] = useState(false)

  useEffect(()=>{
    const loadBlocked = async()=>{
      const uid = auth.currentUser?.uid
      if(!uid) return
      try{
        const q = query(collection(db, "blocks"), where("uid","==",uid))
        const snap = await getDocs(q)
        setBlocked(snap.docs.map(d=>d.data()))
      }catch{}
    }
    loadBlocked()
  },[])

  const bg = darkMode? '#0a0a0a' : '#ffffff'
  const bg2 = darkMode? '#1a1a1a' : '#ffffff'
  const border = darkMode? '#2a2a2a' : '#f0f0f0'
  const text = darkMode? '#ffffff' : '#111111'
  const subText = darkMode? '#999' : '#666'

  // Arrow LIAN - Meta AI / Instagram / WhatsApp style - BOLD
  const ArrowRight = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B0B0B0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  )

  const ArrowLeft = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={text} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  )

  const Item = ({icon, label, right, onClick, danger=false}: any) => (
    <div onClick={onClick} style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'12px 14px',
      background:bg2,
      borderBottom:`1px solid ${border}`,
      cursor:'pointer'
    }}>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <div style={{width:28, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center'}}>
          {icon}
        </div>
        <span style={{fontWeight:700, fontSize:15.5, color: danger? '#ff3b30' : text}}>{label}</span>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        {right}
        <ArrowRight />
      </div>
    </div>
  )

  return <div style={{minHeight:'100vh', background:bg, color:text, paddingBottom:20}}>
    <div style={{display:'flex', alignItems:'center', gap:12, padding:'10px 12px', borderBottom:`1px solid ${border}`, background:bg2, position:'sticky', top:0, zIndex:10}}>
      <button onClick={()=>router.back()} style={{background:'none', border:'none', color:text, cursor:'pointer', padding:'2px 4px', display:'flex', alignItems:'center'}}>
        <ArrowLeft />
      </button>
      <span style={{fontWeight:800, fontSize:18}}>Settings</span>
    </div>

    <div style={{marginTop:4}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:bg2, borderBottom:`1px solid ${border}`}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{width:28, height:28, borderRadius:8, background:'#FFCC00', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15}}>🌙</div>
          <span style={{fontWeight:700, fontSize:15.5}}>Dark mode</span>
        </div>
        <label style={{position:'relative', display:'inline-block', width:44, height:26}}>
          <input type="checkbox" checked={darkMode} onChange={e=>setDarkMode(e.target.checked)} style={{opacity:0, width:0, height:0}}/>
          <span style={{position:'absolute', cursor:'pointer', inset:0, background: darkMode? '#7C3AED' : '#ccc', borderRadius:20, transition:'0.2s'}}></span>
          <span style={{position:'absolute', height:20, width:20, left:3, bottom:3, background:'#fff', borderRadius:'50%', transition:'0.2s', transform: darkMode? 'translateX(18px)' : 'none'}}></span>
        </label>
      </div>

      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:bg2, borderBottom:`1px solid ${border}`}}>
        <div style={{display:'flex', alignItems:'center', gap:12}}>
          <div style={{width:28, height:28, borderRadius:8, background:'#E5E5EA', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:900}}>Aa</div>
          <span style={{fontWeight:700, fontSize:15.5}}>Font size</span>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <select value={fontSize} onChange={e=>setFontSize(Number(e.target.value))} style={{padding:'6px 10px', borderRadius:10, border:`1px solid ${border}`, background:bg2, color:text, fontWeight:600, fontSize:14}}>
            <option value={14}>Small</option>
            <option value={16}>Medium</option>
            <option value={18}>Large</option>
            <option value={20}>Extra Large</option>
          </select>
          <ArrowRight />
        </div>
      </div>

      <Item 
        icon={<span style={{width:28, height:28, borderRadius:8, background:'#FF3B30', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:14}}>🚫</span>}
        label={`Block List (${blocked.length})`}
        onClick={()=>setShowBlocked(!showBlocked)}
      />

      <Item 
        icon={<span style={{width:28, height:28, borderRadius:8, background:'#007AFF', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff'}}>✉️</span>}
        label="Change email"
        onClick={()=>router.push('/change-email')}
      />

      <Item 
        icon={<span style={{width:28, height:28, borderRadius:8, background:'#FF3B30', display:'flex', alignItems:'center', justifyContent:'center'}}>🗑️</span>}
        label="Delete account"
        danger
        onClick={async()=>{ if(confirm('Delete account?')){} }}
      />
    </div>

    {showBlocked && (
      <div style={{marginTop:16, background:bg2, borderTop:`1px solid ${border}`}}>
        <div style={{padding:'14px 14px 8px', fontWeight:800, fontSize:17}}>Blocked Users</div>
        {blocked.length===0 ? (
          <div style={{padding:'10px 14px 20px', color:subText, fontSize:14}}>No blocked users</div>
        ) : (
          blocked.map((u,i)=>(
            <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:`1px solid ${border}`}}>
              <span style={{fontWeight:600, fontSize:14}}>{u.blockedName || u.blockedId}</span>
              <button onClick={async()=>{
                const uid = auth.currentUser?.uid
                if(!uid) return
                await deleteDoc(doc(db, "blocks", `${uid}_${u.blockedId}`))
                setBlocked(b=>b.filter((_,idx)=>idx!==i))
              }} style={{background:'#ff3b30', color:'#fff', border:'none', borderRadius:8, padding:'5px 12px', fontWeight:700, fontSize:13}}>Unblock</button>
            </div>
          ))
        )}
      </div>
    )}
  </div>
                  }

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../components/ThemeProvider'
import { auth, db } from '@/app/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

interface User {
  id: string
  uid?: string
  name: string
  bio?: string
  email?: string
  photoURL?: string
  village?: string
}

export default function UserListPage() {
  const router = useRouter()
  const { theme, fontSize } = useTheme() as any
  const [search, setSearch] = useState('')
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  const [isFocused, setIsFocused] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // FIX: fontSize number emaw string emaw nise a thawk
  const getSize = (base: number) => {
    const f: any = fontSize
    if (typeof f === 'number') {
      // ThemeProvider ah 14,16,18,20 ang a nih chuan
      return Math.round(base * (f / 16))
    }
    if (typeof f === 'string') {
      if (f === 'small') return base - 2
      if (f === 'large') return base + 4
      if (f === 'extra-large') return base + 7
    }
    return base
  }

  useEffect(()=>{
    const saved = localStorage.getItem('mz_requests')
    if(saved) setSentRequests(new Set(JSON.parse(saved)))
  },[])

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      try{
        const snap = await getDocs(collection(db, "users"))
        const list: User[] = []
        snap.forEach(docSnap=>{
          const data = docSnap.data() as any
          const uid = data.uid || docSnap.id
          if(u && uid === u.uid) return
          if(data.email === localStorage.getItem('mz_user_email')) return
          
          list.push({
            id: uid,
            uid: uid,
            name: data.name || "No Name",
            bio: data.bio || "",
            email: data.email || "",
            photoURL: data.photoURL || "",
            village: data.village || data.address || data.location || ""
          })
        })
        setUsers(list)
      }catch(e){ console.error(e) }
      setLoading(false)
    })
    return ()=>unsub()
  },[])

  const filtered = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.village && u.village.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAddFriend = (id:string) => {
    const ns = new Set(sentRequests); ns.add(id); setSentRequests(ns)
    localStorage.setItem('mz_requests', JSON.stringify(Array.from(ns)))
  }

  const highlightText = (text: string, query: string) => {
    if(!query || !text) return text as any
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? <span key={i} style={{background:'#7C3AED', color:'white', borderRadius:4, padding:'0 4px', fontWeight:800}}>{part}</span> : part
    )
  }

  return (
    <div style={{minHeight:'100vh', background: theme==='dark'?'#111':'#fff', color: theme==='dark'?'#fff':'#111', paddingBottom:'90px'}}>
      <div style={{
        position:'sticky', top:0, zIndex:20,
        background: theme==='dark'?'#111':'#fff',
        padding:'4px 12px 8px 12px',
        borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px', height:'40px'}}>
          <button onClick={()=>router.back()} style={{width:'36px', height:'36px', border:'none', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color: theme==='dark'?'#fff':'#111'}}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <div style={{fontSize: getSize(22), fontWeight:'900'}}>User List ({users.length})</div>
        </div>
        <div style={{
          display:'flex', 
          alignItems:'center', 
          gap:'8px', 
          background: theme==='dark'?'#222':'#F2F2F2', 
          borderRadius:'12px', 
          padding:'0 12px', 
          height:'38px',
          border: isFocused ? '2.5px solid #7C3AED' : '1.5px solid transparent',
          transition:'all 0.2s'
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input 
            value={search} 
            onChange={(e)=>setSearch(e.target.value)} 
            onFocus={()=>setIsFocused(true)}
            onBlur={()=>setIsFocused(false)}
            placeholder="Search users..." 
            style={{flex:1, border:'none', outline:'none', background:'transparent', fontSize: getSize(14), fontWeight:500, color: theme==='dark'?'#fff':'#111'}} 
          />
        </div>
      </div>

      <div>
        {loading ? (
          <div style={{textAlign:'center', padding:'50px 20px', color:'#888'}}>
            <div style={{fontSize: getSize(14), fontWeight:700}}>Loading...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{textAlign:'center', padding:'50px 20px', color:'#888'}}>
            <div style={{fontSize:'36px', marginBottom:'8px'}}>👥</div>
            <div style={{fontWeight:'800', fontSize: getSize(14)}}>No users found</div>
          </div>
        ) : filtered.map((user)=>(
          <div key={user.id} style={{display:'flex', alignItems:'center', gap:'12px', padding:'12px 12px', borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0'}}>
            <div style={{width:58, height:58, borderRadius:29, background:'#f3f4f6', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'2px solid #e5e7eb'}}>
              {user.photoURL ? <img src={user.photoURL} alt={user.name} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <span style={{fontSize:28}}>👤</span>}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div onClick={()=>{localStorage.setItem('mz_view_user', JSON.stringify(user)); router.push(`/profile/${user.id}`)}} style={{fontWeight:'800', fontSize: getSize(17), cursor:'pointer', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: theme==='dark'?'#fff':'#111'}}>{highlightText(user.name, search)}</div>
              <div style={{fontSize: getSize(13), color: theme==='dark'?'#aaa':'#666', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginTop:'2px', fontWeight:500}}>
                {user.village ? `📍 ${user.village}` : "No village"}
              </div>
            </div>
            <div style={{display:'flex', gap:'7px', flexShrink:0}}>
              <button onClick={()=>handleAddFriend(user.id)} style={{padding:'9px 16px', borderRadius:'20px', border: sentRequests.has(user.id) ? 'none' : '1.8px solid #7C3AED', background: sentRequests.has(user.id) ? '#111' : 'transparent', color: sentRequests.has(user.id) ? '#fff' : '#7C3AED', fontWeight:'800', fontSize: getSize(12), minWidth:'102px', cursor:'pointer'}}>{sentRequests.has(user.id) ? 'Request Sent' : 'Add Friend'}</button>
              <button onClick={()=>router.push(`/chat/${user.id}`)} style={{padding:'9px 18px', borderRadius:'20px', border:'none', background:'#7C3AED', color:'#fff', fontWeight:'800', fontSize: getSize(12), cursor:'pointer'}}>Chat</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
        }

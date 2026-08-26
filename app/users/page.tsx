'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../components/ThemeProvider'

interface User {
  id: string
  name: string
  bio: string
}

export default function UserListPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [search, setSearch] = useState('')
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())

  useEffect(()=>{
    const saved = localStorage.getItem('mz_requests')
    if(saved) setSentRequests(new Set(JSON.parse(saved)))
  },[])

  // TUNAH CHUAN USERS TAK TAK AWM HMA CHUIN EMPTY - LEM AWM LO
  const users: User[] = []

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))

  const handleAddFriend = (id:string) => {
    const ns = new Set(sentRequests); ns.add(id); setSentRequests(ns)
    localStorage.setItem('mz_requests', JSON.stringify(Array.from(ns)))
  }

  return (
    <div style={{minHeight:'100vh', background: theme==='dark'?'#111':'#fff', paddingBottom:'90px'}}>
      <div style={{
        position:'sticky', top:0, zIndex:20,
        background: theme==='dark'?'#111':'#fff',
        padding:'2px 10px 4px 10px',
        borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', height:'32px'}}>
          <button onClick={()=>router.back()} style={{width:'36px', height:'36px', border:'none', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <div style={{fontSize:'16px', fontWeight:'800'}}>User List</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'8px', background: theme==='dark'?'#222':'#F2F2F2', borderRadius:'8px', padding:'0 10px', height:'36px'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search users..." style={{flex:1, border:'none', outline:'none', background:'transparent', fontSize:'13px', color: theme==='dark'?'#fff':'#111'}} />
        </div>
      </div>

      <div>
        {filtered.length === 0 ? (
          <div style={{textAlign:'center', padding:'50px 20px', color:'#888'}}>
            <div style={{fontSize:'36px', marginBottom:'8px'}}>👥</div>
            <div style={{fontWeight:'800', fontSize:'14px'}}>No users found</div>
            <div style={{fontSize:'12px', marginTop:'4px'}}>Users an la awm lo</div>
          </div>
        ) : filtered.map((user)=>(
          <div key={user.id} style={{display:'flex', alignItems:'center', gap:'10px', padding:'8px 12px', borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0'}}>
            <div style={{flex:1, minWidth:0}}>
              <div onClick={()=>{localStorage.setItem('mz_view_user', JSON.stringify(user)); router.push(`/profile/${user.id}`)}} style={{fontWeight:'700', fontSize:'14px', cursor:'pointer'}}>{user.name}</div>
              <div style={{fontSize:'11px', color:'#888'}}>{user.bio}</div>
            </div>
            <div style={{display:'flex', gap:'6px', flexShrink:0}}>
              <button onClick={()=>handleAddFriend(user.id)} style={{padding:'6px 12px', borderRadius:'16px', border: sentRequests.has(user.id) ? 'none' : '1.5px solid #7C3AED', background: sentRequests.has(user.id) ? '#000' : 'transparent', color: sentRequests.has(user.id) ? '#fff' : '#7C3AED', fontWeight:'700', fontSize:'11px', minWidth:'88px'}}>{sentRequests.has(user.id) ? 'Request Sent' : 'Add Friend'}</button>
              <button onClick={()=>router.push(`/chat/${user.id}`)} style={{padding:'6px 14px', borderRadius:'16px', border:'none', background:'#7C3AED', color:'#fff', fontWeight:'700', fontSize:'11px'}}>Chat</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

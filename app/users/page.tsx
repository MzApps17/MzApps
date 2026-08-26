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

  const users: User[] = [
    { id: '1', name: 'Zuali Hmar', bio: 'Aizawl nula' },
    { id: '2', name: 'Mapuia', bio: 'Guitarist 🎸' },
    { id: '3', name: 'Ruthi', bio: 'Mizo Designer' },
    { id: '4', name: 'Sanga', bio: 'Champhai' },
    { id: '5', name: 'Mimi', bio: 'Siahatla 💖' },
  ]

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))

  const handleAddFriend = (id:string) => {
    const newSet = new Set(sentRequests)
    newSet.add(id)
    setSentRequests(newSet)
    localStorage.setItem('mz_requests', JSON.stringify(Array.from(newSet)))
  }

  return (
    <div style={{minHeight:'100vh', background: theme==='dark'?'#111':'#fff', paddingBottom:'90px'}}>
      
      {/* 1. ARROW LIAN - INSTAGRAM STYLE + 3. PADDING ZIM + 2. A DING RENG TUR HEADER */}
      <div style={{
        position:'sticky', top:0, zIndex:20,
        background: theme==='dark'?'#111':'#fff',
        padding:'8px 12px 8px 12px',
        borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0'
      }}>
        {/* ROW 1 - TITLE */}
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'8px'}}>
          <button onClick={()=>router.back()} style={{
            width:'44px', height:'44px',
            border:'none',
            background:'transparent',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer'
          }}>
            {/* INSTAGRAM ARROW LIAN */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div style={{fontSize:'18px', fontWeight:'800'}}>User List</div>
        </div>

        {/* ROW 2 - SEARCH - A DING RENG TUR + ICON THAR */}
        <div style={{
          display:'flex', alignItems:'center', gap:'10px',
          background: theme==='dark'?'#222':'#F2F2F2',
          borderRadius:'10px',
          padding:'0 12px',
          height:'40px',
        }}>
          {/* 4. SEARCH ICON - I THLALAK AMI ANG */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input 
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search users..."
            style={{
              flex:1, border:'none', outline:'none',
              background:'transparent',
              fontSize:'14px',
              fontWeight:'500',
              color: theme==='dark'?'#fff':'#111'
            }}
          />
        </div>
      </div>

      {/* USER LIST */}
      <div>
        {filtered.length === 0 ? (
          // 7. USERS AWM LO
          <div style={{textAlign:'center', padding:'60px 20px', color:'#888'}}>
            <div style={{fontSize:'40px', marginBottom:'10px'}}>😕</div>
            <div style={{fontWeight:'800', fontSize:'16px'}}>No users found</div>
            <div style={{fontSize:'13px', marginTop:'4px'}}>No users available at the moment</div>
          </div>
        ) : (
          filtered.map((user)=>(
            <div key={user.id} style={{
              display:'flex', alignItems:'center', gap:'14px',
              padding:'12px 14px',
              borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0',
              background: theme==='dark'?'#111':'#fff'
            }}>
              {/* 6. USERS LEM DAH TAWH LO - INITIAL AWM LO, DIRECT TEXT */}
              <div style={{flex:1, minWidth:0}}>
                <div 
                  onClick={()=>{
                    localStorage.setItem('mz_view_user', JSON.stringify(user))
                    router.push(`/profile/${user.id}`)
                  }}
                  style={{fontWeight:'700', fontSize:'15px', cursor:'pointer'}}
                >
                  {user.name}
                </div>
                <div style={{fontSize:'12px', color:'#888', marginTop:'1px'}}>{user.bio}</div>
              </div>
              <div style={{display:'flex', gap:'8px', flexShrink:0}}>
                <button
                  onClick={()=>handleAddFriend(user.id)}
                  style={{
                    padding:'7px 14px',
                    borderRadius:'18px',
                    border: sentRequests.has(user.id) ? 'none' : '1.5px solid #7C3AED',
                    background: sentRequests.has(user.id) ? '#000' : 'transparent',
                    color: sentRequests.has(user.id) ? '#fff' : '#7C3AED',
                    fontWeight:'700',
                    fontSize:'12px',
                    cursor:'pointer',
                    minWidth:'92px'
                  }}
                >
                  {sentRequests.has(user.id) ? 'Request Sent' : 'Add Friend'}
                </button>
                <button
                  onClick={()=>router.push(`/chat/${user.id}`)}
                  style={{
                    padding:'7px 16px',
                    borderRadius:'18px',
                    border:'none',
                    background:'#7C3AED',
                    color:'#fff',
                    fontWeight:'700',
                    fontSize:'12px',
                    cursor:'pointer'
                  }}
                >
                  Chat
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../components/ThemeProvider'

interface User {
  id: string
  name: string
  bio: string
  pic: string
}

export default function UserListPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [search, setSearch] = useState('')
  const [sentRequests, setSentRequests] = useState<Set<string>>(new Set())
  const [myPic, setMyPic] = useState('')

  useEffect(()=>{
    const userStr = localStorage.getItem('mz_user')
    if(userStr){
      try{
        const u = JSON.parse(userStr)
        if(u.pic) setMyPic(u.pic)
      }catch{}
    }
    const saved = localStorage.getItem('mz_requests')
    if(saved) setSentRequests(new Set(JSON.parse(saved)))
  },[])

  const users: User[] = [
    { id: '1', name: 'Zuali Hmar', bio: 'Aizawl nula', pic: 'https://i.pravatar.cc/150?img=1' },
    { id: '2', name: 'Mapuia', bio: 'Guitarist 🎸', pic: 'https://i.pravatar.cc/150?img=8' },
    { id: '3', name: 'Ruthi', bio: 'Mizo Designer', pic: 'https://i.pravatar.cc/150?img=5' },
    { id: '4', name: 'Sanga', bio: 'Champhai', pic: 'https://i.pravatar.cc/150?img=12' },
    { id: '5', name: 'Mimi', bio: 'Siahatla 💖', pic: 'https://i.pravatar.cc/150?img=9' },
  ]

  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))

  const handleAddFriend = (id:string) => {
    const newSet = new Set(sentRequests)
    newSet.add(id)
    setSentRequests(newSet)
    localStorage.setItem('mz_requests', JSON.stringify(Array.from(newSet)))
  }

  const handleNameClick = (user:User) => {
    localStorage.setItem('mz_view_user', JSON.stringify(user))
    router.push(`/profile/${user.id}`)
  }

  const handleChat = (id:string) => {
    router.push(`/chat/${id}`)
  }

  return (
    <div style={{minHeight:'100vh', background: theme==='dark'?'#111':'#fff', paddingBottom:'90px'}}>
      {/* HEADER WITH BIG ARROW */}
      <div style={{
        display:'flex', alignItems:'center', gap:'14px',
        padding:'14px 16px', 
        background: theme==='dark'?'#1A1A1A':'#fff',
        borderBottom: theme==='dark'?'1px solid #333':'1px solid #eee',
        position:'sticky', top:0, zIndex:20
      }}>
        <button onClick={()=>router.back()} style={{
          width:'44px', height:'44px', 
          borderRadius:'12px',
          border: theme==='dark'?'1px solid #333':'1px solid #E5E7EB',
          background: theme==='dark'?'#222':'#fff',
          fontSize:'22px', fontWeight:'900',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer'
        }}>
          ←
        </button>
        <div style={{fontSize:'20px', fontWeight:'900'}}>User List</div>
      </div>

      {/* SEARCH - NO PURPLE COLOR, SMALL WHITE ICON */}
      <div style={{padding:'12px 16px', background: theme==='dark'?'#111':'#fff'}}>
        <div style={{
          display:'flex', alignItems:'center', gap:'10px',
          background: theme==='dark'?'#222':'#F3F4F6',
          borderRadius:'14px',
          padding:'0 14px',
          height:'46px',
          border: theme==='dark'?'1px solid #333':'1px solid #eee'
        }}>
          <span style={{fontSize:'16px', opacity:0.6}}>🔍</span>
          <input 
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
            placeholder="Search users..."
            style={{
              flex:1, border:'none', outline:'none',
              background:'transparent',
              fontSize:'15px',
              fontWeight:'500',
              color: theme==='dark'?'#fff':'#111'
            }}
          />
        </div>
      </div>

      {/* USER LIST */}
      <div>
        {filtered.map((user, idx)=>(
          <div key={user.id} style={{
            display:'flex', alignItems:'center', gap:'14px',
            padding:'14px 16px',
            borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0',
            background: theme==='dark'?'#111':'#fff'
          }}>
            <img 
              src={idx===0 && myPic ? myPic : user.pic} 
              alt={user.name}
              style={{width:'54px', height:'54px', borderRadius:'50%', objectFit:'cover', border:'2px solid #eee'}}
            />
            <div style={{flex:1, minWidth:0}}>
              <div 
                onClick={()=>handleNameClick(user)}
                style={{fontWeight:'800', fontSize:'16px', cursor:'pointer', lineHeight:'1.2'}}
              >
                {user.name}
              </div>
              <div style={{fontSize:'13px', color:'#888', marginTop:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{user.bio}</div>
            </div>
            <div style={{display:'flex', gap:'8px', flexShrink:0}}>
              <button
                onClick={()=>handleAddFriend(user.id)}
                disabled={sentRequests.has(user.id)}
                style={{
                  padding:'8px 16px',
                  borderRadius:'20px',
                  border:'2px solid #7C3AED',
                  background: sentRequests.has(user.id) ? '#7C3AED' : 'transparent',
                  color: sentRequests.has(user.id) ? '#fff' : '#7C3AED',
                  fontWeight:'800',
                  fontSize:'12px',
                  cursor:'pointer',
                  minWidth:'95px'
                }}
              >
                {sentRequests.has(user.id) ? 'Request Sent' : 'Add Friend'}
              </button>
              <button
                onClick={()=>handleChat(user.id)}
                style={{
                  padding:'8px 18px',
                  borderRadius:'20px',
                  border:'none',
                  background:'#7C3AED',
                  color:'#fff',
                  fontWeight:'800',
                  fontSize:'12px',
                  cursor:'pointer'
                }}
              >
                Chat
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MOCK_USERS = [
  { id: '1', name: 'Zuali Hmar', pic: 'https://i.pravatar.cc/150?img=1', bio: 'Aizawl nula' },
  { id: '2', name: 'Mapuia', pic: 'https://i.pravatar.cc/150?img=8', bio: 'Guitarist 🎸' },
  { id: '3', name: 'Ruthi', pic: 'https://i.pravatar.cc/150?img=5', bio: 'Mizo Designer' },
  { id: '4', name: 'Sanga', pic: 'https://i.pravatar.cc/150?img=12', bio: 'Champhai' },
  { id: '5', name: 'Mimi', pic: 'https://i.pravatar.cc/150?img=9', bio: 'Siahatla 💖' },
]

export default function UsersPage(){
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [friends, setFriends] = useState<string[]>([])

  const filtered = MOCK_USERS.filter(u=> u.name.toLowerCase().includes(search.toLowerCase()))

  const toggleFriend = (id:string) => {
    setFriends(prev=> prev.includes(id)? prev.filter(x=>x!==id) : [...prev, id])
  }

  const startChat = (u:any) => {
    const chats = JSON.parse(localStorage.getItem('mz_chats')||'[]')
    if(!chats.find((c:any)=>c.id===u.id)){
      chats.unshift({id:u.id, name:u.name, pic:u.pic, lastMsg:'Chat tan ang aw!', time:'Now'})
      localStorage.setItem('mz_chats', JSON.stringify(chats))
    }
    router.push(`/chat/${u.id}`)
  }

  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', background:'#fff'}}>
      
      {/* HEADER FIXED - SEARCH HIGHLIGHT */}
      <div style={{position:'sticky', top:0, zIndex:10, background:'#fff', padding:'12px 16px', borderBottom:'1px solid #eee'}}>
        <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px'}}>
          <button onClick={()=>router.back()} style={{width:'36px', height:'36px', borderRadius:'10px', border:'1px solid #eee', background:'#fff', fontWeight:'900'}}>←</button>
          <div style={{fontWeight:'900', fontSize:'20px'}}>User List</div>
        </div>

        <div style={{display:'flex', alignItems:'center', background:'#F3E8FF', borderLeft:'5px solid #7C3AED', borderRadius:'14px', padding:'2px 14px'}}>
          <span>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="User zawng rawh..." style={{flex:1, border:'none', background:'transparent', padding:'12px 10px', fontWeight:'700', fontSize:'14px', outline:'none', color:'#7C3AED'}} />
        </div>
      </div>

      {/* USER LIST SCROLL */}
      <div style={{flex:1, overflowY:'auto', paddingBottom:'20px'}}>
        {filtered.map(u=>{
          const isFriend = friends.includes(u.id)
          return (
            <div key={u.id} style={{display:'flex', gap:'12px', padding:'14px 16px', borderBottom:'1px solid #f5f5f5', alignItems:'center'}}>
              <div style={{width:'56px', height:'56px', borderRadius:'50%', background:`url(${u.pic}) center/cover`, border:'2px solid #F3E8FF', flexShrink:0}}></div>
              <div style={{flex:1}}>
                <div style={{fontWeight:'900', fontSize:'15px'}}>{u.name}</div>
                <div style={{fontWeight:'600', fontSize:'12px', color:'#888'}}>{u.bio}</div>
              </div>
              <div style={{display:'flex', gap:'6px'}}>
                <button onClick={()=>toggleFriend(u.id)} style={{padding:'8px 12px', borderRadius:'20px', border: isFriend? '2px solid #111':'2px solid #7C3AED', background: isFriend?'#111':'#fff', color: isFriend?'#fff':'#7C3AED', fontWeight:'900', fontSize:'11px'}}>
                  {isFriend?'✓ FRIEND':'ADD'}
                </button>
                <button onClick={()=>startChat(u)} style={{padding:'8px 14px', borderRadius:'20px', border:'none', background:'#7C3AED', color:'#fff', fontWeight:'900', fontSize:'11px'}}>
                  CHAT
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
                      }

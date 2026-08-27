'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../components/ThemeProvider'
import { auth, db } from '@/app/firebase/config'
import { collection, query, where, onSnapshot, orderBy, getDocs } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

interface ChatItem {
  id: string
  name: string
  photoURL?: string
  lastMessage: string
  lastMessageIsMe: boolean
  status: 'sent' | 'delivered' | 'seen'
  time: Date
  unread: number
  village?: string
}

export default function ChatListPage() {
  const router = useRouter()
  const { theme, fontSize } = useTheme() as any
  const [search, setSearch] = useState('')
  const [chats, setChats] = useState<ChatItem[]>([])
  const [isFocused, setIsFocused] = useState(false)

  const getSize = (base: number) => {
    const f: any = fontSize
    if (typeof f === 'number') return Math.round(base * (f / 16))
    if (typeof f === 'string') {
      if (f === 'small') return base - 2
      if (f === 'large') return base + 4
      if (f === 'extra-large') return base + 7
    }
    return base
  }

  // Demo data - Firestore atanga lak tur
  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) return
      // Tunah chuan demo, i duh chuan Firestore conversations atanga la tur
      setChats([
        { id: '1', name: 'Mimi', photoURL: 'https://i.pravatar.cc/150?img=5', lastMessage: 'Chat tan ang aw!', lastMessageIsMe: false, status: 'seen', time: new Date(), unread: 2, village: 'Aizawl' },
        { id: '2', name: 'Ruthi', photoURL: 'https://i.pravatar.cc/150?img=32', lastMessage: 'Chat tan ang aw!', lastMessageIsMe: true, status: 'delivered', time: new Date(Date.now() - 1000*60*35), unread: 0 },
        { id: '3', name: 'Nghaka', photoURL: '', lastMessage: 'Ka lo thleng tawh e', lastMessageIsMe: true, status: 'sent', time: new Date(Date.now() - 1000*60*60*2), unread: 0 },
      ])
    })
    return ()=>unsub()
  },[])

  const filtered = chats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  // FIX 4: Time 12h format 9:34pm
  const formatTime = (d: Date) => {
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if(diff < 60000) return 'Now'
    if(diff < 86400000) {
      let h = d.getHours()
      let m = d.getMinutes()
      let ampm = h >= 12 ? 'pm' : 'am'
      h = h % 12 || 12
      return `${h}:${m.toString().padStart(2,'0')}${ampm}`
    }
    return `${d.getDate()}/${d.getMonth()+1}`
  }

  // FIX 6: Tick WhatsApp style
  const Tick = ({ status }: { status: string }) => {
    if(status === 'sent') return <span style={{fontSize: getSize(13), color:'#8a8a8a', marginRight:4}}>✓</span>
    if(status === 'delivered') return <span style={{fontSize: getSize(13), color:'#8a8a8a', marginRight:4, letterSpacing:'-2px'}}>✓✓</span>
    if(status === 'seen') return <span style={{fontSize: getSize(13), color:'#53BDEB', marginRight:4, letterSpacing:'-2px', fontWeight:800}}>✓✓</span>
    return null
  }

  return (
    <div style={{minHeight:'100vh', background: theme==='dark'?'#111':'#fff', color: theme==='dark'?'#fff':'#111', paddingBottom:'90px'}}>
      
      {/* FIX 1 & 2: Search - Icon leh Chat tih awm lo, chung berah sticky, tawlh ve lo */}
      <div style={{
        position:'sticky', top:0, zIndex:20,
        background: theme==='dark'?'#111':'#fff',
        padding:'10px 12px 10px 12px',
        borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0'
      }}>
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
            placeholder="Chat list search..." 
            style={{flex:1, border:'none', outline:'none', background:'transparent', fontSize: getSize(14), fontWeight:500, color: theme==='dark'?'#fff':'#111'}} 
          />
        </div>
      </div>

      {/* Chat List */}
      <div>
        {filtered.map((chat)=>(
          <div 
            key={chat.id} 
            onClick={()=>router.push(`/chat/${chat.id}`)}
            style={{
              display:'flex', 
              alignItems:'center', 
              gap:'12px', 
              padding:'10px 12px', 
              borderBottom: theme==='dark'?'1px solid #1e1e1e':'1px solid #f5f5f5',
              cursor:'pointer'
            }}
          >
            {/* FIX 3: Pic ti lian */}
            <div style={{width:60, height:60, borderRadius:30, background:'#f3f4f6', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
              {chat.photoURL ? <img src={chat.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <span style={{fontSize:28}}>👤</span>}
            </div>

            {/* FIX 3: Hming hniam hret */}
            <div style={{flex:1, minWidth:0, paddingTop:'4px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px'}}>
                <div style={{fontWeight:'700', fontSize: getSize(17), whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color: theme==='dark'?'#fff':'#111'}}>{chat.name}</div>
                
                {/* FIX 4: Time + Badge */}
                <div style={{display:'flex', alignItems:'center', gap:'6px', flexShrink:0}}>
                  <span style={{fontSize: getSize(11), color: chat.unread>0 ? '#7C3AED' : '#8a8a8a', fontWeight: chat.unread>0 ? 800 : 500}}>{formatTime(chat.time)}</span>
                  {chat.unread > 0 && (
                    <span style={{background:'#7C3AED', color:'white', fontSize: getSize(11), fontWeight:800, minWidth:20, height:20, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 6px'}}>{chat.unread}</span>
                  )}
                </div>
              </div>

              {/* FIX 5: Last message + Tick */}
              <div style={{display:'flex', alignItems:'center', gap:'2px', marginTop:'3px', minWidth:0}}>
                {chat.lastMessageIsMe && <Tick status={chat.status} />}
                <div style={{
                  fontSize: getSize(13.5), 
                  color: chat.unread>0 ? (theme==='dark'?'#fff':'#111') : '#777', 
                  fontWeight: chat.unread>0 ? 700 : 400,
                  whiteSpace:'nowrap', 
                  overflow:'hidden', 
                  textOverflow:'ellipsis',
                  flex:1
                }}>
                  {chat.lastMessage}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAB + Button */}
      <button onClick={()=>router.push('/users')} style={{position:'fixed', bottom:90, right:16, width:56, height:56, borderRadius:18, background:'#7C3AED', border:'none', color:'white', fontSize:28, fontWeight:700, boxShadow:'0 6px 20px rgba(124,58,237,0.4)', cursor:'pointer'}}>+</button>
    </div>
  )
                  }

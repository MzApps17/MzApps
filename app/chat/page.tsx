'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../components/ThemeProvider'
import { auth, db } from '@/app/firebase/config'
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore'
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
}

export default function ChatListPage() {
  const router = useRouter()
  const { theme, fontSize } = useTheme() as any
  const [search, setSearch] = useState('')
  const [chats, setChats] = useState<ChatItem[]>([])
  const [isFocused, setIsFocused] = useState(false)
  const [myUid, setMyUid] = useState('')

  const getSize = (base: number) => {
    const f: any = fontSize
    if (typeof f === 'number') return Math.round(base * (f / 16))
    return base
  }

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, async (u)=>{
      if(!u) return
      setMyUid(u.uid)
      const cached = localStorage.getItem('chats_cache')
      if(cached) {
        try { setChats(JSON.parse(cached).map((c:any)=>({...c, time: new Date(c.time)}))) } catch {}
      }
    })
    return ()=>unsub()
  },[])

  // CHAKNA: chats collection atangin lastMessage chiah la - message zawng zawng chhiar ngai lo
  useEffect(()=>{
    if(!myUid) return
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', myUid),
      orderBy('lastMessageTime', 'desc')
    )
    const unsub = onSnapshot(q, (snap)=>{
      const list: ChatItem[] = snap.docs.map(doc=>{
        const data: any = doc.data()
        const otherId = data.participants.find((p:string)=>p!==myUid)
        const otherInfo = data.participantsInfo?.[otherId] || {}
        return {
          id: otherId || doc.id,
          name: otherInfo.name || data.lastSenderName || 'User',
          photoURL: otherInfo.photoURL || '',
          lastMessage: data.lastMessage || '',
          lastMessageIsMe: data.lastSenderId === myUid,
          status: data.lastStatus || 'sent',
          time: data.lastMessageTime?.toDate? data.lastMessageTime.toDate() : new Date(),
          unread: data.unreadCount?.[myUid] || 0
        }
      })
      setChats(list)
      localStorage.setItem('chats_cache', JSON.stringify(list))
    }, ()=>{
      // Offline fallback - cache atangin
    })
    return ()=>unsub()
  },[myUid])

  const filtered = chats.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))

  const formatTime = (d: Date) => {
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if(diff < 60000) return 'Now'
    if(diff < 86400000) {
      let h = d.getHours()
      let m = d.getMinutes()
      let ampm = h >= 12? 'pm' : 'am'
      h = h % 12 || 12
      return `${h}:${m.toString().padStart(2,'0')}${ampm}`
    }
    return `${d.getDate()}/${d.getMonth()+1}`
  }

  const Tick = ({ status }: { status: string }) => {
    if(status === 'sent') return <span style={{fontSize: getSize(14), color:'#8a8a8a', marginRight:5}}>✓</span>
    if(status === 'delivered') return <span style={{fontSize: getSize(14), color:'#8a8a8a', marginRight:5, letterSpacing:'-4px'}}>✓✓</span>
    if(status === 'seen') return <span style={{fontSize: getSize(14), color:'#00D856', marginRight:5, letterSpacing:'-4px', fontWeight:900}}>✓✓</span>
    return null
  }

  return (
    <div style={{minHeight:'100vh', background: theme==='dark'?'#111':'#fff', color: theme==='dark'?'#fff':'#111', paddingBottom:'90px'}}>
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
          border: isFocused? '2.5px solid #7C3AED' : '1.5px solid transparent',
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

      <div>
        {filtered.length === 0? (
          <div style={{textAlign:'center', padding:'80px 20px', color:'#888'}}>
            <div style={{fontSize:'40px', marginBottom:'8px'}}>💬</div>
            <div style={{fontWeight:700, fontSize: getSize(14)}}>No chats yet</div>
            <div style={{fontSize: getSize(12), marginTop:'4px'}}>Your chats will appear here</div>
          </div>
        ) : filtered.map((chat)=>(
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
            <div style={{width:60, height:60, borderRadius:30, background:'#f3f4f6', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
              {chat.photoURL? <img src={chat.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <span style={{fontSize:28}}>👤</span>}
            </div>
            <div style={{flex:1, minWidth:0, paddingTop:'4px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:'8px'}}>
                <div style={{fontWeight:'700', fontSize: getSize(17), whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{chat.name}</div>
                <div style={{display:'flex', alignItems:'center', gap:'6px', flexShrink:0}}>
                  <span style={{fontSize: getSize(11), color: chat.unread>0? '#7C3AED' : '#8a8a8a', fontWeight: chat.unread>0? 800 : 500}}>{formatTime(chat.time)}</span>
                  {chat.unread > 0 && (
                    <span style={{background:'#7C3AED', color:'white', fontSize: getSize(11), fontWeight:800, minWidth:20, height:20, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 6px'}}>{chat.unread}</span>
                  )}
                </div>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:'2px', marginTop:'3px', minWidth:0}}>
                {chat.lastMessageIsMe && <Tick status={chat.status} />}
                <div style={{
                  fontSize: getSize(13.5),
                  color: chat.unread>0? (theme==='dark'?'#fff':'#111') : '#777',
                  fontWeight: chat.unread>0? 700 : 400,
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

      <button onClick={()=>router.push('/users')} style={{position:'fixed', bottom:90, right:16, width:56, height:56, borderRadius:18, background:'#7C3AED', border:'none', color:'white', fontSize:28, fontWeight:700, boxShadow:'0 6px 20px rgba(124,58,237,0.4)', cursor:'pointer'}}>+</button>
    </div>
  )
}

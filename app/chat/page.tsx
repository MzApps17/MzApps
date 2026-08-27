'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '../components/ThemeProvider'
import { auth, db } from '@/app/firebase/config'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

export default function ChatListPage() {
  const router = useRouter()
  const { theme, fontSize } = useTheme() as any
  const [search, setSearch] = useState('')
  const [chats, setChats] = useState<any[]>([])
  const [myUid, setMyUid] = useState('')

  const getSize = (base: number) => {
    const f: any = fontSize
    if (typeof f === 'number') return Math.round(base * (f / 16))
    return base
  }

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, (u)=>{
      if(!u) return
      setMyUid(u.uid)
      const cached = localStorage.getItem('chats_cache')
      if(cached) { try { setChats(JSON.parse(cached).map((c:any)=>({...c, time: new Date(c.time)}))) } catch {} }

      const q = query(collection(db, 'chats'), where('participants', 'array-contains', u.uid))
      const unsubChat = onSnapshot(q, (snap)=>{
        const list = snap.docs.map(d=>{
          const data:any = d.data()
          const otherId = data.participants.find((p:string)=>p!==u.uid)
          const otherInfo = data.participantsInfo?.[otherId] || {}
          return {
            id: otherId,
            name: otherInfo.name || 'User',
            photoURL: otherInfo.photoURL || '',
            lastMessage: data.lastMessage || '',
            lastMessageIsMe: data.lastSenderId === u.uid,
            status: data.lastStatus || 'sent',
            time: data.lastMessageTime?.toDate? data.lastMessageTime.toDate() : new Date(),
            unread: data.unreadCount?.[u.uid] || 0
          }
        }).sort((a,b)=> b.time.getTime() - a.time.getTime())
        setChats(list)
        localStorage.setItem('chats_cache', JSON.stringify(list))
      })
      return ()=>unsubChat()
    })
    return ()=>unsub()
  },[])

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

  return (
    <div style={{minHeight:'100vh', background: theme==='dark'?'#111':'#fff', color: theme==='dark'?'#fff':'#111', paddingBottom:'90px'}}>
      <div style={{position:'sticky', top:0, zIndex:20, background: theme==='dark'?'#111':'#fff', padding:'10px 12px', borderBottom: theme==='dark'?'1px solid #222':'1px solid #f0f0f0'}}>
        <div style={{display:'flex', alignItems:'center', gap:'8px', background: theme==='dark'?'#222':'#F2F2F2', borderRadius:'12px', padding:'0 12px', height:'38px'}}>
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Chat list search..." style={{flex:1, border:'none', outline:'none', background:'transparent', fontSize: getSize(14), color: theme==='dark'?'#fff':'#111'}} />
        </div>
      </div>
      <div>
        {filtered.length === 0? (
          <div style={{textAlign:'center', padding:'80px 20px', color:'#888'}}><div style={{fontSize:'40px'}}>💬</div><div>No chats yet</div></div>
        ) : filtered.map((chat)=>(
          <div key={chat.id} onClick={()=>{ localStorage.setItem('mz_view_user', JSON.stringify({name:chat.name, photoURL:chat.photoURL})); router.push(`/chat/${chat.id}`)}} style={{display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', borderBottom: theme==='dark'?'1px solid #1e1e1e':'1px solid #f5f5f5', cursor:'pointer'}}>
            <div style={{width:50, height:50, borderRadius:25, background:'#eee', overflow:'hidden'}}>{chat.photoURL? <img src={chat.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <span>👤</span>}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><div style={{fontWeight:700, fontSize: getSize(16)}}>{chat.name}</div><span style={{fontSize: getSize(11), color:'#888'}}>{formatTime(chat.time)}</span></div>
              <div style={{fontSize: getSize(13), color:'#777', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{chat.lastMessage}</div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={()=>router.push('/users')} style={{position:'fixed', bottom:90, right:16, width:56, height:56, borderRadius:18, background:'#7C3AED', border:'none', color:'white', fontSize:28}}> + </button>
    </div>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db, auth } from '@firebase/config'

interface Message {
  id: string
  text: string
  senderId: string
  createdAt: any
}

export default function ChatPage(){
  const { id } = useParams()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [otherUser, setOtherUser] = useState<any>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const myUid = auth.currentUser?.uid || localStorage.getItem('mz_uid')

  const chatId = [myUid, id].sort().join('_')

  // REALTIME LISTENER - CHAK TAK!
  useEffect(()=>{
    if(!myUid) return
    
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    )

    const unsub = onSnapshot(q, (snap)=>{
      const msgs: Message[] = []
      snap.forEach(d=>{
        msgs.push({ id: d.id, ...d.data() } as Message)
      })
      setMessages(msgs)
      setTimeout(()=> bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    })

    // Other user info
    getDoc(doc(db, 'users', id as string)).then(s=>{
      if(s.exists()) setOtherUser(s.data())
    })

    return () => unsub()
  },[chatId, myUid, id])

  const sendMessage = async () => {
    if(!text.trim()) return
    const msgText = text
    setText('') // A rang thei ang ber a clear

    try{
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: msgText,
        senderId: myUid,
        createdAt: serverTimestamp(),
      })
      // last message update
      await addDoc(collection(db, 'chats', chatId, 'messages'), {}) // dummy to trigger
    }catch(e){
      console.error(e)
      setText(msgText) // fail chuan kir leh
    }
  }

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh', background:'#fff'}}>
      {/* HEADER */}
      <div style={{height:'52px', display:'flex', alignItems:'center', gap:'10px', padding:'0 12px', borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff', zIndex:10}}>
        <button onClick={()=>router.back()} style={{border:'none', background:'transparent'}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        {otherUser?.pic && <img src={otherUser.pic} style={{width:'32px', height:'32px', borderRadius:'50%'}} />}
        <div style={{fontWeight:'800'}}>{otherUser?.name || 'Chat'}</div>
        <div style={{marginLeft:'auto', width:'8px', height:'8px', borderRadius:'50%', background:'#22c55e'}}></div>
      </div>

      {/* MESSAGES */}
      <div style={{flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:'6px'}}>
        {messages.map(m=>{
          const isMe = m.senderId === myUid
          return (
            <div key={m.id} style={{alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth:'75%', background: isMe ? '#7C3AED' : '#F2F2F2', color: isMe ? '#fff' : '#111', padding:'8px 12px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', fontSize:'14px'}}>
              {m.text}
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* INPUT - CHAK TAK */}
      <div style={{padding:'8px 10px', borderTop:'1px solid #eee', display:'flex', gap:'8px', alignItems:'center', background:'#fff'}}>
        <input 
          value={text}
          onChange={e=>setText(e.target.value)}
          onKeyDown={e=>{ if(e.key==='Enter') sendMessage() }}
          placeholder="Message..." 
          style={{flex:1, height:'40px', borderRadius:'20px', border:'none', background:'#F2F2F2', padding:'0 16px', outline:'none', fontSize:'14px'}}
        />
        <button onClick={sendMessage} disabled={!text.trim()} style={{width:'40px', height:'40px', borderRadius:'50%', background: text.trim() ? '#7C3AED' : '#ddd', border:'none', color:'#fff', fontWeight:'800', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}

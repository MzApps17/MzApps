'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '../../components/ThemeProvider'
import { auth, db } from '@/app/firebase/config'
import { collection, addDoc, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, getDoc, setDoc, limit } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'

interface Message {
  id: string
  text: string
  senderId: string
  receiverId: string
  createdAt: any
  status: 'sent' | 'delivered' | 'seen'
  chatId: string
}

export default function ChatPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { theme, fontSize } = useTheme() as any
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [myUid, setMyUid] = useState('')
  const [otherUser, setOtherUser] = useState<any>(null)
  const [isOtherOnline, setIsOtherOnline] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const getSize = (base: number) => {
    const f: any = fontSize
    if (typeof f === 'number') return Math.round(base * (f / 16))
    return base
  }

  const formatTime = (d: Date) => {
    let h = d.getHours()
    let m = d.getMinutes()
    let ampm = h >= 12? 'pm' : 'am'
    h = h % 12 || 12
    return `${h}:${m.toString().padStart(2,'0')} ${ampm}`
  }

  const scrollBottom = () => {
    setTimeout(()=> listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' }), 50)
  }

  const getChatId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join('_')
  }

  useEffect(()=>{
    const unsubAuth = onAuthStateChanged(auth, async (u)=>{
      if(!u) { router.replace('/'); return }
      setMyUid(u.uid)

      // Cache first for speed
      const cachedChat = localStorage.getItem(`chat_${id}`)
      if(cachedChat) {
        try { setMessages(JSON.parse(cachedChat)) } catch {}
      }
      const saved = localStorage.getItem('mz_view_user')
      if(saved) setOtherUser(JSON.parse(saved))

      // Get other user info
      try {
        const otherDoc = await getDoc(doc(db, 'users', id))
        if(otherDoc.exists()) {
          setOtherUser(otherDoc.data())
          setIsOtherOnline(otherDoc.data().isOnline || false)
        }
      } catch {}

      // CHAKNA: chatId 1 chiah, limit 100 - a rang ber
      const stableChatId = getChatId(u.uid, id as string)
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', stableChatId),
        orderBy('createdAt', 'desc'),
        limit(100)
      )

      const unsubMsg = onSnapshot(q, { includeMetadataChanges: true }, (snap)=>{
        const list: Message[] = []
        snap.forEach(d=>{
          const data = d.data() as Message
          data.id = d.id
          list.push(data)
        })
        // Desc a la, Asc ah flip - a hnuhnung ber a hnuai ah
        list.reverse()
        setMessages(list)
        scrollBottom()
        localStorage.setItem(`chat_${id}`, JSON.stringify(list))

        // Tick update - batch lo in 1 by 1 lo, a ngai chauhin
        snap.docs.forEach(d=>{
          const data = d.data() as any
          if(data.receiverId === u.uid && data.status!== 'seen') {
            updateDoc(doc(db, 'messages', d.id), { status: 'seen' }).catch(()=>{})
          }
        })
      }, (err)=>{
        const cached = localStorage.getItem(`chat_${id}`)
        if(cached) setMessages(JSON.parse(cached))
      })

      return ()=> unsubMsg()
    })
    return ()=> unsubAuth()
  },[id])

  const handleSend = async () => {
    if(!input.trim() ||!myUid) return
    const text = input.trim()
    setInput('')

    const stableChatId = getChatId(myUid, id as string)
    const tempId = Date.now().toString()
    const optimistic: Message = {
      id: tempId,
      text,
      senderId: myUid,
      receiverId: id as string,
      chatId: stableChatId,
      status: 'sent',
      createdAt: new Date()
    }

    setMessages(prev=>[...prev, optimistic])
    scrollBottom()

    try{
      // Message save
      await addDoc(collection(db, 'messages'), {
        text,
        senderId: myUid,
        receiverId: id,
        chatId: stableChatId,
        status: 'sent',
        createdAt: serverTimestamp()
      })
      // CHAKNA: chat list tan lastMessage update nghal - chat list 0.2s a rang
      const myInfoDoc = await getDoc(doc(db, 'users', myUid))
      const myInfo = myInfoDoc.exists()? myInfoDoc.data() : { name: 'User' }
      await setDoc(doc(db, 'chats', stableChatId), {
        participants: [myUid, id],
        participantsInfo: {
          [myUid]: { name: myInfo.name || 'Me', photoURL: myInfo.photoURL || '' },
          [id as string]: { name: otherUser?.name || 'User', photoURL: otherUser?.photoURL || '' }
        },
        lastMessage: text,
        lastMessageTime: serverTimestamp(),
        lastSenderId: myUid,
        lastStatus: 'sent'
      }, { merge: true })
    }catch(e){
      const queue = JSON.parse(localStorage.getItem('msg_queue') || '[]')
      queue.push({ text, senderId: myUid, receiverId: id, chatId: stableChatId, createdAt: new Date().toISOString() })
      localStorage.setItem('msg_queue', JSON.stringify(queue))
    }
  }

  const Tick = ({ status }: { status: string }) => {
    if(status === 'sent') return <span style={{fontSize:10, color:'#8a8a8a', marginLeft:4, letterSpacing:'-1px'}}>✓</span>
    if(status === 'delivered') return <span style={{fontSize:10, color:'#8a8a8a', marginLeft:4, letterSpacing:'-4px'}}>✓✓</span>
    if(status === 'seen') return <span style={{fontSize:10, color:'#53BDEB', marginLeft:4, letterSpacing:'-4px', fontWeight:900}}>✓✓</span>
    return null
  }

  return (
    <div style={{height:'100dvh', display:'flex', flexDirection:'column', background: theme==='dark'?'#0b141a':'#efeae2'}}>
      <div style={{
        height:58,
        background: theme==='dark'?'#202c33':'#f0f0f0',
        display:'flex',
        alignItems:'center',
        gap:10,
        padding:'0 10px',
        position:'sticky', top:0, zIndex:10
      }}>
        <button onClick={()=>router.back()} style={{border:'none', background:'none', fontSize:22, cursor:'pointer', color: theme==='dark'?'#fff':'#111'}}>←</button>
        <div style={{width:38, height:38, borderRadius:19, background:'#ddd', overflow:'hidden'}}>
          {otherUser?.photoURL? <img src={otherUser.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%'}}>👤</div>}
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800, fontSize: getSize(15), color: theme==='dark'?'#fff':'#111'}}>{otherUser?.name || 'User'}</div>
          <div style={{fontSize: getSize(11), color: theme==='dark'?'#aaa':'#666'}}>{isOtherOnline? 'Online' : 'Offline'}</div>
        </div>
      </div>

      <div ref={listRef} style={{flex:1, overflowY:'auto', padding:'12px 8px', backgroundImage: theme==='dark'? 'none' : 'url(https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png)', backgroundRepeat:'repeat'}}>
        {messages.map(m=>{
          const isMe = m.senderId === myUid
          const time = m.createdAt?.toDate? m.createdAt.toDate() : new Date(m.createdAt)
          return (
            <div key={m.id} style={{display:'flex', justifyContent: isMe? 'flex-end' : 'flex-start', marginBottom:6}}>
              <div style={{
                maxWidth:'78%',
                background: isMe? (theme==='dark'?'#005c4b':'#d9fdd3') : (theme==='dark'?'#202c33':'#fff'),
                color: theme==='dark'? '#fff' : '#111',
                borderRadius: isMe? '12px 0 12px 12px' : '0 12px 12px 12px',
                padding:'6px 8px 4px 10px',
                boxShadow:'0 1px 1px rgba(0,0,0,0.1)',
                display:'flex', flexDirection:'column'
              }}>
                <span style={{fontSize: getSize(14.5), lineHeight:'19px', wordBreak:'break-word'}}>{m.text}</span>
                <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', gap:3, marginTop:2}}>
                  <span style={{fontSize: getSize(10), color: theme==='dark'?'#aaa':'#667781'}}>{formatTime(time)}</span>
                  {isMe && <Tick status={m.status} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{background: theme==='dark'?'#202c33':'#f0f0f0', padding:'6px 8px', display:'flex', gap:8, alignItems:'center'}}>
        <div style={{flex:1, background: theme==='dark'?'#2a3942':'#fff', borderRadius:20, display:'flex', alignItems:'center', padding:'0 12px', minHeight:42}}>
          <input
            value={input}
            onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter') handleSend() }}
            placeholder="Type a message"
            style={{flex:1, border:'none', outline:'none', background:'transparent', fontSize: getSize(15), color: theme==='dark'?'#fff':'#111', padding:'10px 0'}}
          />
        </div>
        <button onClick={handleSend} disabled={!input.trim()} style={{width:46, height:46, borderRadius:23, background:'#7C3AED', border:'none', color:'white', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: input.trim()? 1 : 0.6}}>➤</button>
      </div>
    </div>
  )
      }

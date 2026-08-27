'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '../../components/ThemeProvider'
import { auth, db, storage } from '@/app/firebase/config'
import { collection, addDoc, query, where, onSnapshot, orderBy, doc, updateDoc, serverTimestamp, getDoc, setDoc, limit, arrayUnion } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged } from 'firebase/auth'

interface Message {
  id: string
  text: string
  senderId: string
  receiverId: string
  createdAt: any
  status: 'sent' | 'delivered' | 'seen'
  chatId: string
  imageUrl?: string
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
  const [showDotMenu, setShowDotMenu] = useState(false)
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [uploading, setUploading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getSize = (base: number) => {
    const f = fontSize
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
    if(listRef.current){
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: 'auto' })
    }
  }

  const getChatId = (uid1: string, uid2: string) => {
    return [uid1, uid2].sort().join('_')
  }

  useEffect(()=>{
    const unsubAuth = onAuthStateChanged(auth, async (u)=>{
      if(!u) { router.replace('/'); return }
      setMyUid(u.uid)
      const cachedChat = localStorage.getItem(`chat_${id}`)
      if(cachedChat) {
        try { setMessages(JSON.parse(cachedChat)); setTimeout(scrollBottom, 50) } catch {}
      }
      const saved = localStorage.getItem('mz_view_user')
      if(saved) setOtherUser(JSON.parse(saved))
      try {
        const otherDoc = await getDoc(doc(db, 'users', id))
        if(otherDoc.exists()) {
          setOtherUser(otherDoc.data())
          setIsOtherOnline(otherDoc.data().isOnline || false)
        }
      } catch {}
      const stableChatId = getChatId(u.uid, id as string)
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', stableChatId),
        orderBy('createdAt', 'asc'),
        limit(100)
      )
      const unsubMsg = onSnapshot(q, (snap)=>{
        const list: Message[] = []
        snap.forEach(d=>{
          const data = d.data() as Message
          data.id = d.id
          list.push(data)
        })
        setMessages(list)
        localStorage.setItem(`chat_${id}`, JSON.stringify(list))
        setTimeout(scrollBottom, 100)

        // 3. DELIVERED - app close mahse whatsapp ang in 2 tick
        snap.docs.forEach(d=>{
          const data = d.data() as any
          if(data.receiverId === u.uid && data.status === 'sent') {
            updateDoc(doc(db, 'messages', d.id), { status: 'delivered' }).catch(()=>{})
          }
          if(data.receiverId === u.uid && data.status!== 'seen' && document.visibilityState === 'visible') {
            updateDoc(doc(db, 'messages', d.id), { status: 'seen' }).catch(()=>{})
          }
        })
      }, ()=>{
        const cached = localStorage.getItem(`chat_${id}`)
        if(cached) { setMessages(JSON.parse(cached)); setTimeout(scrollBottom, 50) }
      })
      return ()=> unsubMsg()
    })
    return ()=> unsubAuth()
  },[id])

  useEffect(()=>{ scrollBottom() }, [messages])

  const handleSend = async (overrideText?: string, overrideImage?: string) => {
    const textToSend = overrideText?? input.trim()
    if((!textToSend &&!overrideImage) ||!myUid) return
    if(!overrideImage) setInput('')
    const stableChatId = getChatId(myUid, id as string)
    const tempId = Date.now().toString()
    const optimistic: Message = {
      id: tempId,
      text: textToSend,
      senderId: myUid,
      receiverId: id as string,
      chatId: stableChatId,
      status: 'sent',
      createdAt: new Date(),
      imageUrl: overrideImage
    }
    setMessages(prev=>[...prev, optimistic])
    setTimeout(scrollBottom, 10)
    try{
      const docRef = await addDoc(collection(db, 'messages'), {
        text: textToSend,
        senderId: myUid,
        receiverId: id,
        chatId: stableChatId,
        status: 'sent',
        createdAt: serverTimestamp(),
        imageUrl: overrideImage || null
      })
      // 3. WhatsApp ang - server a thleng rual in delivered nghal
      setTimeout(async ()=>{
        try { await updateDoc(doc(db, 'messages', docRef.id), { status: 'delivered' }) } catch {}
      }, 500)

      const myInfoDoc = await getDoc(doc(db, 'users', myUid))
      const myInfo = myInfoDoc.exists()? myInfoDoc.data() : { name: 'User' }
      await setDoc(doc(db, 'chats', stableChatId), {
        participants: [myUid, id],
        participantsInfo: {
          [myUid]: { name: myInfo.name || 'Me', photoURL: myInfo.photoURL || '' },
          [id as string]: { name: otherUser?.name || 'User', photoURL: otherUser?.photoURL || '' }
        },
        lastMessage: overrideImage? '📷 Image' : textToSend,
        lastMessageTime: serverTimestamp(),
        lastSenderId: myUid,
        lastStatus: 'sent'
      }, { merge: true })
    }catch(e){
      const queue = JSON.parse(localStorage.getItem('msg_queue') || '[]')
      queue.push({ text: textToSend, senderId: myUid, receiverId: id, chatId: stableChatId, imageUrl: overrideImage, createdAt: new Date().toISOString() })
      localStorage.setItem('msg_queue', JSON.stringify(queue))
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if(!file ||!myUid) return
    setUploading(true)
    try {
      const storageRef = ref(storage, `chat_images/${getChatId(myUid, id as string)}/${Date.now()}_${file.name}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await handleSend('', url)
    } catch(err){ alert('Image upload failed') }
    setUploading(false)
    if(fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleBlock = async () => {
    if(!myUid ||!id) return
    setShowDotMenu(false)
    try {
      await updateDoc(doc(db, 'users', myUid), {
        blockedUsers: arrayUnion(id)
      })
      alert('User blocked')
      router.push('/chat')
    } catch {
      const blocked = JSON.parse(localStorage.getItem('blocked_users') || '[]')
      blocked.push(id)
      localStorage.setItem('blocked_users', JSON.stringify(blocked))
      alert('User blocked (offline)')
    }
  }

  const Tick = ({ status }: { status: string }) => {
    if(status === 'sent') return <span style={{fontSize:10, color:'#8a8a8a', marginLeft:4}}>✓</span>
    if(status === 'delivered') return <span style={{fontSize:10, color:'#8a8a8a', marginLeft:4, letterSpacing:'-3px'}}>✓✓</span>
    if(status === 'seen') return <span style={{fontSize:10, color:'#53BDEB', marginLeft:4, letterSpacing:'-3px', fontWeight:900}}>✓✓</span>
    return null
  }

  const filteredMessages = searchQuery? messages.filter(m=> m.text.toLowerCase().includes(searchQuery.toLowerCase())) : messages

  return (
    <div style={{height:'100dvh', display:'flex', flexDirection:'column', background:'#0b141a', position:'relative'}}>
      <div style={{ height:58, background: '#008069', display:'flex', alignItems:'center', gap:10, padding:'0 10px', position:'sticky', top:0, zIndex:30 }}>
        <button onClick={()=>router.push('/chat')} style={{border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', width:36, height:36, borderRadius:18}}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
        <div style={{width:38, height:38, borderRadius:19, background:'#ddd', overflow:'hidden', cursor:'pointer'}} onClick={()=>{ localStorage.setItem('mz_view_user', JSON.stringify(otherUser)); router.push(`/users/${id}`) }}>
          {otherUser?.photoURL? <img src={otherUser.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}}/> : <div style={{display:'flex', alignItems:'center', justifyContent:'center', height:'100%'}}>👤</div>}
        </div>
        <div style={{flex:1, cursor:'pointer'}} onClick={()=>{ localStorage.setItem('mz_view_user', JSON.stringify(otherUser)); router.push(`/users/${id}`) }}>
          <div style={{fontWeight:800, fontSize: getSize(15), color:'#fff'}}>{otherUser?.name || 'User'}</div>
          <div style={{fontSize: getSize(11), color:'#d1e7dd'}}>{isOtherOnline? 'Online' : 'Offline'}</div>
        </div>
        <div style={{position:'relative'}}>
          <button onClick={()=>setShowDotMenu(!showDotMenu)} style={{border:'none', background:'none', cursor:'pointer', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center'}}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
          </button>
          {showDotMenu && (
            <div style={{position:'absolute', right:0, top:40, background:'#233138', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,0.3)', minWidth:190, zIndex:50, overflow:'hidden'}}>
              <button onClick={()=>{ setIsSearchMode(true); setShowDotMenu(false); }} style={{width:'100%', padding:'12px 16px', border:'none', background:'transparent', textAlign:'left', fontSize: getSize(14), fontWeight:600, color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', gap:10}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                Search messages
              </button>
              <button onClick={handleBlock} style={{width:'100%', padding:'12px 16px', border:'none', background:'transparent', textAlign:'left', fontSize: getSize(14), fontWeight:600, color:'#f33', cursor:'pointer', borderTop:'1px solid #334', display:'flex', alignItems:'center', gap:10}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f33" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                Block user
              </button>
            </div>
          )}
        </div>
      </div>

      {isSearchMode && (
        <div style={{background: '#202c33', padding:'10px', display:'flex', gap:8, alignItems:'center', justifyContent:'center'}}>
          {/* 4. Input tawi deuh, lian hret */}
          <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} autoFocus placeholder="Search..." style={{width:'70%', background:'#2a3942', border:'none', borderRadius:22, padding:'12px 18px', outline:'none', color:'#fff', fontSize: getSize(16), fontWeight:600}}/>
          <button onClick={()=>{ setIsSearchMode(false); setSearchQuery('') }} style={{border:'none', background:'#00a884', color:'#fff', fontWeight:700, cursor:'pointer', padding:'10px 16px', borderRadius:20}}>Cancel</button>
        </div>
      )}

      {/* 1. FIX - Message alang thei lo kha - paddingBottom 130 + asc order + auto scroll */}
      <div ref={listRef} style={{
        flex:1,
        overflowY:'auto',
        padding:'12px 8px 140px 8px',
        background: '#111b21',
        backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`,
        backgroundBlendMode: 'overlay',
        backgroundRepeat:'repeat',
      }}>
        {filteredMessages.map(m=>{
          const isMe = m.senderId === myUid
          const time = m.createdAt?.toDate? m.createdAt.toDate() : new Date(m.createdAt)
          return (
            <div key={m.id} style={{display:'flex', justifyContent: isMe? 'flex-end' : 'flex-start', marginBottom:8}}>
              <div style={{
                maxWidth:'78%',
                background: isMe? '#005c4b' : '#202c33',
                color: '#fff',
                borderRadius: isMe? '12px 0 12px 12px' : '0 12px 12px 12px',
                padding: m.imageUrl? '4px' : '7px 8px 4px 10px',
                boxShadow:'0 1px 1px rgba(0,0,0,0.2)',
                display:'flex', flexDirection:'column'
              }}>
                {m.imageUrl && <img src={m.imageUrl} style={{maxWidth:240, borderRadius:8, marginBottom: m.text? 4:0}}/>}
                {m.text && <span style={{fontSize: getSize(14.5), lineHeight:'19px', wordBreak:'break-word'}}>{m.text}</span>}
                <div style={{display:'flex', justifyContent:'flex-end', alignItems:'center', gap:3, marginTop:2}}>
                  <span style={{fontSize: getSize(10), color:'#8696a0'}}>{formatTime(time)}</span>
                  {isMe && <Tick status={m.status} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 2. Image button send lam ah - input pawn ah */}
      <div style={{
        position:'fixed',
        bottom:68,
        left:0, right:0,
        background: '#202c33',
        padding:'6px 8px',
        display:'flex',
        gap:8,
        alignItems:'center',
        zIndex:25,
      }}>
        <div style={{ flex:1, background:'#2a3942', borderRadius:24, display:'flex', alignItems:'center', padding:'0 8px', minHeight:44 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} placeholder={uploading? "Uploading..." : "Message..."} disabled={uploading} style={{flex:1, border:'none', outline:'none', background:'transparent', fontSize: getSize(15), color:'#fff', padding:'10px 6px'}}/>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload}/>
        <button onClick={()=>fileInputRef.current?.click()} style={{width:46, height:46, borderRadius:23, background:'#2a3942', border:'none', color:'#8696a0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8696a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
        </button>
        <button onClick={()=>handleSend()} disabled={!input.trim() || uploading} style={{width:46, height:46, borderRadius:23, background:'#00a884', border:'none', color:'white', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', opacity: input.trim()? 1 : 0.6, flexShrink:0}}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  )
            }

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage(){
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [chats, setChats] = useState<any[]>([])

  useEffect(()=>{
    const saved = localStorage.getItem('mz_chats')
    if(saved) setChats(JSON.parse(saved))
  },[])

  const filtered = chats.filter((c:any)=> c.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{height:'100vh', display:'flex', flexDirection:'column', background:'#fff', paddingBottom:'80px'}}>
      
      {/* HEADER - TAWLH VE LO - FIXED */}
      <div style={{position:'sticky', top:0, zIndex:10, background:'#fff', padding:'12px 16px 12px', borderBottom:'1px solid #eee'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
          <div style={{fontSize:'28px'}}>💬</div>
          <div style={{fontWeight:'900', fontSize:'22px', letterSpacing:'-0.5px'}}>Chat</div>
        </div>

        {/* SEARCH - HIGHLIGHT - TAWLH VE LO */}
        <div style={{
          display:'flex', alignItems:'center',
          background:'#F3E8FF',
          borderLeft:'5px solid #7C3AED',
          borderRadius:'14px',
          padding:'2px 14px',
        }}>
          <span style={{fontSize:'18px'}}>🔍</span>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder="Chat list search..."
            style={{
              flex:1, border:'none', background:'transparent',
              padding:'12px 10px', fontWeight:'700', fontSize:'14px',
              outline:'none', color:'#7C3AED'
            }}
          />
        </div>
      </div>

      {/* CHAT LIST - TAWLH THEIH - SCROLL */}
      <div style={{flex:1, overflowY:'auto'}}>
        {filtered.length===0 ? (
          <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', marginTop:'80px', padding:'20px'}}>
            <div style={{fontSize:'50px'}}>💭</div>
            <div style={{fontWeight:'900', fontSize:'18px', marginTop:'10px'}}>Chat ala awm lo</div>
            <div style={{fontWeight:'600', fontSize:'13px', color:'#999', marginTop:'4px', textAlign:'center'}}>A hnuai dinglam ah + hmet la<br/>thian zawng rawh</div>
          </div>
        ) : (
          filtered.map((c:any)=>(
            <div key={c.id} onClick={()=>router.push(`/chat/${c.id}`)} style={{display:'flex', gap:'12px', padding:'14px 16px', borderBottom:'1px solid #f5f5f5', cursor:'pointer'}}>
              <div style={{width:'52px', height:'52px', borderRadius:'50%', background: c.pic?`url(${c.pic}) center/cover`:'#eee', flexShrink:0}}></div>
              <div style={{flex:1, overflow:'hidden'}}>
                <div style={{display:'flex', justifyContent:'space-between'}}>
                  <div style={{fontWeight:'900', fontSize:'15px'}}>{c.name}</div>
                  <div style={{fontWeight:'700', fontSize:'11px', color:'#999'}}>{c.time}</div>
                </div>
                <div style={{fontWeight:'600', fontSize:'13px', color:'#888', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.lastMsg}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* + BUTTON - DINLAM HNUAI */}
      <button
        onClick={()=>router.push('/users')}
        style={{
          position:'fixed', bottom:'90px', right:'16px',
          width:'56px', height:'56px', borderRadius:'18px',
          background:'#7C3AED', color:'#fff',
          border:'none', fontSize:'28px', fontWeight:'900',
          boxShadow:'0 6px 20px rgba(124,58,237,0.4)',
          zIndex:20
        }}
      >
        +
      </button>
    </div>
  )
              }

'use client'
import { useState } from 'react'
import Link from 'next/link'

const fakePosts = [
  { id: 1, name: 'Lal Muanpuia', username: 'muanpuia', pic: 'https://i.pravatar.cc/150?img=1', time: '2h ago', text: 'Vawiin chu @Zoram nen kan leng chhuak! Aizawl a nuam e 😍', postPic: 'https://picsum.photos/600/400?random=1' },
  { id: 2, name: 'Zoram Chhani', username: 'zoram', pic: 'https://i.pravatar.cc/150?img=2', time: '5h ago', text: 'Mizo nula ka ni, ka hmeltha em? 😘 @muanpuia min lo comment teh', postPic: 'https://picsum.photos/600/400?random=2' },
  { id: 3, name: 'Hmangaihi', username: 'hmangaihi', pic: 'https://i.pravatar.cc/150?img=5', time: '1d ago', text: 'Ka thian thar te nen. MzApps ah hian in awm ve em? @everyone', postPic: '' },
]

export default function HomePage() {
  const [search, setSearch] = useState('')

  const renderText = (text: string) => {
    return text.split(/(@\w+)/g).map((part, i) => {
      if (part.startsWith('@')) {
        return <Link key={i} href={`/profile/${part.substring(1)}`} style={{color:'#2979FF', fontWeight:'800', textDecoration:'none'}}>{part}</Link>
      }
      return part
    })
  }

  return (
    <div style={{background:'#fff', minHeight:'100vh', paddingBottom:'100px'}}>
      {/* HEADER SEARCH - TAWLH LO */}
      <div style={{
        position:'sticky', top:0, zIndex:10,
        background:'#fff', padding:'12px 16px',
        borderBottom:'2px solid #f0f0f0',
        display:'flex', alignItems:'center', gap:'10px'
      }}>
        <h1 style={{fontWeight:'900', fontSize:'22px', margin:0}}>MzApps</h1>
        <input
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          placeholder="🔍 Zawng rawh..."
          style={{
            flex:1, padding:'10px 16px', borderRadius:'20px',
            border:'2px solid #eee', background:'#f5f5f5',
            fontWeight:'700', outline:'none'
          }}
        />
      </div>

      {/* POSTS */}
      <div>
        {fakePosts.filter(p=>p.name.toLowerCase().includes(search.toLowerCase())).map(post => (
          <div key={post.id} style={{borderBottom:'8px solid #f5f5f5', padding:'12px 0'}}>
            <div style={{display:'flex', gap:'10px', padding:'0 16px', alignItems:'center'}}>
              <Link href={`/profile/${post.username}`}>
                <img src={post.pic} style={{width:'44px', height:'44px', borderRadius:'50%', border:'2px solid #111'}} />
              </Link>
              <div>
                <Link href={`/profile/${post.username}`} style={{textDecoration:'none', color:'#111'}}>
                  <div style={{fontWeight:'900', fontSize:'15px'}}>{post.name}</div>
                </Link>
                <div style={{fontWeight:'700', fontSize:'11px', color:'#999'}}>{post.time}</div>
              </div>
            </div>

            <div style={{padding:'10px 16px', fontWeight:'600', fontSize:'15px', lineHeight:'1.4', color:'#222'}}>
              {renderText(post.text)}
            </div>

            {post.postPic && (
              <img src={post.postPic} style={{width:'100%', maxHeight:'400px', objectFit:'cover'}} />
            )}

            <div style={{display:'flex', gap:'20px', padding:'10px 16px', fontWeight:'800'}}>
              <span>❤️ 1.2k</span><span>💬 300</span><span>↗️ Share</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
            }

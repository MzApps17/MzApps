'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/app/firebase/config'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'

export default function ProfilePage(){
  const router = useRouter()
  const [name,setName]=useState('Biaka')
  const [email,setEmail]=useState('')
  const [pic,setPic]=useState('')
  const [postCount,setPostCount]=useState(0)
  const [friendCount,setFriendCount]=useState(0)
  const [posts,setPosts]=useState<any[]>([])
  const [about,setAbout]=useState('💬 MzApps User')
  const [showMenu,setShowMenu]=useState(false)
  const [showEdit,setShowEdit]=useState(false)
  const [editName,setEditName]=useState('')
  const [editAbout,setEditAbout]=useState('')
  const [editPic,setEditPic]=useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const postsRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const load = async()=>{
      const localName = localStorage.getItem('mz_user_name') || 'Biaka'
      const localEmail = localStorage.getItem('mz_user_email') || localStorage.getItem('mz_user') || ''
      const localPic = localStorage.getItem('mz_pic') || ''
      const localAbout = localStorage.getItem('mz_about') || '💬 MzApps User'
      setName(localName); setEmail(localEmail); setPic(localPic); setAbout(localAbout)
      setEditName(localName); setEditAbout(localAbout); setEditPic(localPic)

      const uid = auth.currentUser?.uid
      if(!uid) return
      try{
        const snap = await getDoc(doc(db,"users",uid))
        if(snap.exists()){
          const d=snap.data()
          if(d.name){ setName(d.name); setEditName(d.name) }
          if(d.photoURL){ setPic(d.photoURL); setEditPic(d.photoURL) }
          if(d.about){ setAbout(d.about); setEditAbout(d.about) }
        }
        // POSTS COUNT
        const q1 = query(collection(db,"posts"), where("uid","==",uid))
        const s1 = await getDocs(q1)
        setPostCount(s1.size)
        setPosts(s1.docs.map(doc=>doc.data()))

        // FRIENDS COUNT
        const q2 = query(collection(db,"friends"), where("uid","==",uid))
        const s2 = await getDocs(q2)
        setFriendCount(s2.size)

      }catch{}
    }
    load()
  },[])

  const handlePicChange = (e:any)=>{
    const f=e.target.files?.[0]; if(!f) return
    const r=new FileReader(); r.onload=()=>{ const b=r.result as string; setPic(b); setEditPic(b); localStorage.setItem('mz_pic',b);
      const uid=auth.currentUser?.uid; if(uid) setDoc(doc(db,"users",uid),{photoURL:b},{merge:true})
    }; r.readAsDataURL(f)
  }

  const saveEdit = async()=>{
    if(!editName.trim()) return
    setName(editName); setAbout(editAbout); setPic(editPic)
    localStorage.setItem('mz_user_name',editName)
    localStorage.setItem('mz_about',editAbout)
    if(editPic) localStorage.setItem('mz_pic',editPic)
    const uid=auth.currentUser?.uid
    if(uid) await setDoc(doc(db,"users",uid),{name:editName, about:editAbout, photoURL:editPic},{merge:true})
    setShowEdit(false)
  }

  const handleShare = async()=>{
    const link = `https://mz-apps-mauve.vercel.app/user/${auth.currentUser?.uid}`
    if(navigator.share){ await navigator.share({title:`${name} - MzApps`, url:link}) }
    else { await navigator.clipboard.writeText(link); alert('Link copied: '+link) }
  }

  return <div style={{minHeight:'100vh', background:'#fff', paddingBottom:80}}>
    {/* 1. HEADER - Hming chiah, hamburger chiah */}
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:'1px solid #efefef', position:'sticky', top:0, background:'#fff', zIndex:20}}>
      <span style={{fontWeight:'900', fontSize:'22px'}}>{name}</span>
      <button onClick={()=>setShowMenu(!showMenu)} style={{fontSize:'24px', background:'none', border:'none'}}>☰</button>
    </div>

    {/* Hamburger Menu - Settings + Logout */}
    {showMenu && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:50, display:'flex', justifyContent:'flex-end'}}>
      <div style={{width:'70%', background:'#fff', height:'100%', padding:20}}>
        <button onClick={()=>setShowMenu(false)} style={{float:'right', fontSize:20, border:'none', background:'#eee', borderRadius:20, padding:'6px 12px'}}>✕</button>
        <div style={{marginTop:60, display:'flex', flexDirection:'column', gap:16}}>
          <button onClick={()=>{setShowMenu(false); router.push('/settings')}} style={{display:'flex', gap:12, alignItems:'center', padding:12, border:'none', background:'#f5f5f5', borderRadius:12, fontWeight:700, fontSize:16}}>⚙️ Settings</button>
          <button onClick={()=>{localStorage.setItem('mz_online','false'); localStorage.setItem('mz_logged_out','true'); localStorage.clear(); router.push('/')}} style={{display:'flex', gap:12, alignItems:'center', padding:12, border:'none', background:'#111', color:'#fff', borderRadius:12, fontWeight:700, fontSize:16}}>🚪 Logout</button>
        </div>
      </div>
    </div>}

    <div style={{padding:16}}>
      {/* 3. HMING 0 POST CHUNG AH */}
      <div style={{fontWeight:'800', fontSize:'17px', marginBottom:12}}>{name}</div>

      {/* 2. PIC LIAN, BORDER AWM LO + CLICK THEIH */}
      <div style={{display:'flex', gap:16, alignItems:'center'}}>
        <div style={{position:'relative'}}>
          <div onClick={()=>fileRef.current?.click()} style={{width:100, height:100, borderRadius:'50%', background: pic?`url(${pic}) center/cover`:'#ddd', display:'flex', alignItems:'center', justifyContent:'center', fontSize:40, fontWeight:900, cursor:'pointer'}}>
            {!pic && name[0]?.toUpperCase()}
          </div>
          <div onClick={()=>fileRef.current?.click()} style={{position:'absolute', bottom:0, right:0, width:26, height:26, background:'#7C3AED', borderRadius:'50%', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, cursor:'pointer'}}>+</div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePicChange}/>
        </div>

        {/* 4. 0 POST & 0 FRIENDS CHIAH, CLICK THEIH */}
        <div style={{flex:1, display:'flex', justifyContent:'space-around', textAlign:'center'}}>
          <div onClick={()=>postsRef.current?.scrollIntoView({behavior:'smooth'})} style={{cursor:'pointer'}}>
            <div style={{fontWeight:'900', fontSize:20}}>{postCount}</div>
            <div style={{fontSize:14}}>Posts</div>
          </div>
          <div onClick={()=>router.push('/friends')} style={{cursor:'pointer'}}>
            <div style={{fontWeight:'900', fontSize:20}}>{friendCount}</div>
            <div style={{fontSize:14}}>Friends</div>
          </div>
        </div>
      </div>

      {/* 5. ABOUT ICON MAWI NEN */}
      <div style={{marginTop:14, display:'flex', gap:8, alignItems:'center', background:'#F8F5FF', padding:'10px 12px', borderRadius:12}}>
        <span style={{fontSize:18}}>💭</span>
        <span style={{fontSize:14, fontWeight:500}}>{about}</span>
      </div>
      <div style={{marginTop:6, fontSize:12, color:'#888'}}>{email}</div>

      {/* 6 & 7. EDIT & SHARE */}
      <div style={{display:'flex', gap:8, marginTop:14}}>
        <button onClick={()=>setShowEdit(true)} style={{flex:1, padding:'8px', borderRadius:10, background:'#efefef', border:'none', fontWeight:800, fontSize:14}}>Edit profile</button>
        <button onClick={handleShare} style={{flex:1, padding:'8px', borderRadius:10, background:'#efefef', border:'none', fontWeight:800, fontSize:14}}>Share profile</button>
      </div>
    </div>

    {/* 8. POSTS VEK LANG - SCROLL TARGET */}
    <div ref={postsRef} style={{borderTop:'1px solid #efefef', marginTop:10}}>
      <div style={{display:'flex', justifyContent:'center', padding:'12px 0', gap:80}}>
        <span style={{fontWeight:900, borderBottom:'2px solid #000', paddingBottom:4}}>⊞ POSTS</span>
      </div>
      {posts.length===0? (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2}}>
          {[1,2,3].map(i=> <div key={i} style={{aspectRatio:'1', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc'}}>No posts yet</div>)}
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2}}>
          {posts.map((p,i)=> <div key={i} style={{aspectRatio:'1', background:`url(${p.image || p.photoURL || ''}) center/cover #eee`}}/>)}
        </div>
      )}
    </div>

    {/* 6. EDIT MODAL */}
    {showEdit && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:20}}>
      <div style={{background:'#fff', borderRadius:20, padding:20, width:'100%', maxWidth:360}}>
        <h3 style={{fontWeight:900, textAlign:'center'}}>Edit Profile</h3>
        <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:10, marginTop:12}}>
          <div onClick={()=>fileRef.current?.click()} style={{width:90, height:90, borderRadius:50, background: editPic?`url(${editPic}) center/cover`:'#ddd', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, cursor:'pointer'}}>{!editPic && editName[0]}</div>
          <input value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Name" style={{width:'100%', border:'1.5px solid #ddd', borderRadius:12, padding:'10px 14px'}}/>
          <input value={editAbout} onChange={e=>setEditAbout(e.target.value)} placeholder="About / Bio" style={{width:'100%', border:'1.5px solid #ddd', borderRadius:12, padding:'10px 14px'}}/>
          <div style={{display:'flex', gap:8, width:'100%', marginTop:8}}>
            <button onClick={()=>setShowEdit(false)} style={{flex:1, padding:12, borderRadius:12, border:'none', background:'#eee', fontWeight:700}}>Cancel</button>
            <button onClick={saveEdit} style={{flex:1, padding:12, borderRadius:12, border:'none', background:'#7C3AED', color:'#fff', fontWeight:800}}>Save</button>
          </div>
        </div>
      </div>
    </div>}
  </div>
      }

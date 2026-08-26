'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { auth, db } from '@/app/firebase/config'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'

export default function ProfilePage(){
  const router = useRouter()
  const [name,setName]=useState('Biaka')
  const [email,setEmail]=useState('laldinpuii333@gmail.com')
  const [pic,setPic]=useState('')
  const [postCount,setPostCount]=useState(0)
  const [friendCount,setFriendCount]=useState(0)
  const [picUploadCount,setPicUploadCount]=useState(0)
  const [posts,setPosts]=useState<any[]>([])
  const [bio,setBio]=useState('')
  const [dob,setDob]=useState('')
  const [hobby,setHobby]=useState('')
  const [games,setGames]=useState('')
  const [phone,setPhone]=useState('')
  const [country,setCountry]=useState('')
  const [state,setState]=useState('')
  const [village,setVillage]=useState('')
  const [phonePublic,setPhonePublic]=useState(false)
  const [emailPublic,setEmailPublic]=useState(false)
  const [showMenu,setShowMenu]=useState(false)
  const [showEdit,setShowEdit]=useState(false)
  const [showPicView,setShowPicView]=useState(false)
  const [editData,setEditData]=useState({bio:'',dob:'',hobby:'',games:'',phone:'',country:'',state:'',village:'',phonePublic:false,emailPublic:false,name:'',pic:''})
  const fileRef=useRef<HTMLInputElement>(null)
  const picUploadRef=useRef<HTMLInputElement>(null)
  const postsRef=useRef<HTMLDivElement>(null)

  useEffect(()=>{
    const load=async()=>{
      const localName=localStorage.getItem('mz_user_name')||'Biaka'
      const localEmail=localStorage.getItem('mz_user_email')||'laldinpuii333@gmail.com'
      const localPic=localStorage.getItem('mz_pic')||''
      setName(localName); setEmail(localEmail); setPic(localPic)
      setBio(localStorage.getItem('mz_bio')||''); setDob(localStorage.getItem('mz_dob')||''); setHobby(localStorage.getItem('mz_hobby')||''); setGames(localStorage.getItem('mz_games')||''); setPhone(localStorage.getItem('mz_phone')||''); setCountry(localStorage.getItem('mz_country')||''); setState(localStorage.getItem('mz_state')||''); setVillage(localStorage.getItem('mz_village')||'');
      setPhonePublic(localStorage.getItem('mz_phone_pub')==='1'); setEmailPublic(localStorage.getItem('mz_email_pub')==='1')
      setEditData({bio:localStorage.getItem('mz_bio')||'',dob:localStorage.getItem('mz_dob')||'',hobby:localStorage.getItem('mz_hobby')||'',games:localStorage.getItem('mz_games')||'',phone:localStorage.getItem('mz_phone')||'',country:localStorage.getItem('mz_country')||'',state:localStorage.getItem('mz_state')||'',village:localStorage.getItem('mz_village')||'',phonePublic:localStorage.getItem('mz_phone_pub')==='1',emailPublic:localStorage.getItem('mz_email_pub')==='1',name:localName,pic:localPic})
      const uid=auth.currentUser?.uid; if(!uid) return
      try{
        const snap=await getDoc(doc(db,"users",uid))
        if(snap.exists()){
          const d=snap.data();
          if(d.name) setName(d.name); if(d.photoURL) setPic(d.photoURL)
          if(d.bio) setBio(d.bio); if(d.dob) setDob(d.dob); if(d.hobby) setHobby(d.hobby); if(d.games) setGames(d.games); if(d.phone) setPhone(d.phone); if(d.country) setCountry(d.country); if(d.state) setState(d.state); if(d.village) setVillage(d.village)
          if(d.phonePublic!==undefined) setPhonePublic(d.phonePublic); if(d.emailPublic!==undefined) setEmailPublic(d.emailPublic)
          setEditData({bio:d.bio||'',dob:d.dob||'',hobby:d.hobby||'',games:d.games||'',phone:d.phone||'',country:d.country||'',state:d.state||'',village:d.village||'',phonePublic:d.phonePublic||false,emailPublic:d.emailPublic||false,name:d.name||localName,pic:d.photoURL||localPic})
        }
        const q1=query(collection(db,"posts"), where("uid","==",uid)); const s1=await getDocs(q1); setPostCount(s1.size); setPosts(s1.docs.map(d=>d.data())); setPicUploadCount(s1.size)
        const q2=query(collection(db,"friends"), where("uid","==",uid)); const s2=await getDocs(q2); setFriendCount(s2.size)
      }catch{}
    }; load()
  },[])

  const handlePicChange=(e:any)=>{
    const f=e.target.files?.[0]; if(!f) return
    const r=new FileReader(); r.onload=()=>{const b=r.result as string; setPic(b); setEditData({...editData,pic:b}); localStorage.setItem('mz_pic',b); const uid=auth.currentUser?.uid; if(uid) setDoc(doc(db,"users",uid),{photoURL:b},{merge:true})}; r.readAsDataURL(f)
  }

  const handlePicUpload=(e:any)=>{
    const f=e.target.files?.[0]; if(!f) return
    const r=new FileReader(); r.onload=async()=>{const b=r.result as string; const uid=auth.currentUser?.uid; if(uid){const id=Date.now().toString(); await setDoc(doc(db,"posts",id),{uid,image:b,createdAt:Date.now()}); setPostCount(c=>c+1); setPicUploadCount(c=>c+1); setPosts(p=>[{image:b},...p]) }}; r.readAsDataURL(f)
  }

  const saveEdit=async()=>{
    setName(editData.name); setBio(editData.bio); setDob(editData.dob); setHobby(editData.hobby); setGames(editData.games); setPhone(editData.phone); setCountry(editData.country); setState(editData.state); setVillage(editData.village); setPhonePublic(editData.phonePublic); setEmailPublic(editData.emailPublic); if(editData.pic) setPic(editData.pic)
    localStorage.setItem('mz_user_name',editData.name); localStorage.setItem('mz_bio',editData.bio); localStorage.setItem('mz_dob',editData.dob); localStorage.setItem('mz_hobby',editData.hobby); localStorage.setItem('mz_games',editData.games); localStorage.setItem('mz_phone',editData.phone); localStorage.setItem('mz_country',editData.country); localStorage.setItem('mz_state',editData.state); localStorage.setItem('mz_village',editData.village); localStorage.setItem('mz_phone_pub',editData.phonePublic?'1':'0'); localStorage.setItem('mz_email_pub',editData.emailPublic?'1':'0'); if(editData.pic) localStorage.setItem('mz_pic',editData.pic)
    const uid=auth.currentUser?.uid; if(uid) await setDoc(doc(db,"users",uid),{name:editData.name,bio:editData.bio,dob:editData.dob,hobby:editData.hobby,games:editData.games,phone:editData.phone,country:editData.country,state:editData.state,village:editData.village,phonePublic:editData.phonePublic,emailPublic:editData.emailPublic,photoURL:editData.pic},{merge:true})
    setShowEdit(false)
  }

  // 2. ICON TI TE HRET
  const Icon = ({children}:{children:any}) => <span style={{width:24, height:24, background:'#7C3AED', borderRadius:6, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, marginRight:8}}>{children}</span>

  return <div style={{minHeight:'100vh', background:'#fff', paddingBottom:80}}>
    <style>{`.mz-input:focus{outline:2px solid #7C3AED!important;border-color:#7C3AED!important;} *{box-sizing:border-box}`}</style>

    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 12px', borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#fff', zIndex:20}}>
      <span style={{fontWeight:900, fontSize:22}}>{name}</span>
      <button onClick={()=>setShowMenu(!showMenu)} style={{background:'none', border:'none', fontSize:28, lineHeight:1}}>☰</button>
    </div>

    {showMenu && <><div onClick={()=>setShowMenu(false)} style={{position:'fixed', inset:0, zIndex:40}}/>
    <div style={{position:'fixed', top:44, right:10, width:180, background:'#fff', borderRadius:16, boxShadow:'0 8px 30px rgba(0,0,0,0.15)', zIndex:50, overflow:'hidden'}}>
      <button onClick={()=>{setShowMenu(false); router.push('/settings')}} style={{width:'100%', display:'flex', alignItems:'center', gap:10, padding:'14px 16px', border:'none', background:'#fff', fontSize:16, fontWeight:500, cursor:'pointer'}}>
        <span style={{width:26,height:26,background:'#7C3AED',borderRadius:8,display:'inline-flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>⚙</span> Setting
      </button>
      <button onClick={()=>{localStorage.clear(); router.push('/')}} style={{width:'100%', display:'flex', alignItems:'center', gap:10, padding:'14px 16px', border:'none', background:'#fff', fontSize:16, fontWeight:600, color:'#ff3b30', cursor:'pointer'}}>
        <span style={{width:26,height:26,background:'#ff3b30',borderRadius:8,display:'inline-flex',alignItems:'center',justifyContent:'center',color:'#fff'}}>↪</span> Logout
      </button>
    </div></>}

    <div style={{padding:12}}>
      <div style={{display:'flex', gap:10, alignItems:'flex-start'}}>
        <div style={{position:'relative'}}>
          <div onClick={()=>setShowPicView(true)} style={{width:86, height:86, borderRadius:'50%', background: pic?`url(${pic}) center/cover`:'#ddd', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:32, cursor:'pointer'}}>{!pic && name[0]}</div>
          <div onClick={()=>fileRef.current?.click()} style={{position:'absolute', bottom:-2, right:-2, width:26, height:26, background:'#7C3AED', borderRadius:'50%', border:'2px solid #fff', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:900, cursor:'pointer'}}>+</div>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePicChange}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:800, fontSize:15, marginBottom:6}}>{name}</div>
          <div style={{display:'flex', textAlign:'center', marginTop:10, paddingLeft:0, gap:2}}>
            <div onClick={()=>postsRef.current?.scrollIntoView({behavior:'smooth'})} style={{flex:1, cursor:'pointer'}}><div style={{fontWeight:900, fontSize:18}}>{postCount}</div><div style={{fontSize:13}}>Posts</div></div>
            <div onClick={()=>router.push('/friends')} style={{flex:1, cursor:'pointer'}}><div style={{fontWeight:900, fontSize:18}}>{friendCount}</div><div style={{fontSize:13}}>Friends</div></div>
            <div onClick={()=>picUploadRef.current?.click()} style={{flex:1, cursor:'pointer'}}><div style={{fontWeight:900, fontSize:18}}>{picUploadCount}</div><div style={{fontSize:13}}>Pics</div></div>
            <input ref={picUploadRef} type="file" accept="image/*" hidden onChange={handlePicUpload}/>
          </div>
        </div>
      </div>

      <div style={{marginTop:42, display:'flex', flexDirection:'column', gap:12}}>
        <div style={{fontWeight:900, fontSize:18, display:'flex', alignItems:'center'}}><Icon>📝</Icon> About</div>
        {/* 1. ABOUT LEH LINE INKAR TI ZIM */}
        <div style={{borderBottom:'1px solid #eee', margin:'0 0 0 32px'}}></div>
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>📖</Icon> <span>Bio: <b>{bio || 'Not set'}</b></span></div>
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>🎂</Icon> <span>DOB: <b>{dob || 'Not set'}</b></span></div>
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>🎨</Icon> <span>Hobby: <b>{hobby || 'Not set'}</b></span></div>
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>🎮</Icon> <span>Games: <b>{games || 'Not set'}</b></span></div>
        {/* 3. COUNTRY STATE VILLAGE */}
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>🌍</Icon> <span>Country: <b>{country || 'Not set'}</b></span></div>
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>🏙️</Icon> <span>State: <b>{state || 'Not set'}</b></span></div>
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>🏡</Icon> <span>Village: <b>{village || 'Not set'}</b></span></div>
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>📞</Icon> <span>Phone: <b>{phone? (phonePublic? phone : '•••••• (Private)') : 'Not set'}</b></span></div>
        <div style={{fontSize:16, display:'flex', alignItems:'center'}}><Icon>✉️</Icon> <span>Email: <b>{emailPublic? email : '•••••• (Private)'}</b></span></div>
      </div>

      <div style={{display:'flex', gap:8, marginTop:28}}>
        <button onClick={()=>setShowEdit(true)} style={{flex:1, padding:'11px', borderRadius:10, background:'#efefef', border:'none', fontWeight:800, fontSize:15}}>Edit profile</button>
        <button onClick={async()=>{const link=`https://mz-apps-mauve.vercel.app/user/${auth.currentUser?.uid}`; if(navigator.share) await navigator.share({title:name, url:link}); else {await navigator.clipboard.writeText(link); alert('Copied!')}}} style={{flex:1, padding:'11px', borderRadius:10, background:'#efefef', border:'none', fontWeight:800, fontSize:15}}>Share profile</button>
      </div>
    </div>

    <div ref={postsRef} style={{marginTop:26}}>
      <div style={{display:'flex', justifyContent:'center', padding:'14px 0'}}><span style={{fontWeight:900, borderBottom:'2px solid #000', paddingBottom:4, fontSize:18}}>⊞ POSTS</span></div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:2}}>
        {posts.length===0? [1,2,3].map(i=><div key={i} style={{aspectRatio:'1', background:'#fafafa', display:'flex', alignItems:'center', justifyContent:'center', color:'#ccc', fontSize:14}}>No posts</div>) : posts.map((p,i)=><div key={i} style={{aspectRatio:'1', background:`url(${p.image}) center/cover #eee`}}/>)}
      </div>
    </div>

    {showPicView && <div onClick={()=>setShowPicView(false)} style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.9)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center'}}><img src={pic} style={{maxWidth:'90%', maxHeight:'90%', borderRadius:12}}/></div>}

    {showEdit && <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:90, display:'flex', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto'}}>
      <div style={{background:'#fff', borderRadius:20, padding:18, width:'100%', maxWidth:380, maxHeight:'90vh', overflowY:'auto'}}>
        <h3 style={{fontWeight:900, textAlign:'center'}}>Edit Profile</h3>
        <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:12}}>
          <input className="mz-input" value={editData.name} onChange={e=>setEditData({...editData,name:e.target.value})} placeholder="Name" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, width:'100%'}}/>
          <textarea className="mz-input" value={editData.bio} onChange={e=>setEditData({...editData,bio:e.target.value})} placeholder="Bio" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, width:'100%'}}/>
          <div style={{width:'100%'}}>
            <div style={{fontSize:12, fontWeight:700, marginBottom:4, color:'#555'}}>DOB</div>
            <input className="mz-input" type="date" value={editData.dob} onChange={e=>setEditData({...editData,dob:e.target.value})} style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, width:'100%'}}/>
          </div>
          <input className="mz-input" value={editData.hobby} onChange={e=>setEditData({...editData,hobby:e.target.value})} placeholder="Hobby" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, width:'100%'}}/>
          <input className="mz-input" value={editData.games} onChange={e=>setEditData({...editData,games:e.target.value})} placeholder="Games" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, width:'100%'}}/>
          <input className="mz-input" value={editData.country} onChange={e=>setEditData({...editData,country:e.target.value})} placeholder="Country" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, width:'100%'}}/>
          <input className="mz-input" value={editData.state} onChange={e=>setEditData({...editData,state:e.target.value})} placeholder="State" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, width:'100%'}}/>
          <input className="mz-input" value={editData.village} onChange={e=>setEditData({...editData,village:e.target.value})} placeholder="Village" style={{border:'1.5px solid #ddd', borderRadius:10, padding:10, width:'100%'}}/>
          <div style={{display:'flex', gap:8, width:'100%'}}><input className="mz-input" value={editData.phone} onChange={e=>setEditData({...editData,phone:e.target.value})} placeholder="Phone" style={{flex:1, border:'1.5px solid #ddd', borderRadius:10, padding:10}}/><label style={{display:'flex', alignItems:'center', gap:4, fontSize:12}}><input type="checkbox" checked={editData.phonePublic} onChange={e=>setEditData({...editData,phonePublic:e.target.checked})}/>Public</label></div>
          <div style={{display:'flex', gap:8, alignItems:'center', background:'#f5f5f5', padding:10, borderRadius:10, width:'100%'}}><span style={{flex:1, fontSize:13, color:'#666'}}>Email: {email} (Can't edit)</span><label style={{display:'flex', alignItems:'center', gap:4, fontSize:12}}><input type="checkbox" checked={editData.emailPublic} onChange={e=>setEditData({...editData,emailPublic:e.target.checked})}/>Public</label></div>
          <div style={{display:'flex', gap:8, marginTop:6, width:'100%'}}><button onClick={()=>setShowEdit(false)} style={{flex:1, padding:12, borderRadius:12, border:'none', background:'#eee', fontWeight:700}}>Cancel</button><button onClick={saveEdit} style={{flex:1, padding:12, borderRadius:12, border:'none', background:'#7C3AED', color:'#fff', fontWeight:800}}>Save</button></div>
        </div>
      </div>
    </div>}
  </div>
                       }

'use client'
export default function ChatPage(){
  return <div style={{padding:'20px', paddingBottom:'90px', background:'#fff', minHeight:'100vh'}}>
    <div style={{fontWeight:'900', fontSize:'22px', marginBottom:'16px'}}>Chat 💬</div>
    {[1,2,3].map(i=><div key={i} style={{display:'flex', gap:'12px', padding:'14px', borderBottom:'1px solid #eee'}}>
      <div style={{width:'50px', height:'50px', borderRadius:'50%', background:'#eee'}}></div>
      <div><div style={{fontWeight:'900'}}>Thian {i}</div><div style={{fontWeight:'600', fontSize:'13px', color:'#888'}}>Last message...</div></div>
    </div>)}
  </div>
}

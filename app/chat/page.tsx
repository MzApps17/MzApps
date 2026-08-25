'use client'
export default function ChatPage(){
  return <div style={{padding:'20px', paddingBottom:'100px', minHeight:'100vh', background:'#fff'}}>
    <h1 style={{fontWeight:'900', fontSize:'24px'}}>Chat 💬</h1>
    <div style={{marginTop:'16px', background:'#F3E8FF', padding:'14px', borderRadius:'14px', borderLeft:'4px solid #7C3AED', fontWeight:'800', color:'#7C3AED'}}>Active tute an lang ang</div>
    {[1,2,3].map(i=><div key={i} style={{padding:'14px', borderBottom:'1px solid #eee', display:'flex', gap:'12px'}}><div style={{width:'44px', height:'44px', borderRadius:'50%', background:'#eee'}}></div><div><div style={{fontWeight:'900'}}>Thian {i}</div><div style={{fontSize:'12px', color:'#999'}}>Hey eng nge i tih?</div></div></div>)}
  </div>
}

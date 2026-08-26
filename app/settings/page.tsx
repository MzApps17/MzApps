'use client'
import { useRouter } from 'next/navigation'
import { useTheme } from '../components/ThemeProvider'

export default function SettingsPage(){
  const router = useRouter()
  const { theme, fontSize, setTheme, setFontSize } = useTheme()

  return (
    <div style={{minHeight:'100vh', paddingBottom:'90px', background: theme==='dark'?'#111':'#FAFAFA'}}>
      <div style={{padding:'16px', background: theme==='dark'?'#222':'#fff', borderBottom:'1px solid #eee', display:'flex', alignItems:'center', gap:'12px', position:'sticky', top:0, zIndex:10}}>
        <button onClick={()=>router.back()} style={{width:'36px', height:'36px', borderRadius:'10px', border:'1px solid #eee', background:'#fff', fontWeight:'900'}}>←</button>
        <div style={{fontWeight:'900', fontSize:'20px'}}>Settings ⚙️</div>
      </div>

      <div style={{padding:'16px'}}>

        {/* DARK MODE */}
        <div style={{background: theme==='dark'?'#222':'#fff', borderRadius:'20px', padding:'18px', marginBottom:'14px', border: theme==='dark'?'1px solid #333':'1px solid #eee'}}>
          <div style={{fontWeight:'900', fontSize:'16px', marginBottom:'12px'}}>🌙 Dark Mode</div>
          <div style={{display:'flex', gap:'10px'}}>
            <button onClick={()=>setTheme('light')} style={{flex:1, padding:'14px', borderRadius:'14px', border: theme==='light'?'3px solid #7C3AED':'2px solid #eee', background: theme==='light'?'#F3E8FF':'#fff', fontWeight:'900', color: theme==='light'?'#7C3AED':'#999'}}>☀️ LIGHT</button>
            <button onClick={()=>setTheme('dark')} style={{flex:1, padding:'14px', borderRadius:'14px', border: theme==='dark'?'3px solid #7C3AED':'2px solid #eee', background: theme==='dark'?'#333':'#fff', fontWeight:'900', color: theme==='dark'?'#fff':'#999'}}>🌙 DARK</button>
          </div>
        </div>

        {/* FONT SIZE */}
        <div style={{background: theme==='dark'?'#222':'#fff', borderRadius:'20px', padding:'18px', marginBottom:'14px', border: theme==='dark'?'1px solid #333':'1px solid #eee'}}>
          <div style={{fontWeight:'900', fontSize:'16px', marginBottom:'12px'}}>🔤 Font Size</div>
          <div style={{display:'flex', gap:'10px'}}>
            {(['small','medium','large'] as const).map(f=>(
              <button key={f} onClick={()=>setFontSize(f)} style={{flex:1, padding:'14px', borderRadius:'14px', border: fontSize===f?'3px solid #7C3AED':'2px solid #eee', background: fontSize===f?'#F3E8FF':'#fff', fontWeight:'900', color: fontSize===f?'#7C3AED':'#999', fontSize: f==='small'? '12px' : f==='large'? '18px' : '14px'}}>
                {f.toUpperCase()}
              </button>
            ))}
          </div>
          <div style={{marginTop:'12px', padding:'12px', background:'#f5f5f5', borderRadius:'10px', fontWeight:'600', fontSize:'13px', color:'#555', textAlign:'center'}}>
            Preview: Hei hi font size anih hi!
          </div>
        </div>

        <div style={{textAlign:'center', marginTop:'30px', fontWeight:'800', fontSize:'12px', color:'#999'}}>
          Setting hian page TIN a control ang!<br/>Dark Mode + Font Size = Global!
        </div>

      </div>
    </div>
  )
}

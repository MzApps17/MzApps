'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { name: 'Home', path: '/home', icon: '🏠' },
  { name: 'Chat', path: '/chat', icon: '💬' },
  { name: 'Status', path: '/status', icon: '⭕' },
  { name: 'Online', path: '/online', icon: '🟢' },
  { name: 'Profile', path: '/profile', icon: '👤' },
]

export default function Footer() {
  const pathname = usePathname()
  return (
    <div style={{
      position:'fixed', bottom:0, left:0, right:0,
      background:'#111', borderTop:'1px solid #333',
      display:'flex', justifyContent:'space-around',
      padding:'10px 0', zIndex:50
    }}>
      {tabs.map(t => {
        const active = pathname === t.path
        return (
          <Link key={t.path} href={t.path} style={{
            display:'flex', flexDirection:'column', alignItems:'center',
            color: active ? '#25D366' : '#aaa', textDecoration:'none', fontSize:'12px'
          }}>
            <span style={{fontSize:'22px'}}>{t.icon}</span>
            <span style={{fontWeight: active ? 'bold' : 'normal'}}>{t.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from './ThemeProvider'

export default function Footer() {
  const pathname = usePathname()
  const { theme } = useTheme()
  if (pathname === '/' || pathname.startsWith('/settings')) return null

  const tabs = [
    { name: 'HOME', path: '/home', icon: '🏠' },
    { name: 'CHAT', path: '/chat', icon: '💬' },
    { name: 'STATUS', path: '/status', icon: '⭕' },
    { name: 'ONLINE', path: '/online', icon: '🟢' },
    { name: 'GROUPS', path: '/groups', icon: '👥' },
    { name: 'PROFILE', path: '/profile', icon: '👤' },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: theme==='dark'? '#1A1A1A' : '#FFFFFF',
      borderTop: theme==='dark'? '1px solid #333' : '1px solid #E5E7EB',
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      padding: '3px 6px 2px 6px',
      gap: '2px',
      zIndex: 999,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
        return (
          <Link key={tab.path} href={tab.path} style={{textDecoration: 'none'}}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'center', gap: '3px',
              background: isActive? (theme==='dark'?'#2D1B4E':'#F3E8FF') : 'transparent',
              borderBottom: isActive? '3px solid #7C3AED' : '3px solid transparent',
              borderRadius: '10px',
              padding: '5px 2px 3px 2px',
              width:'100%',
              boxSizing:'border-box',
            }}>
              <div style={{
                width:'28px', height:'28px', borderRadius:'7px',
                background: isActive?'#7C3AED': (theme==='dark'?'#333':'#F3F4F6'),
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px', flexShrink:0
              }}>
                <span style={{filter: isActive?'brightness(0) invert(1)':'none'}}>{tab.icon}</span>
              </div>
              <span style={{
                fontWeight:'900', 
                fontSize:'11.5px',
                lineHeight:'1',
                letterSpacing:'0px',
                color: isActive?'#7C3AED': (theme==='dark'?'#888':'#8B8B8B'),
                whiteSpace:'nowrap'
              }}>{tab.name}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

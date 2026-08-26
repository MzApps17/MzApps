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
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '2px 0 1px 0',
      zIndex: 999,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
        return (
          <Link key={tab.path} href={tab.path} style={{textDecoration: 'none', flex:1, display:'flex', justifyContent:'center'}}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              background: isActive? (theme==='dark'?'#2D1B4E':'#F3E8FF') : 'transparent',
              borderBottom: isActive? '3px solid #7C3AED' : '3px solid transparent',
              borderRadius: '10px',
              padding: '4px 10px 3px 10px',
              minWidth:'48px',
            }}>
              <div style={{
                width:'28px', height:'28px', borderRadius:'7px',
                background: isActive?'#7C3AED': (theme==='dark'?'#333':'#F3F4F6'),
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'15px'
              }}>
                <span style={{filter: isActive?'brightness(0) invert(1)':'none'}}>{tab.icon}</span>
              </div>
              <span style={{
                fontWeight:'900', 
                fontSize:'11px',
                letterSpacing:'0.2px',
                color: isActive?'#7C3AED': (theme==='dark'?'#666':'#9CA3AF')
              }}>{tab.name}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

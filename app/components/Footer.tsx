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
      padding: '4px 6px 4px 6px',
      gap: '2px',
      zIndex: 999,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
        return (
          <Link key={tab.path} href={tab.path} style={{textDecoration: 'none', display:'flex', justifyContent:'center'}}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent:'center', gap: '3px',
              // HIGHLIGHT ZIM - ding leh vei
              background: isActive? (theme==='dark'?'#2D1B4E':'#F3E8FF') : 'transparent',
              borderRadius: '12px',
              padding: isActive? '4px 10px' : '4px 2px',
              width: isActive? 'auto' : '100%',
              minWidth: isActive? '52px' : 'auto',
              maxWidth: isActive? '62px' : '100%',
              boxSizing:'border-box',
              borderBottom: 'none',
            }}>
              <div style={{
                width:'36px', height:'36px', borderRadius:'9px',
                // BUTTON COLOUR - zawng zawng highlight ang vek #7C3AED
                background: '#7C3AED',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0
              }}>
                <span style={{filter: 'brightness(0) invert(1)'}}>{tab.icon}</span>
              </div>
              <span style={{
                fontWeight: isActive? '900' : '700', 
                fontSize:'13px',
                lineHeight:'1',
                letterSpacing:'0px',
                // FONTS COLOUR - zawng zawng highlight ang vek #7C3AED
                color: '#7C3AED',
                whiteSpace:'nowrap'
              }}>{tab.name}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

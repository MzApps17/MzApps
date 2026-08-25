'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  if (pathname === '/') return null

  const tabs = [
    { name: 'HOME', path: '/home', icon: '🏠' },
    { name: 'CHAT', path: '/chat', icon: '💬' },
    { name: 'STATUS', path: '/status', icon: '⭕' },
    { name: 'ONLINE', path: '/online', icon: '🟢' },
    { name: 'PROFILE', path: '/profile', icon: '👤' },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#FFFFFF', borderTop: '1px solid #E5E7EB',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '6px 0 8px 0', zIndex: 999,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')

        return (
          <Link key={tab.path} href={tab.path} style={{textDecoration: 'none', flex:1}}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
              background: isActive? '#F3E8FF' : 'transparent',
              borderLeft: isActive? '4px solid #7C3AED' : '4px solid transparent',
              borderRadius: '12px',
              margin: '0 4px',
              padding: '8px 0 6px 0',
              transition: 'all 0.2s'
            }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: isActive? '#7C3AED' : '#F3F4F6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '18px'
              }}>
                <span style={{filter: isActive? 'brightness(0) invert(1)' : 'none'}}>{tab.icon}</span>
              </div>
              <span style={{
                fontWeight: '900',
                fontSize: '10px',
                letterSpacing: '0.8px',
                color: isActive? '#7C3AED' : '#9CA3AF',
                fontFamily: 'Arial Black, Arial, sans-serif'
              }}>{tab.name}</span>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

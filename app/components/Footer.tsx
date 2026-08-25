'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  if (pathname === '/') return null

  const tabs = [
    { name: 'HOME', path: '/home', icon: '🏠', bg: '#FFF3E0' },
    { name: 'CHAT', path: '/chat', icon: '💬', bg: '#E8F5E9' },
    { name: 'STATUS', path: '/status', icon: '⭕', bg: '#FCE4EC' },
    { name: 'ONLINE', path: '/online', icon: '🟢', bg: '#E8F5E9' },
    { name: 'PROFILE', path: '/profile', icon: '👤', bg: '#E3F2FD' },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#FFFFFF', borderTop: '2px solid #111',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '8px 0 10px 0', zIndex: 999,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.path)
        return (
          <Link key={tab.path} href={tab.path} style={{textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'}}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '14px',
              background: isActive ? '#111' : tab.bg,
              border: isActive ? '2px solid #111' : '2px solid transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isActive ? '22px' : '20px',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s'
            }}>
              <span style={{filter: isActive ? 'invert(1)' : 'none'}}>{tab.icon}</span>
            </div>
            <span style={{
              fontWeight: '900',
              fontSize: isActive ? '12px' : '11px',
              letterSpacing: '0.5px',
              color: isActive ? '#111' : '#9E9E9E',
              fontFamily: 'Arial Black, Arial, sans-serif',
              borderBottom: isActive ? '2px solid #111' : 'none',
              paddingBottom: isActive ? '1px' : '0'
            }}>{tab.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

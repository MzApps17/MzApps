'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  if (pathname === '/') return null

  const tabs = [
    { name: 'Home', path: '/home', icon: '🏠', bg: '#FFF3E0' },
    { name: 'Chat', path: '/chat', icon: '💬', bg: '#E8F5E9' },
    { name: 'Status', path: '/status', icon: '⭕', bg: '#FCE4EC' },
    { name: 'Online', path: '/online', icon: '🟢', bg: '#E8F5E9' },
    { name: 'Profile', path: '/profile', icon: '👤', bg: '#E3F2FD' },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: '#FFFFFF', borderTop: '2px solid #EEEEEE',
      display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '6px 0 8px 0', zIndex: 999,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path
        return (
          <Link key={tab.path} href={tab.path} style={{textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px'}}>
            <div style={{width: '38px', height: '38px', borderRadius: '12px', background: tab.bg, border: isActive? '2.5px solid #111' : '2px solid transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'}}>{tab.icon}</div>
            <span style={{fontWeight: '900', fontSize: '13px', letterSpacing: '0.5px', textTransform: 'uppercase', color: isActive? '#111' : '#9E9E9E', fontFamily: 'Arial Black, Arial, sans-serif'}}>{tab.name}</span>
          </Link>
        )
      })}
    </div>
  )
}

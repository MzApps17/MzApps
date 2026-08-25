'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()

  const tabs = [
    { 
      name: 'Home', 
      path: '/home', 
      icon: '🏠',
      activeColor: '#000',
      bg: '#FFF3E0'
    },
    { 
      name: 'Chat', 
      path: '/chat', 
      icon: '💬',
      activeColor: '#000',
      bg: '#E8F5E9'
    },
    { 
      name: 'Status', 
      path: '/status', 
      icon: '⭕',
      activeColor: '#000',
      bg: '#FCE4EC'
    },
    { 
      name: 'Online', 
      path: '/online', 
      icon: '🟢',
      activeColor: '#000',
      bg: '#E8F5E9'
    },
    { 
      name: 'Profile', 
      path: '/profile', 
      icon: '👤',
      activeColor: '#000',
      bg: '#E3F2FD'
    },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#FFFFFF',
      borderTop: '2px solid #EEEEEE',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '10px 0 12px 0',
      zIndex: 999,
    }}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (pathname === '/' && tab.path === '/home')
        return (
          <Link
            key={tab.path}
            href={tab.path}
            style={{
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: tab.bg,
                border: isActive ? '3px solid #111111' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                fontWeight: 'bold',
              }}
            >
              {tab.icon}
            </div>
            <span
              style={{
                fontWeight: '900',
                fontSize: '11px',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: isActive ? '#111111' : '#9E9E9E',
                fontFamily: 'Arial, sans-serif',
              }}
            >
              {tab.name}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

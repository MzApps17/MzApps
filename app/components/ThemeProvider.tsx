'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
type FontSize = 'small' | 'medium' | 'large'

interface ThemeContextType {
  theme: Theme
  fontSize: FontSize
  setTheme: (t: Theme) => void
  setFontSize: (f: FontSize) => void
}

const ThemeContext = createContext<ThemeContextType>({theme:'light', fontSize:'medium', setTheme:()=>{}, setFontSize:()=>{}})

export const useTheme = () => useContext(ThemeContext)

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [fontSize, setFontSizeState] = useState<FontSize>('medium')

  useEffect(()=>{
    const t = localStorage.getItem('mz_theme') as Theme
    const f = localStorage.getItem('mz_fontSize') as FontSize
    if(t) setThemeState(t)
    if(f) setFontSizeState(f)
  },[])

  useEffect(()=>{
    document.documentElement.setAttribute('data-theme', theme)
    document.body.style.background = theme==='dark'? '#111' : '#fff'
    document.body.style.color = theme==='dark'? '#fff' : '#111'
    localStorage.setItem('mz_theme', theme)
  },[theme])

  useEffect(()=>{
    let size = '16px'
    if(fontSize==='small') size='14px'
    if(fontSize==='medium') size='16px'
    if(fontSize==='large') size='19px'
    document.documentElement.style.fontSize = size
    localStorage.setItem('mz_fontSize', fontSize)
  },[fontSize])

  const setTheme = (t:Theme) => setThemeState(t)
  const setFontSize = (f:FontSize) => setFontSizeState(f)

  return (
    <ThemeContext.Provider value={{theme, fontSize, setTheme, setFontSize}}>
      <div style={{background: theme==='dark'?'#111':'#fff', color: theme==='dark'?'#fff':'#111', minHeight:'100vh'}}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

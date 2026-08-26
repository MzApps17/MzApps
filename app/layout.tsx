import type { Metadata } from 'next'
import Footer from './components/Footer'
import ThemeProvider from './components/ThemeProvider'

export const metadata: Metadata = {
  title: 'MzApps - Mizo Social App',
  description: 'Mizo tawng a social app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{margin:0, fontFamily:'Arial, sans-serif'}}>
        <ThemeProvider>
          {children}
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}

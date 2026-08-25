import './globals.css'
import Footer from './components/Footer'

export const metadata = {
  title: 'MzApps',
  description: 'Mizo Social App',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{background:'#000', color:'#fff', paddingBottom:'70px'}}>
        {children}
        <Footer />
      </body>
    </html>
  )
}

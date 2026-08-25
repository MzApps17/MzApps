import './globals.css'

export const metadata = {
  title: 'MzApps - Mizo Chat App',
  description: 'Mizoram tan',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

import { Toaster } from '@/components/ui/sonner'
import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/Header'

export const metadata: Metadata = {
  title: 'Market Seasonality Explorer',
  description: 'Market Seasonality Explorer'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`antialiased`}>
        <Header />
        {children}
        <Toaster />
      </body>
    </html>
  )
}

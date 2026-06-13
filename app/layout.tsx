import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Matchday — World Cup 2026 Predictions',
  description: 'Free prediction leagues for World Cup 2026. Predict scores, earn points, beat your friends.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={GeistSans.className}>
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}

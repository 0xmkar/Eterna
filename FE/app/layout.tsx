import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { WalletProvider } from '@/components/wallet-context'

export const metadata: Metadata = {
  title: 'Eterna'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <WalletProvider>
          {children}
        </WalletProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}

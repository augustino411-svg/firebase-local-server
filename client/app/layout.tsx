import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/auth-context'
import { DataProvider } from '@/context/data-context'

export const metadata: Metadata = {
  title: '啟英高中進修部系統',
  description: '超難寫校園管理系統。',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        {/* Tailwind CLI 編譯後的樣式 */}
        <link rel="stylesheet" href="/output.css" />

        {/* 字型設定 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap"
          rel="stylesheet"
        />

        {/* CSS 變數初始化 */}
        <style>{`
          :root {
            --background: 0 0% 100%;
            --foreground: 222.2 47.4% 11.2%;
            --muted: 210 40% 96.1%;
            --accent: 210 40% 90%;
            --destructive: 0 100% 50%;
            --border: 214.3 31.8% 91.4%;
            --input: 214.3 31.8% 91.4%;
            --ring: 215 20.2% 65.1%;
          }
          .dark {
            --background: 222.2 47.4% 11.2%;
            --foreground: 210 40% 98%;
            --muted: 217 32.2% 17.5%;
            --accent: 217 32.2% 25%;
            --destructive: 0 62.8% 30.6%;
            --border: 217 32.2% 17.5%;
            --input: 217 32.2% 17.5%;
            --ring: 212.7 26.8% 83.9%;
          }
        `}</style>
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthProvider>
          <DataProvider>
            {children}
          </DataProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
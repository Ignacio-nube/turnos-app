import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/layout/ThemeProvider"
import { Toaster } from "@/components/ui/sonner"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Gestión de Turnos",
  description: "Sistema de agendamiento de turnos para negocios",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning className={geist.variable}>
      <body className="min-h-full antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}

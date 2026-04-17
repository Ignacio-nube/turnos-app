'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MobileNav } from './MobileNav'
import { useState } from 'react'

interface NavbarProps {
  title?: string
}

export function Navbar({ title = 'Panel de Control' }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú de navegación"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <h1 className="font-semibold text-sm flex-1">{title}</h1>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Cambiar tema"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  )
}

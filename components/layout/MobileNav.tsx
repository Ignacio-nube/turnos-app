'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Scissors,
  Bot,
  Plus,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/turnos', label: 'Turnos', icon: ClipboardList },
  { href: '/profesionales', label: 'Profesionales', icon: Users },
  { href: '/servicios', label: 'Servicios', icon: Scissors },
  { href: '/ai-asistente', label: 'Asistente IA', icon: Bot },
]

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle className="flex items-center gap-2 text-left">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            TurnosApp
          </SheetTitle>
        </SheetHeader>

        <div className="p-4">
          <Button className="w-full" size="sm" nativeButton={false} onClick={onClose} render={<Link href="/turnos/nuevo" />}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo turno
          </Button>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                aria-label={item.label}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}

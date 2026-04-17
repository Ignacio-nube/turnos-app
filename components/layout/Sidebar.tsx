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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/calendario', label: 'Calendario', icon: Calendar },
  { href: '/turnos', label: 'Turnos', icon: ClipboardList },
  { href: '/profesionales', label: 'Profesionales', icon: Users },
  { href: '/servicios', label: 'Servicios', icon: Scissors },
  { href: '/ai-asistente', label: 'Asistente IA', icon: Bot },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  // Persist collapse state
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  const toggle = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-background h-screen sticky top-0 transition-all duration-200 shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('border-b flex items-center gap-2', collapsed ? 'p-4 justify-center' : 'p-4 px-5')}>
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
          <Calendar className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-semibold text-sm truncate">TurnosApp</p>
            <p className="text-xs text-muted-foreground truncate">Gestión de turnos</p>
          </div>
        )}
      </div>

      {/* New appointment button */}
      <div className={cn('pt-4', collapsed ? 'px-2' : 'px-3')}>
        {collapsed ? (
          <Button
            size="icon-sm"
            className="w-full"
            nativeButton={false}
            render={<Link href="/turnos/nuevo" />}
            aria-label="Nuevo turno"
          >
            <Plus className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            className="w-full"
            size="sm"
            nativeButton={false}
            render={<Link href="/turnos/nuevo" />}
          >
            <Plus className="h-4 w-4" />
            Nuevo turno
          </Button>
        )}
      </div>

      {/* Nav items */}
      <nav className={cn('flex-1 mt-2 space-y-0.5', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
              aria-label={item.label}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <div className={cn('border-t flex', collapsed ? 'p-2 justify-center' : 'p-3 justify-between items-center')}>
        {!collapsed && (
          <p className="text-xs text-muted-foreground pl-1">© 2026 TurnosApp</p>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          className="shrink-0"
        >
          {collapsed
            ? <ChevronRight className="h-4 w-4" />
            : <ChevronLeft className="h-4 w-4" />
          }
        </Button>
      </div>
    </aside>
  )
}

import * as React from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import {
  BriefcaseBusiness,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  FileText,
  FolderKanban,
  LayoutDashboard,
  ListChecks,
  Menu,
  MessageSquareText,
  Settings,
  ShieldAlert,
  X,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/common'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@/hooks/useQuery'
import { services } from '@/services'
import { APP_VERSION } from '@/config/app'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projetos', label: 'Projetos', icon: FolderKanban },
  { to: '/tarefas', label: 'Tarefas', icon: ListChecks },
  { to: '/portfolio', label: 'Portfólio', icon: BriefcaseBusiness },
  { to: '/riscos', label: 'Riscos e pendências', icon: ShieldAlert },
  { to: '/testes', label: 'Testes e homologação', icon: ClipboardCheck },
  { to: '/documentos', label: 'Documentos', icon: FileText },
  { to: '/atualizacoes', label: 'Atualizações', icon: MessageSquareText },
  { to: '/configuracoes', label: 'Configurações', icon: Settings },
]

function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/nexo.svg" alt="" className="size-8" />
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-[0.2em] text-white">NEXO</p>
          <p className="text-[10px] text-slate-400">Projetos conectados</p>
        </div>
      )}
    </Link>
  )
}

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
              isActive ? 'bg-sidebar-active font-medium text-white' : 'text-sidebar-foreground hover:bg-white/5 hover:text-white',
              collapsed && 'justify-center px-0',
            )
          }
        >
          <Icon className="size-[18px] shrink-0" />
          {!collapsed && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  )
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem('nexo:ui:sidebar') === 'collapsed'
  } catch {
    return false
  }
}

export function AppLayout() {
  const [collapsed, setCollapsed] = React.useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const location = useLocation()
  const { data: settings } = useQuery(() => services.settings.get())
  const { data: people } = useQuery(() => services.people.list())
  const current = people?.find((p) => p.id === settings?.currentUserId)
  const page = NAV_ITEMS.find((i) => (i.to === '/' ? location.pathname === '/' : location.pathname.startsWith(i.to)))

  React.useEffect(() => {
    try {
      localStorage.setItem('nexo:ui:sidebar', collapsed ? 'collapsed' : 'expanded')
    } catch {
      // preferência de interface apenas
    }
  }, [collapsed])

  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <div className="flex min-h-full">
      {/* Menu lateral (desktop) */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden flex-col bg-sidebar px-3 py-4 transition-[width] duration-200 lg:flex',
          collapsed ? 'w-[68px]' : 'w-60',
        )}
      >
        <div className={cn('mb-6 px-1', collapsed && 'flex justify-center px-0')}>
          <Logo collapsed={collapsed} />
        </div>
        <NavList collapsed={collapsed} />
        <div className="mt-auto flex flex-col gap-2">
          {!collapsed && <p className="px-3 text-[11px] text-slate-500">Protótipo v{APP_VERSION}</p>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn('flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white', collapsed && 'justify-center px-0')}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? <ChevronsRight className="size-[18px]" /> : <ChevronsLeft className="size-[18px]" />}
            {!collapsed && 'Recolher menu'}
          </button>
        </div>
      </aside>

      {/* Menu lateral (mobile) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar px-3 py-4">
            <div className="mb-6 flex items-center justify-between px-1">
              <Logo />
              <button className="cursor-pointer rounded p-1 text-slate-400 hover:text-white" onClick={() => setMobileOpen(false)} aria-label="Fechar menu">
                <X className="size-5" />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <p className="mt-auto px-3 text-[11px] text-slate-500">Protótipo v{APP_VERSION}</p>
          </aside>
        </div>
      )}

      <div className={cn('flex min-w-0 flex-1 flex-col transition-[padding] duration-200', collapsed ? 'lg:pl-[68px]' : 'lg:pl-60')}>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur sm:px-6">
          <button className="cursor-pointer rounded-md p-1.5 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <p className="truncate text-sm font-medium text-muted-foreground">{page?.label ?? 'NEXO'}</p>
          <div className="ml-auto flex items-center gap-3">
            <Link to="/configuracoes" className="hidden sm:block" title="Os dados ficam apenas neste navegador. Clique para gerenciar.">
              <Badge tone="amber" dot>
                Dados de demonstração
              </Badge>
            </Link>
            {current && (
              <Link to="/configuracoes" className="flex items-center gap-2" title="Usuário simulado — altere em Configurações">
                <Avatar name={current.name} />
                <span className="hidden text-sm leading-tight md:block">
                  <span className="block font-medium">{current.name}</span>
                  <span className="block text-xs text-muted-foreground">{current.role}</span>
                </span>
              </Link>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

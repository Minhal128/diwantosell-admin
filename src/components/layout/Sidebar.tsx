import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Shield,
  Wallet,
  LineChart,
  TrendingUp,
  History,
  Megaphone,
  GraduationCap,
  Bell,
  Lock,
  Settings,
  Coins,
  AlertTriangle,
} from 'lucide-react'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navigation: NavSection[] = [
  {
    title: '',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Users & Ops',
    items: [
      { title: 'User management', href: '/users', icon: Users },
      { title: 'KYC & Verification', href: '/kyc', icon: Shield },
      { title: 'Wallet & Funds', href: '/wallet', icon: Wallet },
    ],
  },
  {
    title: 'Trading core',
    items: [
      { title: 'Trading management', href: '/trading', icon: LineChart },
      { title: 'Liquidation control', href: '/liquidation', icon: AlertTriangle },
      { title: 'Staking management', href: '/staking', icon: Coins },
      { title: 'Market price & feeds', href: '/market', icon: TrendingUp },
      { title: 'Orders & history', href: '/orders', icon: History },
    ],
  },
  {
    title: 'Growth',
    items: [
      { title: 'Campaign & promo', href: '/campaigns', icon: Megaphone },
      { title: 'Academy', href: '/academy', icon: GraduationCap },
    ],
  },
  {
    title: 'System',
    items: [
      { title: 'Notifications', href: '/notifications', icon: Bell },
      { title: 'Roles & Permissions', href: '/roles', icon: Lock },
      { title: 'System settings', href: '/settings', icon: Settings },
    ],
  },
]

interface SidebarProps {
  className?: string
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export function Sidebar({ className, mobileOpen, setMobileOpen }: SidebarProps) {
  const collapsed = false
  const location = useLocation()

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-all duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-black border-r border-[#1a1a25] transition-all duration-300 shadow-2xl lg:shadow-none',
          collapsed ? 'w-16' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          className
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className={cn(
            'flex h-16 items-center border-b border-[#1a1a25] px-4 py-2',
            collapsed ? 'justify-center' : 'justify-between'
          )}>
            {!collapsed && (
              <Link to="/dashboard" className="flex items-center gap-2">
                <img src="/logo.png" alt="Diwan Finance" className="h-6 w-auto" />
              </Link>
            )}
            {collapsed && (
              <Link to="/dashboard" className="flex items-center">
                <img src="/logo.png" alt="D" className="h-6 w-auto" />
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 scrollbar-hide">
            {navigation.map((section, index) => (
              <div key={index} className="mb-4">
                {section.title && !collapsed && (
                  <h3 className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    {section.title}
                  </h3>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = location.pathname === item.href
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200',
                            isActive
                              ? 'bg-white text-black shadow-lg shadow-white/10'
                              : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground',
                            collapsed && 'justify-center px-2'
                          )}
                        >
                          <item.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-black')} />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </div>
      </aside >
    </>
  )
}

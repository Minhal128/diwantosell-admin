import { Search, Bell, ChevronDown, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'


interface HeaderProps {
  title: string
  onMenuClick?: () => void
}

export function Header({ title, onMenuClick }: HeaderProps) {

  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#1a1a25] bg-black/60 backdrop-blur-xl px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-secondary"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title */}
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search"
            className="w-48 lg:w-64 pl-9 bg-[#131219] border border-[#1a1a25] focus:ring-1 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Mobile search button */}
        <Button variant="ghost" size="icon" className="md:hidden hover:bg-secondary">
          <Search className="h-5 w-5" />
        </Button>

        {/* Theme toggle */}
        {/* <Button
          variant="ghost"
          size="icon"
          className="bg-[#0e0d15] hover:bg-[#131219] rounded-xl border border-[#1a1a25]"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? (
            <Sun className="h-4 w-4 text-white" />
          ) : (
            <Moon className="h-4 w-4 text-blue-400" />
          )}
        </Button> */}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative bg-[#0e0d15] hover:bg-[#131219] rounded-xl border border-[#1a1a25]">
          <Bell className="h-4 w-4 text-white" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[#06AE7A] ring-1 ring-[#0e0d15]" />
        </Button>

        <div className="h-8 w-px bg-[#1a1a25] mx-1 hidden sm:block" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 pl-0 pr-0 hover:bg-transparent">
              <div className="h-10 w-10 flex items-center justify-center bg-[#06AE7A] rounded-xl shadow-lg shadow-[#06AE7A]/10">
                <span className="text-black font-bold text-lg">B</span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-[#0a0a0f] border-[#1a1a25] rounded-xl shadow-2xl">
            <DropdownMenuLabel className="font-semibold">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#1a1a25]" />
            <DropdownMenuItem className="focus:bg-secondary rounded-lg cursor-pointer" onClick={() => navigate('/users')}>Profile</DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-secondary rounded-lg cursor-pointer" onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#1a1a25]" />
            <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg cursor-pointer" onClick={handleLogout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

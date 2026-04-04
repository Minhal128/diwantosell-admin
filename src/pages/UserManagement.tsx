import { useState, useEffect } from 'react'
import { apiCall } from '@/lib/api'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Filter, Download, MoreHorizontal, Phone, Mail, Clock, Copy, Check } from 'lucide-react'
import { UserDetailsPanel } from '@/components/dashboard/UserDetailsPanel'

interface User {
  _id: string
  name: string
  email: string
  phone: string
  lastLogin?: string
  kycStatus: 'verified' | 'pending' | 'rejected' | 'none'
  balance: number
  isFrozen?: boolean
  createdAt: string
  status?: string
}

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id).catch(() => {})
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const data = await apiCall('/admin/users')
      
      // Handle both direct array response and error response object
      if (Array.isArray(data)) {
        setUsers(data)
      } else if (data.users && Array.isArray(data.users)) {
        setUsers(data.users)
      } else {
        console.warn('Unexpected response format:', data)
        setUsers([])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate stats from actual user data
  const activeUsers = users.filter(user => user.lastLogin).length
  const inactiveUsers = users.length - activeUsers
  const pendingKyc = users.filter(user => user.kycStatus === 'pending').length
  const totalBalance = users.reduce((sum, user) => sum + user.balance, 0)

  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true
    const s = searchQuery.toLowerCase()
    return user.name?.toLowerCase().includes(s) ||
           user.email?.toLowerCase().includes(s) ||
           user.phone?.toLowerCase().includes(s) ||
           user._id.toLowerCase().includes(s)
  })

  return (
    <DashboardLayout title="User Management">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Active Users"
          value={activeUsers.toString()}
          change={`${users.length} total users`}
          subtitle="Users with recent login"
        />
        <StatsCard
          title="Inactive Users"
          value={inactiveUsers.toString()}
          change={`${Math.round((inactiveUsers / Math.max(users.length, 1)) * 100)}% of total`}
          subtitle="Users without recent login"
        />
        <StatsCard
          title="Pending KYC"
          value={pendingKyc.toString()}
          change={`${users.filter(u => u.kycStatus === 'verified').length} verified`}
          subtitle="Awaiting verification"
        />
        <StatsCard
          title="Total Balance"
          value={`$${totalBalance.toLocaleString()}`}
          change={`$${Math.round(totalBalance / Math.max(users.length, 1))} avg`}
          subtitle="Combined user balances"
        />
      </div>

      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Users</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredUsers.length.toLocaleString()}{searchQuery.trim() ? ` of ${users.length}` : ''})</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6D767E]" />
              <Input
                type="search"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-64 bg-[#1a1a25] border-[#2A2933] text-sm h-10 rounded-lg focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <Button variant="ghost" className="bg-[#1a1a25] hover:bg-[#2A2933] text-white border border-[#2A2933] rounded-lg h-10 px-4 gap-2">
              <Filter className="h-4 w-4 text-[#6D767E]" />
              <span className="text-sm font-medium">Filter</span>
            </Button>
            <Button variant="ghost" className="bg-[#1a1a25] hover:bg-[#2A2933] text-white border border-[#2A2933] rounded-lg h-10 px-4 gap-2">
              <Download className="h-4 w-4 text-[#6D767E]" />
              <span className="text-sm font-medium">Export</span>
            </Button>
            <Button variant="ghost" size="icon" className="bg-[#1a1a25] hover:bg-[#2A2933] border border-[#2A2933] rounded-lg h-10 w-10">
              <MoreHorizontal className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-b-xl">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white mb-2">No users registered yet</p>
              <p className="text-muted-foreground text-sm">
                Users will appear here once they register on the platform
              </p>
              <Button 
                onClick={fetchUsers} 
                className="mt-4 bg-primary hover:bg-primary/90"
              >
                Refresh
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedUsers.length === users.length}
                      onCheckedChange={(checked) => {
                        setSelectedUsers(checked ? users.map((_, i) => String(i)) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Name</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Email</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Phone</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Last Login</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">KYC Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Balance</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Joined</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user, index) => (
                  <TableRow
                    key={index}
                    className="border-[#1a1a25] hover:bg-[#131219] transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Prevent row click when clicking checkbox or dropdown
                      if ((e.target as HTMLElement).closest('[role="checkbox"]') || (e.target as HTMLElement).closest('button')) {
                        return;
                      }
                      setSelectedUserForDetails(user)
                    }}
                  >
                    <TableCell className="w-12">
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedUsers.includes(String(index))}
                        onCheckedChange={(checked) => {
                          setSelectedUsers(
                            checked
                              ? [...selectedUsers, String(index)]
                              : selectedUsers.filter((id) => id !== String(index))
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-white text-sm">
                      <button
                        className="flex items-center gap-1.5 group cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); handleCopyId(user._id); }}
                        title={user._id}
                      >
                        <span className="font-mono text-xs text-white group-hover:text-[#06AE7A] transition-colors tracking-tight">
                          {user._id.slice(0, 8)}...{user._id.slice(-4)}
                        </span>
                        {copiedId === user._id ? (
                          <Check className="h-3 w-3 text-[#06AE7A] shrink-0" />
                        ) : (
                          <Copy className="h-3 w-3 text-[#6D767E] group-hover:text-[#06AE7A] transition-colors shrink-0" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-white font-medium text-sm">
                      {user.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-[#6D767E]" />
                        <span className="text-[#6D767E] font-medium text-sm">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-[#6D767E]" />
                        <span className="text-[#6D767E] font-medium text-sm">{user.phone}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-[#6D767E]" />
                        <span className="text-[#6D767E] font-medium text-sm">{user.lastLogin || 'Never'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                          user.kycStatus === 'verified'
                            ? 'bg-[#06AE7A] text-black hover:bg-[#06AE7A]/90'
                            : user.kycStatus === 'pending'
                              ? 'bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90'
                              : 'bg-destructive text-white'
                        )}
                      >
                        {user.kycStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white font-bold text-sm tracking-tight">${user.balance.toLocaleString()}</TableCell>
                    <TableCell className="text-[#6D767E] font-medium text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#1a1a25] hover:bg-[#2A2933] rounded-lg border border-[#2A2933]">
                            <MoreHorizontal className="h-4 w-4 text-[#6D767E]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0e0d15] border-[#1a1a25] rounded-xl shadow-2xl">
                          <DropdownMenuItem 
                            className="focus:bg-[#1a1a25] cursor-pointer"
                            onClick={() => setSelectedUserForDetails(user)}
                          >
                            View details
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive focus:bg-destructive/10 cursor-pointer"
                            onClick={async () => {
                              const action = user.isFrozen ? 'enable' : 'suspend'
                              if (!confirm(`Are you sure you want to ${action} this user?`)) return
                              try {
                                await apiCall(`/admin/users/${user._id}/status`, {
                                  method: 'PUT',
                                  body: JSON.stringify({ isFrozen: !user.isFrozen }),
                                })
                                fetchUsers()
                              } catch (e) {
                                console.error(`Failed to ${action} user:`, e)
                              }
                            }}
                          >
                            {user.isFrozen ? 'Enable user' : 'Suspend user'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
      <UserDetailsPanel
        user={selectedUserForDetails}
        isOpen={!!selectedUserForDetails}
        onClose={() => setSelectedUserForDetails(null)}
        onRefresh={() => {
          fetchUsers()
          // Also refresh the selected user's data
          if (selectedUserForDetails) {
            apiCall(`/admin/users`).then((data: any) => {
              const users = Array.isArray(data) ? data : data.users || []
              const updated = users.find((u: any) => u._id === selectedUserForDetails._id)
              if (updated) setSelectedUserForDetails(updated)
            }).catch(() => {})
          }
        }}
      />
    </DashboardLayout >
  )
}

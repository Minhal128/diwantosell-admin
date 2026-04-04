import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Filter, Download, MoreHorizontal } from 'lucide-react'
import { apiCall } from '@/lib/api'

interface Admin {
  _id: string
  name: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface AdminStats {
  totalAdmins: number
  activeAdmins: number
  inactiveAdmins: number
  pendingInvites: number
}

export function RolesPermissionsPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [stats, setStats] = useState<AdminStats>({
    totalAdmins: 0,
    activeAdmins: 0,
    inactiveAdmins: 0,
    pendingInvites: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state for creating admins
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin'
  })

  useEffect(() => {
    fetchAdmins()
    fetchStats()
  }, [])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/admin/roles/admins')
      setAdmins(response || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching admins:', err)
      setError('Failed to load admins')
      setAdmins([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiCall('/admin/roles/stats')
      setStats(response || {
        totalAdmins: 0,
        activeAdmins: 0,
        inactiveAdmins: 0,
        pendingInvites: 0
      })
    } catch (err) {
      console.error('Error fetching admin stats:', err)
    }
  }

  const handleCreateAdmin = async () => {
    try {
      if (!formData.name || !formData.email || !formData.password) {
        alert('Please fill in all required fields')
        return
      }

      await apiCall('/admin/roles/admins', 'POST', formData)
      
      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin'
      })
      setShowAddModal(false)
      
      // Refresh data
      fetchAdmins()
      fetchStats()
    } catch (err) {
      console.error('Error creating admin:', err)
      alert('Failed to create admin')
    }
  }

  const handleToggleStatus = async (adminId: string) => {
    try {
      await apiCall(`/admin/roles/admins/${adminId}/toggle-status`, 'PUT')
      fetchAdmins()
      fetchStats()
    } catch (err) {
      console.error('Error toggling admin status:', err)
      alert('Failed to update admin status')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      'superadmin': 'Super Admin',
      'admin': 'Admin',
      'manager': 'Manager',
      'support': 'Support',
      'compliance': 'Compliance'
    }
    return roleMap[role] || role
  }

  const filteredAdmins = admins.filter(a => {
    if (!searchQuery.trim()) return true
    const s = searchQuery.toLowerCase()
    return a.name?.toLowerCase().includes(s) || a.email?.toLowerCase().includes(s) || a.role?.toLowerCase().includes(s)
  })

  return (
    <DashboardLayout title="Roles & Permissions">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Admins"
          value={stats.totalAdmins.toString()}
          change={stats.totalAdmins === 1 ? "Super admin account" : `${stats.totalAdmins} admin accounts`}
          subtitle="System administrators"
        />
        <StatsCard
          title="Active Admins"
          value={stats.activeAdmins.toString()}
          change={stats.activeAdmins === 0 ? "No active admins" : `${stats.activeAdmins} currently active`}
          subtitle="Logged in recently"
        />
        <StatsCard
          title="Inactive Admins"
          value={stats.inactiveAdmins.toString()}
          change={stats.inactiveAdmins === 0 ? "No inactive admins" : `${stats.inactiveAdmins} inactive`}
          subtitle="Not logged in recently"
        />
        <StatsCard
          title="Pending Invites"
          value={stats.pendingInvites.toString()}
          change={stats.pendingInvites === 0 ? "No pending invites" : `${stats.pendingInvites} pending`}
          subtitle="Admin invitations sent"
        />
      </div>

      {/* Admins Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Admins</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredAdmins.length}{searchQuery.trim() ? ` of ${admins.length}` : ''})</span>
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
            <Button
              className="bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black font-bold rounded-lg h-10 px-4 transition-all shadow-[0_4px_12px_rgba(6,174,122,0.2)]"
              onClick={() => setShowAddModal(true)}
            >
              Add new admin
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#212027]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-12 h-12 py-0">
                  <Checkbox
                    className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                    checked={selectedItems.length === filteredAdmins.length && filteredAdmins.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedItems(checked ? filteredAdmins.map(a => a._id) : [])
                    }}
                  />
                </TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Admin Name</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Email</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Role</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Created At</TableHead>
                <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="text-[#6D767E] text-lg font-medium">Loading admins...</div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-red-400 text-lg font-medium">Error loading admins</div>
                      <div className="text-[#6D767E] text-sm">{error}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-[#6D767E] text-lg font-medium">No admins yet</div>
                      <div className="text-[#6D767E] text-sm">Add your first admin to start managing roles</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAdmins.map((admin) => (
                <TableRow key={admin._id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                  <TableCell className="w-12">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.includes(admin._id)}
                      onCheckedChange={(checked) => {
                        setSelectedItems(
                          checked
                            ? [...selectedItems, admin._id]
                            : selectedItems.filter((id) => id !== admin._id)
                        )
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-bold text-white text-sm">{admin.name}</TableCell>
                  <TableCell className="font-medium text-[#6D767E] text-sm">{admin.email}</TableCell>
                  <TableCell className="font-bold text-[#6D767E] text-sm">{getRoleDisplayName(admin.role)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-1.5 w-1.5 rounded-full ${
                        admin.isActive 
                          ? 'bg-[#06AE7A] shadow-[0_0_8px_rgba(6,174,122,0.4)]' 
                          : 'bg-[#6D767E] shadow-[0_0_8px_rgba(109,118,126,0.4)]'
                      }`} />
                      <span className={`font-bold text-sm ${
                        admin.isActive ? 'text-[#06AE7A]' : 'text-[#6D767E]'
                      }`}>
                        {admin.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-[#6D767E] text-xs">{formatDate(admin.createdAt)}</TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={admin.isActive ? "destructive" : "default"}
                        className={`text-xs h-7 px-2 font-bold ${
                          admin.isActive 
                            ? 'bg-red-500 hover:bg-red-600 text-white' 
                            : 'bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black'
                        }`}
                        onClick={() => handleToggleStatus(admin._id)}
                      >
                        {admin.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#1a1a25] hover:bg-[#2A2933] border border-[#2A2933]">
                        <MoreHorizontal className="h-4 w-4 text-[#6D767E]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add New Admin Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-[#0a0a0f] border-[#2a2a35] w-[95vw] sm:max-w-sm p-0 overflow-hidden rounded-xl shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base font-semibold">
              Add New Admin
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-5">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Basic Information</h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Admin Name</Label>
                <Input
                  placeholder="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Admin Email Address</Label>
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Password</Label>
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger className="bg-[#1a1a25] border-[#2a2a35]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Button */}
            <Button 
              className="w-full h-11 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold"
              onClick={handleCreateAdmin}
            >
              Create account
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

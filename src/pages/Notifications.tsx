import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
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
import { Search, Filter, Download, MoreHorizontal, Calendar, CheckCircle } from 'lucide-react'
import { apiCall } from '@/lib/api'

interface Notification {
  _id: string
  title: string
  description: string
  type: string
  targetAudience: string
  status: 'draft' | 'scheduled' | 'sent' | 'failed'
  scheduledAt?: string
  sentAt?: string
  totalRecipients: number
  deliveredCount: number
  failedCount: number
  createdBy?: {
    name: string
    email: string
  }
  createdAt: string
}

interface NotificationStats {
  totalNotifications: number
  deliveredNotifications: number
  pendingNotifications: number
  failedNotifications: number
}

export function NotificationsPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'scheduled'>('active')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [scheduleNotifications, setScheduleNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [stats, setStats] = useState<NotificationStats>({
    totalNotifications: 0,
    deliveredNotifications: 0,
    pendingNotifications: 0,
    failedNotifications: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Form state for creating notifications
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'system',
    targetAudience: 'all',
    scheduledAt: '',
    priority: 'medium',
    channels: ['in-app']
  })

  useEffect(() => {
    fetchNotifications()
    fetchStats()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/admin/notifications')
      setNotifications(response || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError('Failed to load notifications')
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiCall('/admin/notifications/stats')
      setStats(response || {
        totalNotifications: 0,
        deliveredNotifications: 0,
        pendingNotifications: 0,
        failedNotifications: 0
      })
    } catch (err) {
      console.error('Error fetching notification stats:', err)
    }
  }

  const handleCreateNotification = async () => {
    try {
      if (!formData.title || !formData.description) {
        alert('Please fill in all required fields')
        return
      }

      const payload = {
        ...formData,
        scheduledAt: scheduleNotifications && formData.scheduledAt ? formData.scheduledAt : undefined
      }

      const response = await apiCall('/admin/notifications', 'POST', payload)

      // If it's not scheduled (i.e. "Send Now"), send it immediately
      if (!scheduleNotifications && response && response._id) {
        try {
          await apiCall(`/admin/notifications/${response._id}/send`, 'PUT')
        } catch (sendErr) {
          console.error('Error sending notification immediately:', sendErr)
          alert('Notification created but failed to send. Please try sending manually.')
        }
      }

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        type: 'system',
        targetAudience: 'all',
        scheduledAt: '',
        priority: 'medium',
        channels: ['in-app']
      })
      setScheduleNotifications(false)
      setShowCreateModal(false)

      // Refresh data
      fetchNotifications()
      fetchStats()
    } catch (err) {
      console.error('Error creating notification:', err)
      alert('Failed to create notification')
    }
  }

  const handleSendNotification = async (notificationId: string) => {
    try {
      await apiCall(`/admin/notifications/${notificationId}/send`, 'PUT')
      fetchNotifications()
      fetchStats()
    } catch (err) {
      console.error('Error sending notification:', err)
      alert('Failed to send notification')
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

  const filteredNotifications = notifications.filter(notification => {
    const inTab = activeTab === 'active'
      ? notification.status === 'sent' || notification.status === 'failed'
      : notification.status === 'scheduled' || notification.status === 'draft'
    if (!inTab) return false
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase()
      return notification.title?.toLowerCase().includes(s) ||
             notification.description?.toLowerCase().includes(s) ||
             notification.type?.toLowerCase().includes(s)
    }
    return true
  })

  return (
    <DashboardLayout title="Notifications">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Notifications"
          value={stats.totalNotifications.toString()}
          change={stats.totalNotifications === 0 ? "No notifications sent" : `${stats.totalNotifications} total`}
          subtitle="All system notifications"
        />
        <StatsCard
          title="Delivered"
          value={stats.deliveredNotifications.toString()}
          change={stats.deliveredNotifications === 0 ? "No deliveries yet" : `${stats.deliveredNotifications} delivered`}
          subtitle="Successfully delivered"
        />
        <StatsCard
          title="Pending"
          value={stats.pendingNotifications.toString()}
          change={stats.pendingNotifications === 0 ? "No pending notifications" : `${stats.pendingNotifications} pending`}
          subtitle="Queued for delivery"
        />
        <StatsCard
          title="Failed"
          value={stats.failedNotifications.toString()}
          change={stats.failedNotifications === 0 ? "No failed deliveries" : `${stats.failedNotifications} failed`}
          subtitle="Delivery failures"
        />
      </div>

      {/* Notifications Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Notifications</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredNotifications.length})</span>
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
              onClick={() => setShowCreateModal(true)}
            >
              Create Notification
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-[#1a1a25]">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'active'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Active
          </button>
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'scheduled'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Scheduled
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#212027]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-12 h-12 py-0">
                  <Checkbox
                    className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                    checked={selectedItems.length === filteredNotifications.length && filteredNotifications.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedItems(checked ? filteredNotifications.map(n => n._id) : [])
                    }}
                  />
                </TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Title</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Type</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Target Audience</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Recipients</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Created At</TableHead>
                <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="text-[#6D767E] text-lg font-medium">Loading notifications...</div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-red-400 text-lg font-medium">Error loading notifications</div>
                      <div className="text-[#6D767E] text-sm">{error}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-[#6D767E] text-lg font-medium">No notifications yet</div>
                      <div className="text-[#6D767E] text-sm">Create your first notification to start engaging users</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => (
                  <TableRow key={notification._id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                    <TableCell className="w-12">
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(notification._id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, notification._id]
                              : selectedItems.filter((id) => id !== notification._id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-white text-sm">{notification.title}</TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-sm capitalize">{notification.type}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm capitalize">{notification.targetAudience.replace('-', ' ')}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{notification.totalRecipients}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${notification.status === 'sent' ? 'bg-[#06AE7A] shadow-[0_0_8px_rgba(6,174,122,0.4)]' :
                            notification.status === 'failed' ? 'bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.4)]' :
                              notification.status === 'scheduled' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' :
                                'bg-[#6D767E] shadow-[0_0_8px_rgba(109,118,126,0.4)]'
                          }`} />
                        <span className={`font-bold text-sm ${notification.status === 'sent' ? 'text-[#06AE7A]' :
                            notification.status === 'failed' ? 'text-red-400' :
                              notification.status === 'scheduled' ? 'text-yellow-400' :
                                'text-[#6D767E]'
                          }`}>
                          {notification.status === 'sent' ? 'Completed' : notification.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-xs">{formatDate(notification.createdAt)}</TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center gap-2">
                        {notification.status === 'draft' && (
                          <Button
                            size="sm"
                            className="bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black font-bold text-xs h-7 px-2"
                            onClick={() => handleSendNotification(notification._id)}
                          >
                            Send
                          </Button>
                        )}
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

      {/* Create Notification Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#0a0a0f] border-[#2a2a35] w-[95vw] sm:max-w-sm p-0 overflow-hidden rounded-xl shadow-2xl shadow-black/50 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base font-semibold">
              Create Notification
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Create a new notification to send to users
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-5">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Basic Information</h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Notification Title</Label>
                <Input
                  placeholder="Write notification title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Notification Description</Label>
                <Textarea
                  placeholder="Write notification description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1] min-h-[60px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger className="bg-[#1a1a25] border-[#2a2a35]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="transaction">Transaction</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Target audience</Label>
                <Select value={formData.targetAudience} onValueChange={(value) => setFormData({ ...formData, targetAudience: value })}>
                  <SelectTrigger className="bg-[#1a1a25] border-[#2a2a35]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="verified">Verified Users</SelectItem>
                    <SelectItem value="unverified">Unverified Users</SelectItem>
                    <SelectItem value="active">Active Users</SelectItem>
                    <SelectItem value="inactive">Inactive Users</SelectItem>
                    <SelectItem value="deposit">Deposit Users</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Schedule Section */}
            <div className="flex items-center gap-2">
              <CheckCircle className={`h-5 w-5 ${scheduleNotifications ? 'text-[#1ABFA1]' : 'text-muted-foreground'}`} />
              <button
                onClick={() => setScheduleNotifications(!scheduleNotifications)}
                className="text-sm"
              >
                Schedule notifications
              </button>
            </div>

            {scheduleNotifications && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <div className="relative">
                  <Input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1] pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                className="h-11 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold"
                onClick={handleCreateNotification}
              >
                {scheduleNotifications ? 'Schedule' : 'Send Now'}
              </Button>
              <Button
                variant="secondary"
                className="h-11 bg-[#2a2a35] hover:bg-[#3a3a45] text-white font-semibold"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
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
import { Search, Filter, Download, MoreHorizontal, Calendar as CalendarIcon } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts'
import { apiCall } from '@/lib/api'

interface Campaign {
  _id: string
  name: string
  type: string
  reward: {
    rewardType: string
    amount: number
    maxReward: number
  }
  eligibility: {
    allUsers: boolean
    newUsers: boolean
    kycRequired: boolean
    minDepositAmount: number
  }
  stats: {
    participants: number
    totalRewardsIssued: number
    conversionRate: number
  }
  startDate: string
  endDate: string
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'ended'
}

interface Participant {
  id: string
  user: string
  campaign: string
  rewardsType: string
  actionCompleted: string
  completedAt: string
  status: 'pending' | 'paid'
}

interface Reward {
  id: string
  user: string
  rewardsType: string
  amount: string
  creditedAt: string
  status: 'pending' | 'paid'
}

interface CampaignStats {
  totalCampaigns: number
  activeCampaigns: number
  scheduledCampaigns: number
  totalParticipants: number
  totalRewards: number
}

const participants: Participant[] = []

const rewards: Reward[] = []

const chartData: { name: string; value: number }[] = []

export function CampaignPromoPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'campaigns' | 'participants' | 'rewards'>('campaigns')
  const [timeRange, setTimeRange] = useState('Weekly')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<CampaignStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    scheduledCampaigns: 0,
    totalParticipants: 0,
    totalRewards: 0
  })
  const [, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'deposit',
    eligibility: {
      allUsers: true,
      newUsers: false,
      kycRequired: false,
      minDepositAmount: 0
    },
    reward: {
      rewardType: 'cashback',
      amount: 0,
      maxReward: 0
    },
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined
  })

  useEffect(() => {
    fetchCampaigns()
    fetchStats()
  }, [])

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      const response = await apiCall('/admin/campaigns')
      setCampaigns(response || [])
    } catch (err) {
      console.error('Error fetching campaigns:', err)
      setCampaigns([])
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await apiCall('/admin/campaigns/stats')
      setStats(response || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        scheduledCampaigns: 0,
        totalParticipants: 0,
        totalRewards: 0
      })
    } catch (err) {
      console.error('Error fetching campaign stats:', err)
    }
  }

  const handleCreateCampaign = async () => {
    try {
      if (!formData.name || !formData.description) {
        alert('Please fill in the campaign name and description')
        return
      }
      if (!formData.startDate || !formData.endDate) {
        alert('Please select start and end dates')
        return
      }

      await apiCall('/admin/campaigns', 'POST', {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString()
      })

      // Reset form
      setFormData({
        name: '',
        description: '',
        type: 'deposit',
        eligibility: {
          allUsers: true,
          newUsers: false,
          kycRequired: false,
          minDepositAmount: 0
        },
        reward: {
          rewardType: 'cashback',
          amount: 0,
          maxReward: 0
        },
        startDate: undefined,
        endDate: undefined
      })
      setShowCreateModal(false)
      fetchCampaigns()
      fetchStats()
    } catch (err) {
      console.error('Error creating campaign:', err)
      alert('Failed to create campaign')
    }
  }

  const handleToggleStatus = async (campaignId: string) => {
    try {
      await apiCall(`/admin/campaigns/${campaignId}/toggle`, 'PUT')
      fetchCampaigns()
      fetchStats()
    } catch (err) {
      console.error('Error toggling campaign status:', err)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getEligibilityText = (eligibility: Campaign['eligibility']) => {
    if (eligibility.allUsers) return 'All Users'
    if (eligibility.newUsers) return 'New Users'
    if (eligibility.kycRequired) return 'KYC Verified'
    return 'Custom'
  }

  const filteredCampaigns = campaigns.filter(c => {
    if (!searchQuery.trim()) return true
    const s = searchQuery.toLowerCase()
    return c.name?.toLowerCase().includes(s) || c.type?.toLowerCase().includes(s) || c.status?.toLowerCase().includes(s)
  })

  return (
    <DashboardLayout title="Campaign & Promo">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Active Campaigns"
          value={String(stats.activeCampaigns)}
          change={stats.activeCampaigns > 0 ? "Running now" : "No campaigns running"}
          subtitle="Currently active promotions"
        />
        <StatsCard
          title="Scheduled Campaigns"
          value={String(stats.scheduledCampaigns)}
          change={stats.scheduledCampaigns > 0 ? "Upcoming" : "No scheduled campaigns"}
          subtitle="Upcoming promotions"
        />
        <StatsCard
          title="Total Participants"
          value={String(stats.totalParticipants)}
          change={stats.totalParticipants > 0 ? "Engaged users" : "No participants yet"}
          subtitle="Users in campaigns"
        />
        <StatsCard
          title="Rewards Issued"
          value={String(stats.totalRewards)}
          change={stats.totalRewards > 0 ? "Distributed" : "No rewards distributed"}
          subtitle="Campaign rewards given"
        />
      </div>

      {/* Conversion Chart Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15] p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-bold text-[#6D767E] mb-1">Overall Conversion Rate</h3>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-white tracking-tight">0%</span>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <span className="text-[#6D767E]">No campaign data yet</span>
              </div>
            </div>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px] bg-[#1a1a25] border-[#2A2933] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Daily">Daily</SelectItem>
              <SelectItem value="Weekly">Weekly</SelectItem>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chart */}
        <div className="h-[200px] w-full min-w-[300px] flex items-center justify-center">
          {chartData.length === 0 ? (
            <div className="text-center">
              <div className="text-[#6D767E] text-lg font-medium mb-2">No conversion data yet</div>
              <div className="text-[#6D767E] text-sm">Chart will appear here once campaigns start generating data</div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={200}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06AE7A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06AE7A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6D767E', fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6D767E', fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: '#1a1a25',
                    border: '1px solid #2A2933',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                  labelStyle={{ color: '#6D767E' }}
                  itemStyle={{ color: '#06AE7A' }}
                  formatter={(value) => [`${value}%`, 'Conversion Rate']}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#06AE7A"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorValue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Campaigns Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Campaigns</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredCampaigns.length}{searchQuery.trim() ? ` of ${campaigns.length}` : ''})</span>
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
              Create campaign
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-[#1a1a25]">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'campaigns'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Campaigns
          </button>
          <button
            onClick={() => setActiveTab('participants')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'participants'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Participants
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'rewards'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Rewards History
          </button>
        </div>

        {/* Campaigns Table */}
        {activeTab === 'campaigns' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === filteredCampaigns.length && filteredCampaigns.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? filteredCampaigns.map(c => c._id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Campaign Name</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Type</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Rewards</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Eligibility</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Participants</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Start Date</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">End Date</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[#6D767E] text-lg font-medium">No campaigns yet</div>
                        <div className="text-[#6D767E] text-sm">Create your first campaign to start promoting your platform</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign._id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                    <TableCell className="w-12">
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(campaign._id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, campaign._id]
                              : selectedItems.filter((id) => id !== campaign._id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-white text-sm">{campaign.name}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm capitalize">{campaign.type}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm capitalize">{campaign.reward?.rewardType} {campaign.reward?.amount > 0 && `(${campaign.reward.amount})`}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{getEligibilityText(campaign.eligibility)}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{campaign.stats?.participants || 0}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-xs">{formatDate(campaign.startDate)}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-xs">{formatDate(campaign.endDate)}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase",
                          campaign.status === 'active'
                            ? 'bg-[#06AE7A] text-black'
                            : campaign.status === 'scheduled'
                            ? 'bg-[#3B82F6] text-white'
                            : campaign.status === 'paused'
                            ? 'bg-[#F59E0B] text-black'
                            : 'bg-[#6D767E]/20 text-[#6D767E] border border-[#6D767E]/30'
                        )}
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {(campaign.status === 'active' || campaign.status === 'scheduled' || campaign.status === 'paused') && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className={cn(
                              "h-7 px-2 text-xs font-bold",
                              campaign.status === 'paused' 
                                ? "bg-[#06AE7A]/20 text-[#06AE7A] hover:bg-[#06AE7A]/30"
                                : "bg-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/30"
                            )}
                            onClick={() => handleToggleStatus(campaign._id)}
                          >
                            {campaign.status === 'paused' ? 'Resume' : 'Pause'}
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
        )}

        {/* Participants Table */}
        {activeTab === 'participants' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === participants.length}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? participants.map(p => p.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Campaign</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Rewards Type</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Action Completed</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Completed at</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[#6D767E] text-lg font-medium">No participants yet</div>
                        <div className="text-[#6D767E] text-sm">Campaign participants will appear here once users join campaigns</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  participants.map((participant) => (
                  <TableRow key={participant.id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                    <TableCell className="w-12">
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(participant.id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, participant.id]
                              : selectedItems.filter((id) => id !== participant.id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{participant.user}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{participant.campaign}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{participant.rewardsType}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{participant.actionCompleted}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-xs">{participant.completedAt}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase",
                          participant.status === 'paid'
                            ? 'bg-[#06AE7A] text-black'
                            : 'bg-[#F59E0B] text-black'
                        )}
                      >
                        {participant.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#1a1a25] hover:bg-[#2A2933] rounded-lg border border-[#2A2933]">
                        <MoreHorizontal className="h-4 w-4 text-[#6D767E]" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Rewards History Table */}
        {activeTab === 'rewards' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === rewards.length}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? rewards.map(r => r.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Rewards Type</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Amount</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Credited at</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rewards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[#6D767E] text-lg font-medium">No rewards yet</div>
                        <div className="text-[#6D767E] text-sm">Reward history will appear here once rewards are distributed</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rewards.map((reward) => (
                  <TableRow key={reward.id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                    <TableCell className="w-12">
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(reward.id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, reward.id]
                              : selectedItems.filter((id) => id !== reward.id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{reward.user}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{reward.rewardsType}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{reward.amount}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-xs">{reward.creditedAt}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase",
                          reward.status === 'paid'
                            ? 'bg-[#06AE7A] text-black'
                            : 'bg-[#F59E0B] text-black'
                        )}
                      >
                        {reward.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#1a1a25] hover:bg-[#2A2933] border border-[#2A2933]">
                        <MoreHorizontal className="h-4 w-4 text-[#6D767E]" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#0a0a0f] border-[#1a1a25] w-[95vw] sm:max-w-sm p-0 overflow-hidden max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl shadow-black/50">
          <DialogHeader className="p-5 pb-0">
            <DialogTitle className="text-base font-semibold">
              Create campaign
            </DialogTitle>
            <DialogDescription className="sr-only">
              Fill in the form below to create a new campaign
            </DialogDescription>
          </DialogHeader>

          <div className="p-5 space-y-5">
            {/* Basic Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Basic Information</h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Campaign Name</Label>
                <Input
                  placeholder="Write campaign Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1]"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Campaign Description</Label>
                <Textarea
                  placeholder="Write something"
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
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="signup">Signup</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Eligibility Rules */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Eligibility Rules</h4>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">All Users</span>
                <Switch 
                  checked={formData.eligibility.allUsers} 
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    eligibility: { ...formData.eligibility, allUsers: checked, newUsers: checked ? false : formData.eligibility.newUsers } 
                  })} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Users Only</span>
                <Switch 
                  checked={formData.eligibility.newUsers} 
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    eligibility: { ...formData.eligibility, newUsers: checked, allUsers: checked ? false : formData.eligibility.allUsers } 
                  })} 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">KYC Required</span>
                <Switch 
                  checked={formData.eligibility.kycRequired} 
                  onCheckedChange={(checked) => setFormData({ 
                    ...formData, 
                    eligibility: { ...formData.eligibility, kycRequired: checked } 
                  })} 
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Min Deposit Amount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.eligibility.minDepositAmount || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    eligibility: { ...formData.eligibility, minDepositAmount: Number(e.target.value) || 0 } 
                  })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1]"
                />
              </div>
            </div>

            {/* Reward Configuration */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Reward Configuration</h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Reward Type</Label>
                <Select 
                  value={formData.reward.rewardType} 
                  onValueChange={(value) => setFormData({ ...formData, reward: { ...formData.reward, rewardType: value } })}
                >
                  <SelectTrigger className="bg-[#1a1a25] border-[#2a2a35]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cashback">Cashback</SelectItem>
                    <SelectItem value="bonus">Bonus</SelectItem>
                    <SelectItem value="discount">Discount</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Reward Amount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.reward.amount || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    reward: { ...formData.reward, amount: Number(e.target.value) || 0 } 
                  })}
                  className="bg-[#1a1a25] border-[#2a2a35] focus:border-[#1ABFA1]"
                />
              </div>
            </div>

            {/* Campaign Duration */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Campaign duration</h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Start date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-[#1a1a25] border-[#2a2a35] hover:bg-[#2a2a35]",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? format(formData.startDate, "PPP") : <span>Select start date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1a1a25] border-[#2a2a35]" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.startDate}
                      onSelect={(date) => setFormData({ ...formData, startDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">End date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-[#1a1a25] border-[#2a2a35] hover:bg-[#2a2a35]",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? format(formData.endDate, "PPP") : <span>Select end date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#1a1a25] border-[#2a2a35]" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.endDate}
                      onSelect={(date) => setFormData({ ...formData, endDate: date })}
                      disabled={(date) => formData.startDate ? date < formData.startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button 
                className="h-11 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold"
                onClick={handleCreateCampaign}
              >
                Create campaign
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

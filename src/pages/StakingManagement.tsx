import { useState, useEffect, useCallback } from 'react'
import { apiCall } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  MoreVertical,
  Percent,
  RefreshCw,
} from 'lucide-react'

interface StakePosition {
  _id: string
  user: { _id: string; name: string; email: string } | null
  asset: string
  amount: number
  apy: number
  duration: number
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'withdrawn'
  accruedRewards: number
  autoCompound: boolean
  createdAt: string
}

interface StakingStats {
  totalStaked: number
  totalRewards: number
  activePositions: number
  totalPositions: number
}

interface APYConfig {
  flexible: number
  locked30: number
  locked60: number
  locked90: number
}

export function StakingManagementPage() {
  const [stakes, setStakes] = useState<StakePosition[]>([])
  const [stats, setStats] = useState<StakingStats>({ totalStaked: 0, totalRewards: 0, activePositions: 0, totalPositions: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  // APY dialog
  const [apyDialogOpen, setApyDialogOpen] = useState(false)
  const [apyConfig, setApyConfig] = useState<APYConfig>({ flexible: 5, locked30: 8, locked60: 12, locked90: 18 })
  const [apySaving, setApySaving] = useState(false)

  // Force unstake dialog
  const [forceUnstakeOpen, setForceUnstakeOpen] = useState(false)
  const [selectedStake, setSelectedStake] = useState<StakePosition | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchStakes = useCallback(async () => {
    try {
      const data = await apiCall('/admin/staking')
      setStakes(data.stakes || [])
      setStats(data.stats || { totalStaked: 0, totalRewards: 0, activePositions: 0, totalPositions: 0 })
    } catch (error) {
      console.error('Error fetching stakes:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAPY = useCallback(async () => {
    try {
      const data = await apiCall('/admin/settings')
      if (data.stakingAPY) {
        setApyConfig(data.stakingAPY)
      }
    } catch (error) {
      console.error('Error fetching APY:', error)
    }
  }, [])

  useEffect(() => {
    fetchStakes()
    fetchAPY()
  }, [fetchStakes, fetchAPY])

  const handleSaveAPY = async () => {
    setApySaving(true)
    try {
      await apiCall('/admin/staking/apy', {
        method: 'PUT',
        body: JSON.stringify(apyConfig),
      })
      setApyDialogOpen(false)
      fetchStakes() // Refresh to show new APYs
    } catch (error) {
      console.error('Error updating APY:', error)
    } finally {
      setApySaving(false)
    }
  }

  const handleForceUnstake = async () => {
    if (!selectedStake) return
    setActionLoading(true)
    try {
      await apiCall(`/admin/staking/${selectedStake._id}/force-unstake`, {
        method: 'POST',
        body: JSON.stringify({ adminNote }),
      })
      setForceUnstakeOpen(false)
      setSelectedStake(null)
      setAdminNote('')
      fetchStakes()
    } catch (error) {
      console.error('Error force-unstaking:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const openForceUnstake = (stake: StakePosition) => {
    setSelectedStake(stake)
    setAdminNote('')
    setForceUnstakeOpen(true)
  }

  const filteredStakes = activeTab === 'all' ? stakes
    : stakes.filter(s => s.status === activeTab)

  const getPoolName = (duration: number) => {
    if (duration === 0) return 'Flexible'
    return `${duration} Days Fixed`
  }

  return (
    <DashboardLayout title="Staking Management">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Staking Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              View all staking positions, manage APY rates, and control user stakes
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setLoading(true); fetchStakes(); }}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button
              size="sm"
              className="bg-[#1ABFA1] hover:bg-[#17a98e] text-white"
              onClick={() => setApyDialogOpen(true)}
            >
              <Percent className="w-4 h-4 mr-2" /> Configure APY
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Value Staked"
            value={`$${stats.totalStaked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          />
          <StatsCard
            title="Total Rewards Accrued"
            value={`$${stats.totalRewards.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}
          />
          <StatsCard
            title="Active Positions"
            value={stats.activePositions.toString()}
          />
          <StatsCard
            title="Total Positions"
            value={stats.totalPositions.toString()}
          />
        </div>

        {/* Current APY Rates */}
        <div className="rounded-xl border border-border/40 bg-card/30 p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Current APY Rates</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground block">Flexible</span>
              <span className="text-lg font-bold text-[#1ABFA1]">{apyConfig.flexible}%</span>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground block">30 Days</span>
              <span className="text-lg font-bold text-[#1ABFA1]">{apyConfig.locked30}%</span>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground block">60 Days</span>
              <span className="text-lg font-bold text-[#1ABFA1]">{apyConfig.locked60}%</span>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <span className="text-xs text-muted-foreground block">90 Days</span>
              <span className="text-lg font-bold text-[#1ABFA1]">{apyConfig.locked90}%</span>
            </div>
          </div>
        </div>

        {/* Tabs & Table */}
        <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
          <div className="p-4 border-b border-border/40 flex items-center justify-between">
            <h3 className="font-semibold text-white">Staking Positions</h3>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-secondary/30">
                <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                <TabsTrigger value="withdrawn" className="text-xs">Withdrawn</TabsTrigger>
                <TabsTrigger value="completed" className="text-xs">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="text-muted-foreground">Pool</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">APY</TableHead>
                <TableHead className="text-muted-foreground">Rewards</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Start Date</TableHead>
                <TableHead className="text-muted-foreground">End Date</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    Loading staking positions...
                  </TableCell>
                </TableRow>
              ) : filteredStakes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                    No staking positions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStakes.map((stake) => (
                  <TableRow key={stake._id} className="border-border/40">
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-white">{stake.user?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{stake.user?.email || ''}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-white">{getPoolName(stake.duration)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-white">
                        {stake.amount.toLocaleString()} {stake.asset}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[#1ABFA1] border-[#1ABFA1]/30">
                        {stake.apy}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-[#1ABFA1] font-medium">
                        +{stake.accruedRewards.toFixed(6)} {stake.asset}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          stake.status === 'active'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : stake.status === 'withdrawn'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                        }
                        variant="outline"
                      >
                        {stake.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(stake.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {stake.duration === 0 ? 'Flexible' : new Date(stake.endDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {stake.status === 'active' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1a2e] border-border/40">
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400 cursor-pointer"
                              onClick={() => openForceUnstake(stake)}
                            >
                              Force Unstake
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Configure APY Dialog */}
      <Dialog open={apyDialogOpen} onOpenChange={setApyDialogOpen}>
        <DialogContent className="bg-[#0f0f1a] border-border/40 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Staking APY</DialogTitle>
            <DialogDescription>
              Update the annual percentage yield for each staking pool. Changes apply to new stakes immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Flexible Pool APY (%)</label>
              <Input
                type="number"
                step="0.1"
                value={apyConfig.flexible}
                onChange={(e) => setApyConfig(prev => ({ ...prev, flexible: Number(e.target.value) }))}
                className="bg-secondary/30 border-border/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">30-Day Locked Pool APY (%)</label>
              <Input
                type="number"
                step="0.1"
                value={apyConfig.locked30}
                onChange={(e) => setApyConfig(prev => ({ ...prev, locked30: Number(e.target.value) }))}
                className="bg-secondary/30 border-border/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">60-Day Locked Pool APY (%)</label>
              <Input
                type="number"
                step="0.1"
                value={apyConfig.locked60}
                onChange={(e) => setApyConfig(prev => ({ ...prev, locked60: Number(e.target.value) }))}
                className="bg-secondary/30 border-border/40"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">90-Day Locked Pool APY (%)</label>
              <Input
                type="number"
                step="0.1"
                value={apyConfig.locked90}
                onChange={(e) => setApyConfig(prev => ({ ...prev, locked90: Number(e.target.value) }))}
                className="bg-secondary/30 border-border/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApyDialogOpen(false)}>Cancel</Button>
            <Button
              className="bg-[#1ABFA1] hover:bg-[#17a98e] text-white"
              onClick={handleSaveAPY}
              disabled={apySaving}
            >
              {apySaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force Unstake Dialog */}
      <Dialog open={forceUnstakeOpen} onOpenChange={setForceUnstakeOpen}>
        <DialogContent className="bg-[#0f0f1a] border-border/40 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Force Unstake Position</DialogTitle>
            <DialogDescription>
              This will immediately release the staked amount plus accrued rewards back to the user's balance.
            </DialogDescription>
          </DialogHeader>
          {selectedStake && (
            <div className="space-y-3 py-4">
              <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">User</span>
                  <span className="text-white">{selectedStake.user?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pool</span>
                  <span className="text-white">{getPoolName(selectedStake.duration)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Staked Amount</span>
                  <span className="text-white">{selectedStake.amount.toLocaleString()} {selectedStake.asset}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Accrued Rewards</span>
                  <span className="text-[#1ABFA1]">+{selectedStake.accruedRewards.toFixed(6)} {selectedStake.asset}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border/40 pt-2">
                  <span className="text-muted-foreground font-medium">Total to Release</span>
                  <span className="text-white font-medium">
                    {(selectedStake.amount + selectedStake.accruedRewards).toFixed(6)} {selectedStake.asset}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Admin Note (optional)</label>
                <Input
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Reason for force unstake..."
                  className="bg-secondary/30 border-border/40"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setForceUnstakeOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleForceUnstake}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Force Unstake'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

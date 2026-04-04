import { useState, useEffect, useCallback } from 'react'
import { apiCall } from '@/lib/api'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Search,
  MoreHorizontal,
  AlertTriangle,
  Zap,
  ShieldAlert,
  Activity,
  RefreshCw,
  SlidersHorizontal,
  Skull,
} from 'lucide-react'

interface LiquidationStats {
  totalLiquidated: number
  liquidatedToday: number
  liquidatedWeek: number
  totalMarginLost: number
  atRiskTrades: number
  openFuturesCount: number
}

interface LiquidatedTrade {
  _id: string
  user: { _id: string; name: string; email: string }
  asset: string
  side: string
  amount: number
  leverage: number
  entryPrice: number
  closePrice: number
  marginUsed: number
  pnl: number
  liquidatedBy?: 'system' | 'admin'
  liquidatedAt?: string
  adminNote?: string
  createdAt: string
  updatedAt: string
}

interface AtRiskTrade {
  _id: string
  user: { _id: string; name: string; email: string }
  asset: string
  side: string
  amount: number
  leverage: number
  entryPrice: number
  marginUsed: number
  currentPrice: number
  liquidationPrice: number
  unrealizedPnL: number
  marginRatio: number
  distanceToLiquidation: number
  pnlPercentage: number
  createdAt: string
}

export function LiquidationManagementPage() {
  const [activeTab, setActiveTab] = useState<'at-risk' | 'liquidated'>('at-risk')
  const [stats, setStats] = useState<LiquidationStats | null>(null)
  const [liquidatedTrades, setLiquidatedTrades] = useState<LiquidatedTrade[]>([])
  const [atRiskTrades, setAtRiskTrades] = useState<AtRiskTrade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [assetFilter, setAssetFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')

  // Dialog states
  const [isLiquidateDialogOpen, setIsLiquidateDialogOpen] = useState(false)
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState(false)
  const [selectedTrade, setSelectedTrade] = useState<AtRiskTrade | null>(null)
  const [liquidateNote, setLiquidateNote] = useState('')
  const [adjustForm, setAdjustForm] = useState({ liquidationPrice: '', adminNote: '' })

  const fetchStats = useCallback(async () => {
    try {
      const data = await apiCall('/admin/liquidations/stats')
      setStats(data)
    } catch (error) {
      console.error('Failed to fetch liquidation stats:', error)
    }
  }, [])

  const fetchLiquidatedTrades = useCallback(async () => {
    try {
      const data = await apiCall('/admin/liquidations')
      setLiquidatedTrades(data.trades || [])
    } catch (error) {
      console.error('Failed to fetch liquidated trades:', error)
      setLiquidatedTrades([])
    }
  }, [])

  const fetchAtRiskTrades = useCallback(async () => {
    try {
      const data = await apiCall('/admin/liquidations/at-risk')
      setAtRiskTrades(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch at-risk trades:', error)
      setAtRiskTrades([])
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setIsLoading(true)
    await Promise.all([fetchStats(), fetchLiquidatedTrades(), fetchAtRiskTrades()])
    setIsLoading(false)
  }, [fetchStats, fetchLiquidatedTrades, fetchAtRiskTrades])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(() => {
      fetchStats()
      fetchAtRiskTrades()
    }, 15000) // Refresh at-risk data every 15s
    return () => clearInterval(interval)
  }, [fetchAll, fetchStats, fetchAtRiskTrades])

  // Handle manual liquidation
  const handleLiquidate = async () => {
    if (!selectedTrade) return
    setActionLoading(true)
    try {
      await apiCall(`/admin/liquidations/${selectedTrade._id}/liquidate`, {
        method: 'POST',
        body: JSON.stringify({ adminNote: liquidateNote || 'Manually liquidated by admin' }),
      })
      setIsLiquidateDialogOpen(false)
      setSelectedTrade(null)
      setLiquidateNote('')
      fetchAll()
    } catch (error: any) {
      alert(error?.message || 'Failed to liquidate trade')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle adjust liquidation price
  const handleAdjustPrice = async () => {
    if (!selectedTrade) return
    if (!adjustForm.liquidationPrice || parseFloat(adjustForm.liquidationPrice) <= 0) {
      alert('Please enter a valid liquidation price')
      return
    }
    setActionLoading(true)
    try {
      await apiCall(`/admin/liquidations/${selectedTrade._id}/adjust`, {
        method: 'PUT',
        body: JSON.stringify({
          liquidationPrice: parseFloat(adjustForm.liquidationPrice),
          adminNote: adjustForm.adminNote,
        }),
      })
      setIsAdjustDialogOpen(false)
      setSelectedTrade(null)
      setAdjustForm({ liquidationPrice: '', adminNote: '' })
      fetchAll()
    } catch (error: any) {
      alert(error?.message || 'Failed to adjust liquidation price')
    } finally {
      setActionLoading(false)
    }
  }

  const openLiquidateDialog = (trade: AtRiskTrade) => {
    setSelectedTrade(trade)
    setLiquidateNote('')
    setIsLiquidateDialogOpen(true)
  }

  const openAdjustDialog = (trade: AtRiskTrade) => {
    setSelectedTrade(trade)
    setAdjustForm({
      liquidationPrice: trade.liquidationPrice.toString(),
      adminNote: '',
    })
    setIsAdjustDialogOpen(true)
  }

  const getPairSymbol = (asset: string) => {
    const coin = asset.split('/')[0]?.toUpperCase() || asset.toUpperCase()
    const colors: Record<string, string> = {
      BTC: '#F7931A', ETH: '#627EEA', SOL: '#9945FF', XRP: '#23292F', BNB: '#F3BA2F',
    }
    return { coin, color: colors[coin] || '#6D767E' }
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (price >= 1) return `$${price.toFixed(2)}`
    return `$${price.toFixed(4)}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  const getMarginRatioColor = (ratio: number) => {
    if (ratio < 0.1) return 'text-red-500'
    if (ratio < 0.2) return 'text-orange-500'
    if (ratio < 0.3) return 'text-yellow-500'
    return 'text-amber-400'
  }

  const getMarginRatioLabel = (ratio: number) => {
    if (ratio < 0.1) return 'CRITICAL'
    if (ratio < 0.2) return 'DANGER'
    if (ratio < 0.3) return 'WARNING'
    return 'CAUTION'
  }

  // Filter logic
  const filteredLiquidated = liquidatedTrades.filter(t => {
    if (assetFilter !== 'all' && t.asset !== assetFilter) return false
    if (sourceFilter !== 'all' && t.liquidatedBy !== sourceFilter) return false
    if (searchQuery) {
      const s = searchQuery.toLowerCase()
      return t.user?.name?.toLowerCase().includes(s) || t.user?.email?.toLowerCase().includes(s) || t._id.includes(s)
    }
    return true
  })

  const filteredAtRisk = atRiskTrades.filter(t => {
    if (assetFilter !== 'all' && t.asset !== assetFilter) return false
    if (searchQuery) {
      const s = searchQuery.toLowerCase()
      return t.user?.name?.toLowerCase().includes(s) || t.user?.email?.toLowerCase().includes(s) || t._id.includes(s)
    }
    return true
  })

  // Get unique assets for filter
  const uniqueAssets = [...new Set([
    ...liquidatedTrades.map(t => t.asset),
    ...atRiskTrades.map(t => t.asset),
  ])].sort()

  return (
    <DashboardLayout title="Liquidation control">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Liquidated"
          value={stats?.totalLiquidated?.toString() || '0'}
          change={`${stats?.liquidatedToday || 0} today`}
          subtitle="All-time liquidated positions"
        />
        <StatsCard
          title="Liquidated (7d)"
          value={stats?.liquidatedWeek?.toString() || '0'}
          change={`${stats?.totalLiquidated || 0} total`}
          subtitle="Last 7 days liquidations"
        />
        <StatsCard
          title="Total Margin Lost"
          value={`$${(stats?.totalMarginLost || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change={`${stats?.totalLiquidated || 0} events`}
          changeType="negative"
          subtitle="Margin lost to liquidations"
        />
        <StatsCard
          title="At-Risk Positions"
          value={stats?.atRiskTrades?.toString() || '0'}
          change={stats?.atRiskTrades && stats.atRiskTrades > 0 ? 'Attention needed' : 'All clear'}
          changeType={stats?.atRiskTrades && stats.atRiskTrades > 0 ? 'negative' : 'positive'}
          subtitle={`${stats?.openFuturesCount || 0} open futures total`}
        />
      </div>

      {/* Main Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Liquidation Overview</h2>
            <span className="text-[#6D767E] text-sm font-medium">
              ({activeTab === 'at-risk' ? filteredAtRisk.length : filteredLiquidated.length})
            </span>
            {atRiskTrades.length > 0 && (
              <div className="hidden lg:flex items-center gap-2 ml-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs font-bold text-red-500">{atRiskTrades.length} at risk</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={fetchAll}
              variant="ghost"
              className="bg-[#1a1a25] hover:bg-[#2A2933] text-white border border-[#2A2933] rounded-lg h-10 px-4 gap-2"
            >
              <RefreshCw className={cn("h-4 w-4 text-[#6D767E]", isLoading && "animate-spin")} />
              <span className="text-sm font-medium">Refresh</span>
            </Button>
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6D767E]" />
              <Input
                type="search"
                placeholder="Search user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full sm:w-56 bg-[#1a1a25] border-[#2A2933] text-sm h-10 rounded-lg focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <Select value={assetFilter} onValueChange={setAssetFilter}>
              <SelectTrigger className="w-36 bg-[#1a1a25] border-[#2A2933] h-10 rounded-lg">
                <SelectValue placeholder="All Assets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assets</SelectItem>
                {uniqueAssets.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeTab === 'liquidated' && (
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-36 bg-[#1a1a25] border-[#2A2933] h-10 rounded-lg">
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="system">Auto (System)</SelectItem>
                  <SelectItem value="admin">Manual (Admin)</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-[#1a1a25]">
          <button
            onClick={() => setActiveTab('at-risk')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'at-risk'
              ? 'border-red-500 text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            <ShieldAlert className="h-4 w-4" />
            At-Risk Positions ({atRiskTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('liquidated')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'liquidated'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            <Skull className="h-4 w-4" />
            Liquidation History ({liquidatedTrades.length})
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading liquidation data...</p>
            </div>
          ) : activeTab === 'at-risk' ? (
            /* At-Risk Trades Table */
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-white font-bold h-12 py-0">Risk Level</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Pair</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Side</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Leverage</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Entry Price</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Current Price</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Liq. Price</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Distance</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Margin Used</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Unrealized PnL</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAtRisk.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Activity className="h-10 w-10 text-[#06AE7A] mb-2" />
                        <div className="text-[#6D767E] text-lg font-medium">No at-risk positions</div>
                        <div className="text-[#6D767E] text-sm">All futures positions are within safe margin levels</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAtRisk.map((trade) => {
                    const { color } = getPairSymbol(trade.asset)
                    return (
                      <TableRow key={trade._id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "h-2.5 w-2.5 rounded-full animate-pulse",
                              trade.marginRatio < 0.1 ? 'bg-red-500' :
                                trade.marginRatio < 0.2 ? 'bg-orange-500' :
                                  trade.marginRatio < 0.3 ? 'bg-yellow-500' : 'bg-amber-400'
                            )} />
                            <Badge className={cn(
                              "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase border-0",
                              trade.marginRatio < 0.1 ? 'bg-red-500/15 text-red-500' :
                                trade.marginRatio < 0.2 ? 'bg-orange-500/15 text-orange-500' :
                                  trade.marginRatio < 0.3 ? 'bg-yellow-500/15 text-yellow-500' : 'bg-amber-400/15 text-amber-400'
                            )}>
                              {getMarginRatioLabel(trade.marginRatio)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">{trade.user?.name || 'Unknown'}</span>
                            <span className="text-[#6D767E] text-xs">{trade.user?.email || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-bold text-white text-sm">{trade.asset}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase border-0",
                            (trade.side === 'buy' || trade.side === 'long')
                              ? 'bg-[#06AE7A] text-black'
                              : 'bg-destructive text-white'
                          )}>
                            {trade.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[#F59E0B] text-sm">{trade.leverage}x</TableCell>
                        <TableCell className="font-bold text-white text-sm">{formatPrice(trade.entryPrice)}</TableCell>
                        <TableCell className="font-bold text-white text-sm">{formatPrice(trade.currentPrice)}</TableCell>
                        <TableCell className="font-bold text-red-400 text-sm">{formatPrice(trade.liquidationPrice)}</TableCell>
                        <TableCell>
                          <span className={cn("font-bold text-sm", getMarginRatioColor(trade.marginRatio))}>
                            {trade.distanceToLiquidation.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-white font-medium text-sm">${trade.marginUsed.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className={cn("font-bold text-sm", trade.unrealizedPnL >= 0 ? 'text-[#06AE7A]' : 'text-red-500')}>
                            {trade.unrealizedPnL >= 0 ? '+' : ''}{trade.unrealizedPnL.toFixed(2)}
                            <span className="text-xs ml-1 opacity-60">({trade.pnlPercentage.toFixed(1)}%)</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#1a1a25]">
                                <MoreHorizontal className="h-4 w-4 text-white" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#1a1a25] border-[#2A2933]">
                              <DropdownMenuItem
                                onClick={() => openLiquidateDialog(trade)}
                                className="text-red-500 focus:text-red-500 focus:bg-red-500/10 gap-2 cursor-pointer"
                              >
                                <Zap className="h-4 w-4" />
                                Force Liquidate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openAdjustDialog(trade)}
                                className="text-amber-400 focus:text-amber-400 focus:bg-amber-400/10 gap-2 cursor-pointer"
                              >
                                <SlidersHorizontal className="h-4 w-4" />
                                Adjust Liq. Price
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          ) : (
            /* Liquidated Trades History Table */
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-white font-bold h-12 py-0">Trade ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Pair</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Side</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Leverage</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Entry Price</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Close Price</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Margin Lost</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Source</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Date</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLiquidated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Skull className="h-10 w-10 text-[#6D767E] mb-2" />
                        <div className="text-[#6D767E] text-lg font-medium">No liquidated positions</div>
                        <div className="text-[#6D767E] text-sm">Liquidation history will appear here</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLiquidated.map((trade) => {
                    const { color } = getPairSymbol(trade.asset)
                    return (
                      <TableRow key={trade._id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                        <TableCell className="font-bold text-[#6D767E] text-sm">{trade._id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">{trade.user?.name || 'Unknown'}</span>
                            <span className="text-[#6D767E] text-xs">{trade.user?.email || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-bold text-white text-sm">{trade.asset}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase border-0",
                            (trade.side === 'buy' || trade.side === 'long')
                              ? 'bg-[#06AE7A] text-black'
                              : 'bg-destructive text-white'
                          )}>
                            {trade.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[#F59E0B] text-sm">{trade.leverage}x</TableCell>
                        <TableCell className="font-bold text-white text-sm">{formatPrice(trade.entryPrice)}</TableCell>
                        <TableCell className="font-bold text-white text-sm">{formatPrice(trade.closePrice)}</TableCell>
                        <TableCell className="font-bold text-red-500 text-sm">-${trade.marginUsed.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase border-0",
                            trade.liquidatedBy === 'admin'
                              ? 'bg-purple-500/15 text-purple-400'
                              : 'bg-blue-500/15 text-blue-400'
                          )}>
                            {trade.liquidatedBy === 'admin' ? 'Admin' : 'Auto'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[#6D767E] text-sm whitespace-nowrap">
                          {formatDate(trade.liquidatedAt || trade.updatedAt)}
                        </TableCell>
                        <TableCell className="text-[#6D767E] text-sm max-w-[200px] truncate" title={trade.adminNote || ''}>
                          {trade.adminNote || '—'}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Force Liquidate Dialog */}
      <Dialog open={isLiquidateDialogOpen} onOpenChange={setIsLiquidateDialogOpen}>
        <DialogContent className="bg-[#0E0D15] border-[#1a1a25] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Zap className="h-5 w-5 text-red-500" />
              Force Liquidate Position
            </DialogTitle>
            <DialogDescription className="text-[#6D767E]">
              This will immediately close the position at market price, resulting in full margin loss for the user.
            </DialogDescription>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="rounded-lg bg-[#1a1a25] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D767E]">User</span>
                  <span className="text-white font-medium">{selectedTrade.user?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D767E]">Position</span>
                  <span className="text-white font-medium">{selectedTrade.asset} {selectedTrade.side.toUpperCase()} {selectedTrade.leverage}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D767E]">Margin at risk</span>
                  <span className="text-red-500 font-bold">${selectedTrade.marginUsed.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D767E]">Current PnL</span>
                  <span className={cn("font-bold", selectedTrade.unrealizedPnL >= 0 ? 'text-[#06AE7A]' : 'text-red-500')}>
                    {selectedTrade.unrealizedPnL >= 0 ? '+' : ''}${selectedTrade.unrealizedPnL.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#6D767E]">Admin Note (optional)</Label>
                <Input
                  value={liquidateNote}
                  onChange={(e) => setLiquidateNote(e.target.value)}
                  placeholder="Reason for liquidation..."
                  className="bg-[#1a1a25] border-[#2A2933] text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsLiquidateDialogOpen(false)}
              className="bg-[#1a1a25] hover:bg-[#2A2933] text-white border border-[#2A2933]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLiquidate}
              disabled={actionLoading}
              className="bg-red-500 hover:bg-red-600 text-white font-bold"
            >
              {actionLoading ? 'Liquidating...' : 'Confirm Liquidation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adjust Liquidation Price Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent className="bg-[#0E0D15] border-[#1a1a25] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-amber-400" />
              Adjust Liquidation Price
            </DialogTitle>
            <DialogDescription className="text-[#6D767E]">
              Modify the liquidation trigger price for this position. This overrides the calculated liquidation price.
            </DialogDescription>
          </DialogHeader>
          {selectedTrade && (
            <div className="space-y-4">
              <div className="rounded-lg bg-[#1a1a25] p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D767E]">User</span>
                  <span className="text-white font-medium">{selectedTrade.user?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D767E]">Position</span>
                  <span className="text-white font-medium">{selectedTrade.asset} {selectedTrade.side.toUpperCase()} {selectedTrade.leverage}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D767E]">Entry Price</span>
                  <span className="text-white font-medium">{formatPrice(selectedTrade.entryPrice)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6D767E]">Current Liq. Price</span>
                  <span className="text-red-400 font-bold">{formatPrice(selectedTrade.liquidationPrice)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#6D767E]">New Liquidation Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={adjustForm.liquidationPrice}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, liquidationPrice: e.target.value }))}
                  placeholder="Enter new liquidation price..."
                  className="bg-[#1a1a25] border-[#2A2933] text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[#6D767E]">Admin Note (optional)</Label>
                <Input
                  value={adjustForm.adminNote}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, adminNote: e.target.value }))}
                  placeholder="Reason for adjustment..."
                  className="bg-[#1a1a25] border-[#2A2933] text-white"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsAdjustDialogOpen(false)}
              className="bg-[#1a1a25] hover:bg-[#2A2933] text-white border border-[#2A2933]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustPrice}
              disabled={actionLoading}
              className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

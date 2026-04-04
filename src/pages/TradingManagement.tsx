import { useState, useEffect, useCallback } from 'react'
import { apiCall } from '@/lib/api'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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
import { Search, Filter, Download, MoreHorizontal, Plus, Pencil, X } from 'lucide-react'

interface Trade {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  asset: string
  type: 'spot' | 'futures'
  market?: 'crypto' | 'stock' | 'commodities'
  side: 'buy' | 'sell' | 'long' | 'short'
  amount: number
  leverage: number
  entryPrice: number
  closePrice?: number
  marginUsed: number
  liquidationPrice?: number
  status: 'open' | 'closed' | 'liquidated'
  pnl: number
  adminNote?: string
  currentPrice?: number
  unrealizedPnL?: number
  pnlPercentage?: number
  createdAt: string
}

export function TradingManagementPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'spot' | 'futures'>('spot')
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog states
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isNewTradeDialogOpen, setIsNewTradeDialogOpen] = useState(false)
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null)

  // Live prices
  const [livePrices, setLivePrices] = useState<Record<string, number>>({})

  // Edit form
  const [editForm, setEditForm] = useState({
    entryPrice: '',
    adminNote: '',
  })
  // Edit dialog: preview state
  const [editPreview, setEditPreview] = useState<{
    currentMarketPrice: number | null
    newPnL: number | null
    newPnlPct: number | null
    newLiqPrice: number | null
  }>({ currentMarketPrice: null, newPnL: null, newPnlPct: null, newLiqPrice: null })

  // New trade form
  const [newTradeForm, setNewTradeForm] = useState({
    userId: '',
    tradeType: 'spot' as 'spot' | 'futures',
    market: 'crypto' as 'crypto' | 'stock' | 'commodities',
    pair: 'BTC/USDT',
    side: 'buy' as 'buy' | 'sell' | 'long' | 'short',
    leverage: '1',
    entryPrice: '',
    amount: '',
    usdPositionSize: '', // helper field: dollar position size
  })
  const [userBalanceInfo, setUserBalanceInfo] = useState<{
    balance: number
    futuresBalance: number
    name: string
    email: string
    isFrozen: boolean
    kycStatus: string
    openTradesCount: number
    lockedMargin: number
  } | null>(null)
  const [userBalanceLoading, setUserBalanceLoading] = useState(false)
  const [sizeMode, setSizeMode] = useState<'usd' | 'asset'>('usd')
  const [currentPairPrice, setCurrentPairPrice] = useState<number | null>(null)
  const [pairPriceLoading, setPairPriceLoading] = useState(false)

  const fetchTrades = useCallback(async () => {
    try {
      const data = await apiCall('/admin/trades')
      if (Array.isArray(data)) {
        setTrades(data)
      } else {
        setTrades([])
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error)
      setTrades([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchPrices = useCallback(async () => {
    try {
      const data = await apiCall('/trades/prices?symbols=BTC/USDT,ETH/USDT,SOL/USDT,XRP/USDT,BNB/USDT')
      if (data && typeof data === 'object') {
        setLivePrices(data)
      }
    } catch (error) {
      console.error('Failed to fetch prices:', error)
    }
  }, [])

  useEffect(() => {
    fetchTrades()
    fetchPrices()
    const interval = setInterval(fetchPrices, 10000)
    return () => clearInterval(interval)
  }, [fetchTrades, fetchPrices])

  // Filter trades by tab
  const filteredTrades = trades.filter(t => {
    if (t.type !== activeTab) return false
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase()
      return t.user?.email?.toLowerCase().includes(s) ||
             t.user?.name?.toLowerCase().includes(s) ||
             t.asset?.toLowerCase().includes(s) ||
             t.status?.toLowerCase().includes(s) ||
             t._id.toLowerCase().includes(s)
    }
    return true
  })
  const spotTrades = trades.filter(t => t.type === 'spot')
  const futuresTrades = trades.filter(t => t.type === 'futures')
  const openTrades = trades.filter(t => t.status === 'open')
  const liquidationAlerts = futuresTrades.filter(t => {
    if (t.status !== 'open' || !t.pnlPercentage) return false
    return t.pnlPercentage < -80
  })

  // Stats
  const totalSpotVolume = spotTrades.reduce((sum, t) => sum + (t.amount * t.entryPrice), 0)
  const totalFuturesVolume = futuresTrades.reduce((sum, t) => sum + t.marginUsed, 0)

  const fetchUserBalance = async (userId: string) => {
    if (!userId.trim() || userId.length < 20) return
    setUserBalanceLoading(true)
    try {
      const data = await apiCall(`/admin/users/${userId}`)
      if (data?.balance !== undefined) {
        // Compute locked margin from already-loaded open trades for this user
        const userOpenTrades = trades.filter(
          t => t.status === 'open' && (t.user?._id === userId || (t.user as any) === userId)
        )
        const lockedMargin = userOpenTrades.reduce((sum, t) => sum + (t.marginUsed || 0), 0)
        setUserBalanceInfo({
          balance: data.balance,
          futuresBalance: typeof data.futuresBalance === 'number' ? data.futuresBalance : 0,
          name: data.name || 'User',
          email: data.email || '',
          isFrozen: !!data.isFrozen,
          kycStatus: data.kycStatus || 'none',
          openTradesCount: userOpenTrades.length,
          lockedMargin,
        })
      } else {
        setUserBalanceInfo(null)
      }
    } catch {
      setUserBalanceInfo(null)
    } finally {
      setUserBalanceLoading(false)
    }
  }

  const fetchPairPrice = async (pair: string) => {
    if (!pair) return
    setPairPriceLoading(true)
    setCurrentPairPrice(null)
    try {
      const data = await apiCall(`/trades/prices?symbols=${encodeURIComponent(pair)}`)
      if (data && typeof data === 'object' && data[pair] > 0) {
        setCurrentPairPrice(data[pair])
      }
    } catch {
      // Price unavailable — admin can type entry price manually
    } finally {
      setPairPriceLoading(false)
    }
  }

  // Compute derived values for Open Trade margin preview
  const openTradeMarginPreview = (() => {
    const price = newTradeForm.entryPrice
      ? parseFloat(newTradeForm.entryPrice)
      : currentPairPrice || livePrices[newTradeForm.pair] || 0
    const leverage = parseInt(newTradeForm.leverage) || 1
    let positionUSD: number
    if (sizeMode === 'usd' && parseFloat(newTradeForm.usdPositionSize) > 0) {
      positionUSD = parseFloat(newTradeForm.usdPositionSize)
    } else {
      const amount = parseFloat(newTradeForm.amount) || 0
      positionUSD = price > 0 ? amount * price : 0
    }
    if (!positionUSD) return null
    const marginRequired = positionUSD / leverage
    const isFutures = newTradeForm.tradeType === 'futures'
    const relevantBalance = userBalanceInfo
      ? (isFutures ? userBalanceInfo.futuresBalance : userBalanceInfo.balance)
      : 0
    const canOpen = userBalanceInfo ? relevantBalance >= marginRequired : null
    const canTransfer = isFutures && !canOpen && userBalanceInfo ? userBalanceInfo.balance >= marginRequired : false
    return { positionUSD, marginRequired, canOpen, isFutures, relevantBalance, canTransfer }
  })()

  // When USD position size is typed, auto-fill amount in asset units
  const handleUsdPositionSizeChange = (usd: string) => {
    setNewTradeForm(prev => {
      const price = prev.entryPrice
        ? parseFloat(prev.entryPrice)
        : currentPairPrice || livePrices[prev.pair] || 0
      const usdNum = parseFloat(usd)
      const autoAmount = price > 0 && !isNaN(usdNum) ? (usdNum / price).toFixed(6) : prev.amount
      return { ...prev, usdPositionSize: usd, amount: autoAmount }
    })
  }

  // Compute edit dialog PnL preview when entryPrice input changes
  const computeEditPreview = (newEntryPriceStr: string) => {
    if (!editingTrade) return
    const newEntryPrice = parseFloat(newEntryPriceStr)
    if (isNaN(newEntryPrice) || newEntryPrice <= 0) {
      setEditPreview({ currentMarketPrice: null, newPnL: null, newPnlPct: null, newLiqPrice: null })
      return
    }
    const currentMarketPrice = livePrices[editingTrade.asset] || editingTrade.currentPrice || null
    let newPnL: number | null = null
    let newPnlPct: number | null = null
    if (currentMarketPrice) {
      const isBuySide = editingTrade.side === 'buy' || editingTrade.side === 'long'
      // Recalculate the coin amount for the new entry price — mirrors the backend invariant:
      //   amount = (marginUsed × leverage) / entryPrice
      // Using the original editingTrade.amount would produce the wrong coin count, hence wrong PnL.
      const newAmount = (editingTrade.marginUsed * editingTrade.leverage) / newEntryPrice
      // PnL formula matches the backend: (priceDelta × newAmount) — NO leverage multiplier.
      // Leverage only reduces the required margin; it does NOT amplify P&L in this system.
      const rawPnL = isBuySide
        ? (currentMarketPrice - newEntryPrice) * newAmount
        : (newEntryPrice - currentMarketPrice) * newAmount
      // Cap loss at -marginUsed (same cap as the backend)
      newPnL = parseFloat(Math.max(rawPnL, -editingTrade.marginUsed).toFixed(2))
      newPnlPct = editingTrade.marginUsed > 0 ? parseFloat(((newPnL / editingTrade.marginUsed) * 100).toFixed(2)) : 0
    }
    let newLiqPrice: number | null = null
    if (editingTrade.type === 'futures' && editingTrade.leverage > 1) {
      const direction = (editingTrade.side === 'buy' || editingTrade.side === 'long') ? 1 : -1
      newLiqPrice = parseFloat((newEntryPrice * (1 - direction / editingTrade.leverage)).toFixed(2))
    }
    setEditPreview({ currentMarketPrice, newPnL, newPnlPct, newLiqPrice })
  }

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade)
    setEditForm({
      entryPrice: trade.entryPrice.toString(),
      adminNote: trade.adminNote || '',
    })
    setEditPreview({ currentMarketPrice: null, newPnL: null, newPnlPct: null, newLiqPrice: null })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTrade) return
    setActionLoading(true)
    try {
      await apiCall(`/admin/trades/${editingTrade._id}/entry-price`, {
        method: 'PUT',
        body: JSON.stringify({
          entryPrice: parseFloat(editForm.entryPrice),
          adminNote: editForm.adminNote,
        }),
      })
      setIsEditDialogOpen(false)
      setEditingTrade(null)
      setEditPreview({ currentMarketPrice: null, newPnL: null, newPnlPct: null, newLiqPrice: null })
      fetchTrades()
    } catch (error) {
      console.error('Failed to update trade:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCloseTrade = async (tradeId: string) => {
    if (!confirm('Are you sure you want to force close this trade?')) return
    setActionLoading(true)
    try {
      await apiCall(`/admin/trades/${tradeId}/close`, {
        method: 'POST',
        body: JSON.stringify({ adminNote: 'Force closed by admin' }),
      })
      fetchTrades()
    } catch (error) {
      console.error('Failed to close trade:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const handleOpenNewTrade = () => {
    const initialPair = 'BTC/USDT'
    setNewTradeForm({
      userId: '',
      tradeType: activeTab,
      market: 'crypto',
      pair: initialPair,
      side: activeTab === 'spot' ? 'buy' : 'long',
      leverage: activeTab === 'futures' ? '10' : '1',
      entryPrice: '',
      amount: '',
      usdPositionSize: '',
    })
    setUserBalanceInfo(null)
    setSizeMode('usd')
    setCurrentPairPrice(null)
    setIsNewTradeDialogOpen(true)
    fetchPairPrice(initialPair)
  }

  const handleCreateTrade = async () => {
    if (!newTradeForm.userId.trim()) {
      alert('Please enter a user ID')
      return
    }
    if (!newTradeForm.amount || parseFloat(newTradeForm.amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }
    setActionLoading(true)
    try {
      await apiCall('/admin/trades/open-for-user', {
        method: 'POST',
        body: JSON.stringify({
          userId: newTradeForm.userId,
          asset: newTradeForm.pair,
          type: newTradeForm.tradeType,
          market: newTradeForm.market,
          side: newTradeForm.side,
          amount: parseFloat(newTradeForm.amount),
          leverage: parseInt(newTradeForm.leverage) || 1,
          entryPrice: newTradeForm.entryPrice ? parseFloat(newTradeForm.entryPrice) : undefined,
        }),
      })
      setIsNewTradeDialogOpen(false)
      setUserBalanceInfo(null)
      fetchTrades()
    } catch (error: any) {
      alert(error?.message || 'Failed to create trade')
    } finally {
      setActionLoading(false)
    }
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

  return (
    <DashboardLayout title="Trading management">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Spot Volume"
          value={`$${totalSpotVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change={`${spotTrades.length} orders`}
          subtitle="Spot trading volume"
        />
        <StatsCard
          title="Total Futures Volume"
          value={`$${totalFuturesVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          change={`${futuresTrades.length} positions`}
          subtitle="Futures trading volume"
        />
        <StatsCard
          title="Open Positions"
          value={openTrades.length.toString()}
          change={`${openTrades.filter(t => (t.unrealizedPnL || 0) > 0).length} profitable`}
          subtitle="Currently active positions"
        />
        <StatsCard
          title="Liquidation Alerts"
          value={liquidationAlerts.length.toString()}
          change={liquidationAlerts.length > 0 ? 'Attention needed' : 'All clear'}
          subtitle="Risk management alerts"
        />
      </div>

      {/* Trades Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Active Trades</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredTrades.length})</span>
            {/* Live Prices Ticker */}
            {Object.keys(livePrices).length > 0 && (
              <div className="hidden lg:flex items-center gap-4 ml-4 px-4 py-1.5 bg-[#1a1a25] rounded-lg border border-[#2A2933]">
                <span className="text-xs font-bold text-[#6D767E] uppercase tracking-wider">Live:</span>
                <div className="flex items-center gap-3">
                  {Object.entries(livePrices).slice(0, 3).map(([symbol, price], i) => (
                    <span key={symbol} className="flex items-center gap-1.5 text-xs font-medium text-white">
                      {i > 0 && <span className="w-px h-3 bg-[#2A2933] mr-1.5" />}
                      <span style={{ color: getPairSymbol(symbol).color }}>{getPairSymbol(symbol).coin}</span>
                      {formatPrice(price)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleOpenNewTrade}
              className="bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black font-bold rounded-lg h-10 px-4 gap-2"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Open Trade</span>
            </Button>
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

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-[#1a1a25]">
          <button
            onClick={() => setActiveTab('spot')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'spot'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Spot Orders ({spotTrades.length})
          </button>
          <button
            onClick={() => setActiveTab('futures')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'futures'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Futures Positions ({futuresTrades.length})
          </button>
        </div>

        {/* Unified Trades Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading trades...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === filteredTrades.length && filteredTrades.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? filteredTrades.map(t => t._id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Trade ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User Info</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Pair</TableHead>
                  {activeTab === 'futures' && <TableHead className="text-white font-bold h-12 py-0">Leverage</TableHead>}
                  <TableHead className="text-white font-bold h-12 py-0">Side</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Amount</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Entry Price</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Current Price</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">PnL</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Date</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeTab === 'futures' ? 13 : 12} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[#6D767E] text-lg font-medium">
                          No {activeTab === 'spot' ? 'spot orders' : 'futures positions'} yet
                        </div>
                        <div className="text-[#6D767E] text-sm">
                          {activeTab === 'spot' ? 'Spot trading orders' : 'Futures positions'} will appear here once users start trading
                        </div>
                        <Button onClick={fetchTrades} className="mt-2 bg-primary hover:bg-primary/90">Refresh</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrades.map((trade) => {
                    const pnl = trade.status === 'open' ? (trade.unrealizedPnL || 0) : trade.pnl
                    const pnlPct = trade.pnlPercentage || (trade.marginUsed > 0 ? (pnl / trade.marginUsed) * 100 : 0)
                    const isPnlPositive = pnl >= 0
                    const { color } = getPairSymbol(trade.asset)

                    return (
                      <TableRow key={trade._id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                        <TableCell className="w-12">
                          <Checkbox
                            className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                            checked={selectedItems.includes(trade._id)}
                            onCheckedChange={(checked) => {
                              setSelectedItems(
                                checked
                                  ? [...selectedItems, trade._id]
                                  : selectedItems.filter((id) => id !== trade._id)
                              )
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-bold text-[#6D767E] text-sm">{trade._id.slice(-6).toUpperCase()}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-white font-bold text-sm">{trade.user?.name || 'Unknown'}</span>
                            <span className="text-[#6D767E] text-xs">{trade.user?.email || 'N/A'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="flex flex-col gap-1">
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                              <span className="font-bold text-white text-sm">{trade.asset}</span>
                            </span>
                            {trade.market && (
                              <span className={cn(
                                "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded w-fit",
                                trade.market === 'crypto' ? 'bg-[#06AE7A]/10 text-[#06AE7A]'
                                  : trade.market === 'stock' ? 'bg-[#F59E0B]/10 text-[#F59E0B]'
                                  : 'bg-[#C0C0C0]/10 text-[#C0C0C0]'
                              )}>
                                {trade.market}
                              </span>
                            )}
                          </span>
                        </TableCell>
                        {activeTab === 'futures' && (
                          <TableCell className="font-medium text-[#F59E0B] text-sm">{trade.leverage}x</TableCell>
                        )}
                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase",
                              (trade.side === 'buy' || trade.side === 'long')
                                ? 'bg-[#06AE7A] text-black'
                                : 'bg-destructive text-white'
                            )}
                          >
                            {trade.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-white text-sm">{trade.amount}</TableCell>
                        <TableCell className="font-bold text-white text-sm">{formatPrice(trade.entryPrice)}</TableCell>
                        <TableCell className="font-medium text-[#6D767E] text-sm">
                          {trade.status === 'open'
                            ? formatPrice(trade.currentPrice || trade.entryPrice)
                            : trade.closePrice ? formatPrice(trade.closePrice) : '—'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              isPnlPositive ? "bg-[#06AE7A] shadow-[0_0_8px_rgba(6,174,122,0.4)]" : "bg-destructive"
                            )} />
                            <span className={cn(
                              "font-bold text-sm",
                              isPnlPositive ? "text-[#06AE7A]" : "text-destructive"
                            )}>
                              {isPnlPositive ? '+' : ''}${pnl.toFixed(2)} ({pnlPct.toFixed(1)}%)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase",
                              trade.status === 'open'
                                ? 'bg-[#06AE7A]/10 text-[#06AE7A] border border-[#06AE7A]/20'
                                : trade.status === 'liquidated'
                                  ? 'bg-destructive/10 text-destructive border border-destructive/20'
                                  : 'bg-[#6D767E]/10 text-[#6D767E] border border-[#6D767E]/20'
                            )}
                          >
                            {trade.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium text-[#6D767E] text-xs">{new Date(trade.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#1a1a25] hover:bg-[#2A2933] rounded-lg border border-[#2A2933]">
                                <MoreHorizontal className="h-4 w-4 text-[#6D767E]" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-[#0e0d15] border-[#1a1a25] rounded-xl shadow-2xl">
                              {trade.status === 'open' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleEditTrade(trade)}
                                    className="focus:bg-[#1a1a25] cursor-pointer gap-2"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit Entry Price
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleCloseTrade(trade._id)}
                                    className="text-destructive focus:bg-destructive/10 cursor-pointer gap-2"
                                  >
                                    <X className="h-4 w-4" />
                                    Force Close
                                  </DropdownMenuItem>
                                </>
                              )}
                              {trade.adminNote && (
                                <DropdownMenuItem className="focus:bg-[#1a1a25] cursor-pointer text-[#6D767E] text-xs">
                                  Note: {trade.adminNote}
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Edit Entry Price Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) setEditPreview({ currentMarketPrice: null, newPnL: null, newPnlPct: null, newLiqPrice: null })
      }}>
        <DialogContent className="bg-[#0E0D15] border-[#1a1a25] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Edit Entry Price</DialogTitle>
            <DialogDescription className="text-[#6D767E]">
              Modify the entry price for trade #{editingTrade?._id.slice(-6).toUpperCase()}
              {editingTrade && (
                <span className="block mt-1">
                  {editingTrade.user?.name} — {editingTrade.asset} {editingTrade.side.toUpperCase()} ×{editingTrade.leverage} | Margin: ${editingTrade.marginUsed.toFixed(2)}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Current state info */}
            {editingTrade && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1a1a25] rounded-lg p-2.5 border border-[#2A2933]">
                  <span className="text-[#6D767E] block">Current Entry</span>
                  <span className="text-white font-bold">{formatPrice(editingTrade.entryPrice)}</span>
                </div>
                <div className="bg-[#1a1a25] rounded-lg p-2.5 border border-[#2A2933]">
                  <span className="text-[#6D767E] block">Live Market Price</span>
                  <span className="text-[#06AE7A] font-bold">
                    {livePrices[editingTrade.asset] ? formatPrice(livePrices[editingTrade.asset]) : '—'}
                  </span>
                </div>
                {editingTrade.type === 'futures' && editingTrade.liquidationPrice && (
                  <div className="bg-[#1a1a25] rounded-lg p-2.5 border border-[#2A2933]">
                    <span className="text-[#6D767E] block">Current Liq. Price</span>
                    <span className="text-destructive font-bold">{formatPrice(editingTrade.liquidationPrice)}</span>
                  </div>
                )}
                <div className="bg-[#1a1a25] rounded-lg p-2.5 border border-[#2A2933]">
                  <span className="text-[#6D767E] block">Current PnL</span>
                  <span className={cn("font-bold", (editingTrade.unrealizedPnL || 0) >= 0 ? 'text-[#06AE7A]' : 'text-destructive')}>
                    {(editingTrade.unrealizedPnL || 0) >= 0 ? '+' : ''}${(editingTrade.unrealizedPnL || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            <div className="grid gap-2">
              <Label className="text-white font-medium">New Entry Price</Label>
              <Input
                type="number"
                step="any"
                value={editForm.entryPrice}
                onChange={(e) => {
                  setEditForm({ ...editForm, entryPrice: e.target.value })
                  computeEditPreview(e.target.value)
                }}
                className="bg-[#1a1a25] border-[#2A2933] text-white"
                placeholder="Enter new entry price"
              />
            </div>

            {/* PnL Preview after price change */}
            {editPreview.newPnL !== null && editingTrade && (
              <div className={cn(
                "rounded-lg p-3 border space-y-2",
                editPreview.newPnL >= 0
                  ? 'bg-[#06AE7A]/10 border-[#06AE7A]/30'
                  : 'bg-destructive/10 border-destructive/30'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#6D767E] uppercase tracking-wider">PnL After Change</span>
                  <span className={cn("font-bold text-sm", editPreview.newPnL >= 0 ? 'text-[#06AE7A]' : 'text-destructive')}>
                    {editPreview.newPnL >= 0 ? '+' : ''}${editPreview.newPnL.toFixed(2)}
                    {editPreview.newPnlPct !== null && (
                      <span className="text-xs ml-1">({editPreview.newPnlPct >= 0 ? '+' : ''}{editPreview.newPnlPct.toFixed(1)}%)</span>
                    )}
                  </span>
                </div>
                {editPreview.newLiqPrice !== null && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6D767E]">New Liquidation Price</span>
                    <span className="text-destructive font-bold">{formatPrice(editPreview.newLiqPrice)}</span>
                  </div>
                )}
                {editPreview.currentMarketPrice && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#6D767E]">Calc: ({editingTrade.side === 'long' || editingTrade.side === 'buy' ? 'market' : 'entry'} ${editPreview.currentMarketPrice.toFixed(2)} - {editingTrade.side === 'long' || editingTrade.side === 'buy' ? 'entry' : 'market'} ${parseFloat(editForm.entryPrice).toFixed(2)}) × {editingTrade.amount} × {editingTrade.leverage}x</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-white font-medium">Admin Note (optional)</Label>
              <Input
                value={editForm.adminNote}
                onChange={(e) => setEditForm({ ...editForm, adminNote: e.target.value })}
                className="bg-[#1a1a25] border-[#2A2933] text-white"
                placeholder="Reason for price change"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="bg-transparent border-[#2A2933] text-white hover:bg-[#1a1a25]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={actionLoading || !editForm.entryPrice}
              className="bg-[#06AE7A] text-black hover:bg-[#06AE7A]/90 font-bold"
            >
              {actionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Open New Trade Dialog */}
      <Dialog open={isNewTradeDialogOpen} onOpenChange={setIsNewTradeDialogOpen}>
        <DialogContent className="bg-[#0E0D15] border-[#1a1a25] text-white max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">Open New Trade for User</DialogTitle>
            <DialogDescription className="text-[#6D767E]">
              Create a new trade on behalf of a user. Balance will be deducted from the user's account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-white font-medium">User ID</Label>
              <div className="flex gap-2">
                <Input
                  value={newTradeForm.userId}
                  onChange={(e) => {
                    setNewTradeForm({ ...newTradeForm, userId: e.target.value })
                    setUserBalanceInfo(null)
                  }}
                  className="bg-[#1a1a25] border-[#2A2933] text-white flex-1"
                  placeholder="Enter user ID (MongoDB ObjectId)"
                />
                <Button
                  type="button"
                  onClick={() => fetchUserBalance(newTradeForm.userId)}
                  disabled={userBalanceLoading || newTradeForm.userId.length < 20}
                  className="bg-[#1a1a25] border border-[#2A2933] text-white hover:bg-[#2A2933] shrink-0 px-3"
                >
                  {userBalanceLoading ? '...' : 'Check'}
                </Button>
              </div>
              {userBalanceInfo && (
                <div className="rounded-xl border border-[#2A2933] bg-[#0a0918] mt-2 overflow-hidden shadow-lg">
                  {/* Header: avatar initial + name/email + badges */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a25] bg-[#0d0b1a]">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#06AE7A]/30 to-[#3B82F6]/30 border border-[#2A2933] flex items-center justify-center shrink-0">
                      <span className="text-white font-bold text-sm">{userBalanceInfo.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm leading-tight truncate">{userBalanceInfo.name}</p>
                      <p className="text-[#6D767E] text-[11px] truncate">{userBalanceInfo.email}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                        userBalanceInfo.isFrozen
                          ? 'bg-destructive/15 text-destructive border border-destructive/25'
                          : 'bg-[#06AE7A]/15 text-[#06AE7A] border border-[#06AE7A]/25'
                      )}>
                        {userBalanceInfo.isFrozen ? 'Frozen' : 'Active'}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full",
                        userBalanceInfo.kycStatus === 'verified'
                          ? 'bg-[#06AE7A]/15 text-[#06AE7A] border border-[#06AE7A]/25'
                          : userBalanceInfo.kycStatus === 'pending'
                          ? 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25'
                          : 'bg-[#6D767E]/15 text-[#6D767E] border border-[#6D767E]/25'
                      )}>
                        KYC: {userBalanceInfo.kycStatus}
                      </span>
                    </div>
                  </div>

                  {/* Balance row */}
                  <div className="grid grid-cols-3 divide-x divide-[#1a1a25]">
                    <div className="px-3 py-3 flex flex-col gap-1">
                      <p className="text-[#6D767E] text-[9px] font-semibold uppercase tracking-widest">Spot Balance</p>
                      <p className="text-[#06AE7A] font-bold text-[15px] leading-tight tabular-nums">
                        ${userBalanceInfo.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="px-3 py-3 flex flex-col gap-1">
                      <p className="text-[#6D767E] text-[9px] font-semibold uppercase tracking-widest">Futures Balance</p>
                      <p className="text-[#3B82F6] font-bold text-[15px] leading-tight tabular-nums">
                        ${userBalanceInfo.futuresBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="px-3 py-3 flex flex-col gap-1">
                      <p className="text-[#6D767E] text-[9px] font-semibold uppercase tracking-widest">Open Trades</p>
                      <p className="text-white font-bold text-[15px] leading-tight tabular-nums">{userBalanceInfo.openTradesCount}</p>
                    </div>
                  </div>

                  {userBalanceInfo.isFrozen && (
                    <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20 flex items-center gap-2">
                      <span className="text-destructive text-sm">⚠</span>
                      <p className="text-destructive text-[11px] font-semibold">Account is frozen — trade may be rejected</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label className="text-white font-medium">Trade Type</Label>
              <Select
                value={newTradeForm.tradeType}
                onValueChange={(value: 'spot' | 'futures') => setNewTradeForm({
                  ...newTradeForm,
                  tradeType: value,
                  side: value === 'futures' ? 'long' : 'buy',
                  leverage: value === 'futures' ? '10' : '1',
                  usdPositionSize: '',
                  amount: '',
                })}
              >
                <SelectTrigger className="bg-[#1a1a25] border-[#2A2933] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a25] border-[#2A2933]">
                  <SelectItem value="spot">Spot Order</SelectItem>
                  <SelectItem value="futures">Futures Position</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-white font-medium">Market</Label>
              <Select
                value={newTradeForm.market}
                onValueChange={(value: 'crypto' | 'stock' | 'commodities') => {
                  const newPair = value === 'crypto' ? 'BTC/USDT' : value === 'stock' ? 'AAPL' : 'GOLD'
                  setNewTradeForm({
                    ...newTradeForm,
                    market: value,
                    pair: newPair,
                    usdPositionSize: '',
                    amount: '',
                  })
                  fetchPairPrice(newPair)
                }}
              >
                <SelectTrigger className="bg-[#1a1a25] border-[#2A2933] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a25] border-[#2A2933]">
                  <SelectItem value="crypto">Crypto</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="commodities">Commodities</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-white font-medium">Trading Pair</Label>
<Select
                value={newTradeForm.pair}
                onValueChange={(value) => {
                  setNewTradeForm({ ...newTradeForm, pair: value, usdPositionSize: '', amount: '' })
                  fetchPairPrice(value)
                }}
              >
                <SelectTrigger className="bg-[#1a1a25] border-[#2A2933] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a25] border-[#2A2933] max-h-72">
                  {newTradeForm.market === 'crypto' && (
                    <SelectGroup>
                      <SelectLabel className="text-[#06AE7A] text-xs font-bold px-2 py-1">── Crypto ──</SelectLabel>
                      {['BTC/USDT','ETH/USDT','SOL/USDT','BNB/USDT','XRP/USDT','DOGE/USDT','ADA/USDT','AVAX/USDT','DOT/USDT','LINK/USDT','LTC/USDT','NEAR/USDT','APT/USDT','ATOM/USDT','UNI/USDT','TRX/USDT','TON/USDT','SHIB/USDT','BCH/USDT','ICP/USDT','FIL/USDT','HBAR/USDT','VET/USDT','OP/USDT','ARB/USDT','MKR/USDT','AAVE/USDT','GRT/USDT','STX/USDT','INJ/USDT','IMX/USDT','ALGO/USDT','ETC/USDT','EGLD/USDT','SAND/USDT','MANA/USDT','AXS/USDT','THETA/USDT','FTM/USDT','RUNE/USDT','KAS/USDT','SUI/USDT','SEI/USDT','TIA/USDT','JUP/USDT','WIF/USDT','BONK/USDT','PEPE/USDT','FLOKI/USDT','NOT/USDT','RENDER/USDT','FET/USDT','AGIX/USDT','OCEAN/USDT','WLD/USDT','CFX/USDT','ROSE/USDT','ZIL/USDT','ONE/USDT','HOT/USDT','ENJ/USDT','CHZ/USDT','GALA/USDT','GMT/USDT','MAGIC/USDT','BLUR/USDT','DYDX/USDT','SNX/USDT','LRC/USDT','BAT/USDT','ZRX/USDT','COMP/USDT','YFI/USDT','CRV/USDT','CVX/USDT'].map(p => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {newTradeForm.market === 'stock' && (
                    <SelectGroup>
                      <SelectLabel className="text-[#f59e0b] text-xs font-bold px-2 py-1">── Stocks ──</SelectLabel>
                      {['AAPL','MSFT','NVDA','GOOGL','AMZN','TSLA','META','NFLX','JPM','V','WMT','DIS','AMD','INTC','COIN','PYPL','UBER','ORCL','CRM','BABA','GS','MS','BAC','XOM','CVX','NKE','KO','PEP','MCD','SBUX','JNJ','PG','BA','TSM','ASML','SHOP','ABNB','PLTR','SNOW','SPOT','SQ','HOOD','MSTR','ARM','AVGO','QCOM','MU','ADBE','NOW','RBLX'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {newTradeForm.market === 'commodities' && (
                    <SelectGroup>
                      <SelectLabel className="text-[#C0C0C0] text-xs font-bold px-2 py-1">── Commodities ──</SelectLabel>
                      {[['GOLD','Gold'],['SILVER','Silver'],['OIL','Crude Oil'],['NATGAS','Natural Gas'],['WHEAT','Wheat'],['CORN','Corn'],['COPPER','Copper'],['PLAT','Platinum'],['COFFEE','Coffee'],['SUGAR','Sugar']].map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label} ({val})</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Current Market Price — always shown, fetched per selected pair */}
            <div className="bg-[#1a1a25] border border-[#2A2933] rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-[#6D767E] text-xs font-medium uppercase tracking-wider">Market Price</p>
                <p className="text-white text-xs mt-0.5">{newTradeForm.pair}</p>
              </div>
              <div className="text-right">
                {pairPriceLoading ? (
                  <span className="text-[#6D767E] text-sm animate-pulse">Fetching...</span>
                ) : (currentPairPrice || livePrices[newTradeForm.pair]) ? (
                  <span className="text-[#06AE7A] font-bold text-xl">
                    {formatPrice(currentPairPrice || livePrices[newTradeForm.pair])}
                  </span>
                ) : (
                  <span className="text-[#6D767E] text-sm">Unavailable — enter manually</span>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-white font-medium">Side</Label>
              <Select
                value={newTradeForm.side}
                onValueChange={(value: 'buy' | 'sell' | 'long' | 'short') => setNewTradeForm({ ...newTradeForm, side: value })}
              >
                <SelectTrigger className="bg-[#1a1a25] border-[#2A2933] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a25] border-[#2A2933]">
                  {newTradeForm.tradeType === 'spot' ? (
                    <>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="long">Long</SelectItem>
                      <SelectItem value="short">Short</SelectItem>
                    </>
                  )}

                </SelectContent>
              </Select>
            </div>

            {newTradeForm.tradeType === 'futures' && (
              <div className="grid gap-2">
                <Label className="text-white font-medium">Leverage</Label>
                <Select
                  value={newTradeForm.leverage}
                  onValueChange={(value) => setNewTradeForm({ ...newTradeForm, leverage: value })}
                >
                  <SelectTrigger className="bg-[#1a1a25] border-[#2A2933] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a25] border-[#2A2933]">
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="20">20x</SelectItem>
                    <SelectItem value="50">50x</SelectItem>
                    <SelectItem value="100">100x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Position Size — toggle between USD value and asset units */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-white font-medium">Position Size</Label>
                <div className="flex rounded-lg overflow-hidden border border-[#2A2933] text-xs">
                  <button
                    type="button"
                    onClick={() => setSizeMode('usd')}
                    className={`px-3 py-1.5 font-bold transition-colors ${
                      sizeMode === 'usd' ? 'bg-[#06AE7A] text-black' : 'bg-[#1a1a25] text-[#6D767E] hover:text-white'
                    }`}
                  >
                    USD $
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizeMode('asset')}
                    className={`px-3 py-1.5 font-bold transition-colors ${
                      sizeMode === 'asset' ? 'bg-[#06AE7A] text-black' : 'bg-[#1a1a25] text-[#6D767E] hover:text-white'
                    }`}
                  >
                    {newTradeForm.pair.split('/')[0] || 'Asset'}
                  </button>
                </div>
              </div>
              {sizeMode === 'usd' ? (
                <>
                  <Input
                    type="number"
                    step="any"
                    value={newTradeForm.usdPositionSize}
                    onChange={(e) => handleUsdPositionSizeChange(e.target.value)}
                    className="bg-[#1a1a25] border-[#2A2933] text-white"
                    placeholder="e.g. 5000"
                  />
                  {newTradeForm.amount && (
                    <p className="text-[#6D767E] text-xs">
                      = {newTradeForm.amount} {newTradeForm.pair.split('/')[0]}
                    </p>
                  )}
                  {newTradeForm.usdPositionSize && !newTradeForm.amount && (
                    <p className="text-destructive text-xs">Price not loaded — enter an Entry Price first, then re-type the amount.</p>
                  )}
                </>
              ) : (
                <>
                  <Input
                    type="number"
                    step="any"
                    value={newTradeForm.amount}
                    onChange={(e) => {
                      const amountVal = e.target.value
                      const price = newTradeForm.entryPrice
                        ? parseFloat(newTradeForm.entryPrice)
                        : currentPairPrice || livePrices[newTradeForm.pair] || 0
                      const usdVal = price > 0 && parseFloat(amountVal) > 0
                        ? (parseFloat(amountVal) * price).toFixed(2)
                        : ''
                      setNewTradeForm(prev => ({ ...prev, amount: amountVal, usdPositionSize: usdVal }))
                    }}
                    className="bg-[#1a1a25] border-[#2A2933] text-white"
                    placeholder={`e.g. 0.5 ${newTradeForm.pair.split('/')[0] || 'units'}`}
                  />
                  {newTradeForm.usdPositionSize && (
                    <p className="text-[#6D767E] text-xs">
                      ≈ ${parseFloat(newTradeForm.usdPositionSize).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Margin Preview Panel */}
            {openTradeMarginPreview && (
              <div className={cn(
                "rounded-lg p-3 border space-y-1.5 text-xs",
                openTradeMarginPreview.canOpen === false
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-[#1a1a25] border-[#2A2933]'
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-[#6D767E] font-medium uppercase tracking-wider">Margin Summary</span>
                  {openTradeMarginPreview.canOpen === false && (
                    <span className="text-destructive font-bold text-[10px] uppercase">Insufficient Futures Balance</span>
                  )}
                  {openTradeMarginPreview.canOpen === true && (
                    <span className="text-[#06AE7A] font-bold text-[10px] uppercase">Balance OK</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6D767E]">Position Size</span>
                  <span className="text-white font-bold">${openTradeMarginPreview.positionUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6D767E]">Leverage</span>
                  <span className="text-[#F59E0B] font-bold">{newTradeForm.leverage}x</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#2A2933] pt-1.5 mt-1.5">
                  <span className="text-[#6D767E] font-semibold">Margin Required</span>
                  <span className={cn("font-bold", openTradeMarginPreview.canOpen === false ? 'text-destructive' : 'text-white')}>
                    ${openTradeMarginPreview.marginRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                {userBalanceInfo && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#6D767E]">{openTradeMarginPreview.isFutures ? 'Futures Balance' : 'Spot Balance'}</span>
                    <span className={cn("font-bold", openTradeMarginPreview.canOpen === false ? 'text-destructive' : 'text-[#06AE7A]')}>
                      ${openTradeMarginPreview.relevantBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {openTradeMarginPreview.canOpen === false && openTradeMarginPreview.isFutures && (
                  <div className="mt-2 pt-2 border-t border-destructive/30 rounded">
                    <p className="text-[#F59E0B] font-semibold text-[11px]">
                      ⚠ Futures wallet has insufficient funds.
                      {openTradeMarginPreview.canTransfer
                        ? ` Go to the user's Wallet panel and transfer $${openTradeMarginPreview.marginRequired.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} from Spot → Futures, then retry.`
                        : ' Neither wallet has enough funds to cover this trade.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-white font-medium">Entry Price</Label>
                <span className="text-[#6D767E] text-xs">Leave empty to use market price</span>
              </div>
              {/* Market price reference — tap to auto-fill */}
              {(currentPairPrice || livePrices[newTradeForm.pair]) && !newTradeForm.entryPrice && (
                <button
                  type="button"
                  onClick={() => {
                    const price = currentPairPrice || livePrices[newTradeForm.pair]
                    setNewTradeForm(prev => ({ ...prev, entryPrice: price.toString() }))
                  }}
                  className="flex items-center justify-between w-full bg-[#06AE7A]/10 hover:bg-[#06AE7A]/20 border border-[#06AE7A]/40 rounded-lg px-3 py-2 transition-colors"
                >
                  <span className="text-[#6D767E] text-xs">Current market price — tap to use</span>
                  <span className="text-[#06AE7A] font-bold text-sm">
                    {formatPrice(currentPairPrice || livePrices[newTradeForm.pair])} ↵
                  </span>
                </button>
              )}
              <Input
                type="number"
                step="any"
                value={newTradeForm.entryPrice}
                onChange={(e) => {
                  setNewTradeForm({ ...newTradeForm, entryPrice: e.target.value })
                  // Re-compute USD/asset hint when entry price is manually typed
                  if (sizeMode === 'usd' && newTradeForm.usdPositionSize) {
                    const price = parseFloat(e.target.value)
                    if (price > 0) {
                      const usdNum = parseFloat(newTradeForm.usdPositionSize)
                      if (!isNaN(usdNum)) {
                        setNewTradeForm(prev => ({ ...prev, entryPrice: e.target.value, amount: (usdNum / price).toFixed(6) }))
                      }
                    }
                  }
                }}
                className="bg-[#1a1a25] border-[#2A2933] text-white"
                placeholder="Market price if empty"
              />
              {newTradeForm.entryPrice && (
                <button
                  type="button"
                  onClick={() => setNewTradeForm(prev => ({ ...prev, entryPrice: '' }))}
                  className="text-[#6D767E] hover:text-white text-xs text-left transition-colors"
                >
                  ✕ Clear — revert to market price
                </button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsNewTradeDialogOpen(false)}
              className="bg-transparent border-[#2A2933] text-white hover:bg-[#1a1a25]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTrade}
              disabled={actionLoading}
              className="bg-[#06AE7A] text-black hover:bg-[#06AE7A]/90 font-bold"
            >
              {actionLoading ? 'Creating...' : 'Open Trade'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

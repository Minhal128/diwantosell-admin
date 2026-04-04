import { useState, useEffect } from 'react'
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
import { Search, Filter, Download, MoreHorizontal, ArrowUpCircle, ArrowDownCircle } from 'lucide-react'
import { apiCall } from '@/lib/api'

interface TradeHistory {
  id: string
  transactionId: string
  userId: string
  pair: string
  pairIcon: string
  network: 'Spot' | 'Futures'
  amount: string
  txHash: number
  status: string
  statusPositive: boolean
  date: string
}

interface DepositHistory {
  id: string
  transactionId: string
  userId: string
  pair: string
  pairIcon: string
  network: 'Spot' | 'Futures'
  amount: string
  txHash: number
  status: string
  statusPositive: boolean
  date: string
}

interface WithdrawalHistory {
  id: string
  withdrawalId: string
  userId: string
  asset: string
  assetIcon: string
  address: string
  amount: string
  status: 'pending' | 'approved'
  requestedAt: string
  processedAt: string
}

const assetIcons: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', SOL: '◎', BNB: '⬡', XRP: '✕', DOGE: 'Ð', ADA: '₳',
  USDT: '₮', AVAX: '🔺', DOT: '●', LINK: '⬡', LTC: 'Ł',
}

export function OrdersHistoryPage() {
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'trade' | 'deposit' | 'withdrawal'>('trade')
  const [tradeHistory, setTradeHistory] = useState<TradeHistory[]>([])
  const [depositHistory, setDepositHistory] = useState<DepositHistory[]>([])
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalHistory[]>([])
  const [stats, setStats] = useState({ total: 0, completed: 0, open: 0, cancelled: 0 })
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trades
        const trades = await apiCall('/admin/trades')
        const tradeArr = Array.isArray(trades) ? trades : (trades.trades || [])
        setTradeHistory(tradeArr.map((t: any) => ({
          id: t._id,
          transactionId: t._id?.substring(0, 12) || '',
          userId: t.user?.email || t.user?._id?.substring(0, 10) || 'N/A',
          pair: t.symbol || 'N/A',
          pairIcon: assetIcons[t.symbol?.split('/')[0]] || '●',
          network: t.type === 'futures' ? 'Futures' : 'Spot',
          amount: `$${Number(t.amount || 0).toFixed(2)}`,
          txHash: t._id ? parseInt(t._id.substring(0, 8), 16) : 0,
          status: t.status || 'unknown',
          statusPositive: t.status === 'open' || t.status === 'closed',
          date: new Date(t.createdAt).toLocaleDateString(),
        })))

        // Fetch transactions (deposits + withdrawals)
        const txns = await apiCall('/admin/transactions')
        const txArr = Array.isArray(txns) ? txns : (txns.transactions || [])

        const deposits = txArr.filter((tx: any) => tx.type === 'deposit')
        setDepositHistory(deposits.map((d: any) => ({
          id: d._id,
          transactionId: d._id?.substring(0, 12) || '',
          userId: d.user?.email || d.user?._id?.substring(0, 10) || 'N/A',
          pair: d.asset || 'USDT',
          pairIcon: assetIcons[d.asset] || '₮',
          network: 'Spot',
          amount: `$${Number(d.amount || 0).toFixed(2)}`,
          txHash: d.txHash ? parseInt(d.txHash.substring(0, 8), 16) || 0 : 0,
          status: d.status || 'pending',
          statusPositive: d.status === 'completed',
          date: new Date(d.createdAt).toLocaleDateString(),
        })))

        const withdrawals = txArr.filter((tx: any) => tx.type === 'withdrawal')
        setWithdrawalHistory(withdrawals.map((w: any) => ({
          id: w._id,
          withdrawalId: w._id?.substring(0, 12) || '',
          userId: w.user?.email || w.user?._id?.substring(0, 10) || 'N/A',
          asset: w.asset || 'USDT',
          assetIcon: assetIcons[w.asset] || '₮',
          address: w.walletAddress || 'N/A',
          amount: `$${Number(w.amount || 0).toFixed(2)}`,
          status: w.status === 'completed' ? 'approved' : 'pending',
          requestedAt: new Date(w.createdAt).toLocaleDateString(),
          processedAt: w.updatedAt ? new Date(w.updatedAt).toLocaleDateString() : '-',
        })))

        // Compute stats
        const openCount = tradeArr.filter((t: any) => t.status === 'open').length
        const closedCount = tradeArr.filter((t: any) => t.status === 'closed').length
        const cancelledCount = tradeArr.filter((t: any) => t.status === 'cancelled').length
        setStats({
          total: tradeArr.length + deposits.length + withdrawals.length,
          completed: closedCount + deposits.filter((d: any) => d.status === 'completed').length,
          open: openCount + withdrawals.filter((w: any) => w.status === 'pending').length,
          cancelled: cancelledCount,
        })
      } catch (error) {
        console.error('Error fetching orders history:', error)
      }
    }
    fetchData()
  }, [])

  const filteredTradeHistory = tradeHistory.filter(t => {
    if (!searchQuery.trim()) return true
    const s = searchQuery.toLowerCase()
    return t.userId?.toLowerCase().includes(s) || t.pair?.toLowerCase().includes(s) || t.status?.toLowerCase().includes(s) || t.transactionId?.toLowerCase().includes(s)
  })
  const filteredDepositHistory = depositHistory.filter(d => {
    if (!searchQuery.trim()) return true
    const s = searchQuery.toLowerCase()
    return d.userId?.toLowerCase().includes(s) || d.pair?.toLowerCase().includes(s) || d.status?.toLowerCase().includes(s) || d.transactionId?.toLowerCase().includes(s)
  })
  const filteredWithdrawalHistory = withdrawalHistory.filter(w => {
    if (!searchQuery.trim()) return true
    const s = searchQuery.toLowerCase()
    return w.userId?.toLowerCase().includes(s) || w.asset?.toLowerCase().includes(s) || w.status?.toLowerCase().includes(s) || w.withdrawalId?.toLowerCase().includes(s)
  })

  return (
    <DashboardLayout title="Orders & History">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Orders"
          value={String(stats.total)}
          change={stats.total > 0 ? `${tradeHistory.length} trades, ${depositHistory.length} deposits` : 'No orders yet'}
          subtitle="All order history"
        />
        <StatsCard
          title="Completed Orders"
          value={String(stats.completed)}
          change={stats.completed > 0 ? 'Successfully executed' : 'No completed orders'}
          subtitle="Successfully executed"
        />
        <StatsCard
          title="Open Orders"
          value={String(stats.open)}
          change={stats.open > 0 ? 'Currently active' : 'No open orders'}
          subtitle="Currently active orders"
        />
        <StatsCard
          title="Cancelled Orders"
          value={String(stats.cancelled)}
          change={stats.cancelled > 0 ? 'User cancelled' : 'No cancelled orders'}
          subtitle="User cancelled orders"
        />
      </div>

      {/* Orders Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Trades History & Orders</h2>
            <span className="text-[#6D767E] text-sm font-medium">({stats.total})</span>
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

        {/* Tabs */}
        <div className="flex gap-6 px-6 border-b border-[#1a1a25]">
          <button
            onClick={() => setActiveTab('trade')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'trade'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Trade History
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'deposit'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Deposit history
          </button>
          <button
            onClick={() => setActiveTab('withdrawal')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'withdrawal'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Withdrawal history
          </button>
        </div>

        {/* Trade History Table */}
        {activeTab === 'trade' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === tradeHistory.length}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? filteredTradeHistory.map(t => t.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Transaction ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Assets</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Network</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Amount</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Tx Hash</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Date</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tradeHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[#6D767E] text-lg font-medium">No trade history yet</div>
                        <div className="text-[#6D767E] text-sm">Trade history will appear here once users start trading</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTradeHistory.map((trade) => (
                  <TableRow key={trade.id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                    <TableCell className="w-12">
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(trade.id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, trade.id]
                              : selectedItems.filter((id) => id !== trade.id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{trade.transactionId}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{trade.userId}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="text-base">{trade.pairIcon}</span>
                        <span className="font-bold text-white text-sm">{trade.pair}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-sm">{trade.network}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{trade.amount}</TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-sm">{trade.txHash}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {trade.statusPositive ? (
                          <ArrowUpCircle className="h-4 w-4 text-[#06AE7A]" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={cn(
                          "font-bold text-sm",
                          trade.statusPositive ? "text-[#06AE7A]" : "text-destructive"
                        )}>{trade.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-xs">{trade.date}</TableCell>
                    <TableCell className="text-right pr-4">
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

        {/* Deposit History Table */}
        {activeTab === 'deposit' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === depositHistory.length}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? filteredDepositHistory.map(d => d.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Transaction ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Assets</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Network</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Amount</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Tx Hash</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Date</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {depositHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[#6D767E] text-lg font-medium">No deposit history yet</div>
                        <div className="text-[#6D767E] text-sm">Deposit history will appear here once users make deposits</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDepositHistory.map((deposit) => (
                  <TableRow key={deposit.id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                    <TableCell className="w-12">
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(deposit.id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, deposit.id]
                              : selectedItems.filter((id) => id !== deposit.id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{deposit.transactionId}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{deposit.userId}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="text-base">{deposit.pairIcon}</span>
                        <span className="font-bold text-white text-sm">{deposit.pair}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-sm">{deposit.network}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{deposit.amount}</TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-sm">{deposit.txHash}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {deposit.statusPositive ? (
                          <ArrowUpCircle className="h-4 w-4 text-[#06AE7A]" />
                        ) : (
                          <ArrowDownCircle className="h-4 w-4 text-destructive" />
                        )}
                        <span className={cn(
                          "font-bold text-sm",
                          deposit.statusPositive ? "text-[#06AE7A]" : "text-destructive"
                        )}>{deposit.status}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-xs">{deposit.date}</TableCell>
                    <TableCell className="text-right pr-4">
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

        {/* Withdrawal History Table */}
        {activeTab === 'withdrawal' && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === withdrawalHistory.length}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? filteredWithdrawalHistory.map(w => w.id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Withdrawal ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">User ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Assets</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Address</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Amount</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Requested at</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Processed at</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawalHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-[#6D767E] text-lg font-medium">No withdrawal history yet</div>
                        <div className="text-[#6D767E] text-sm">Withdrawal history will appear here once users make withdrawals</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredWithdrawalHistory.map((withdrawal) => (
                  <TableRow key={withdrawal.id} className="border-[#1a1a25] hover:bg-[#131219] transition-colors">
                    <TableCell className="w-12">
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(withdrawal.id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, withdrawal.id]
                              : selectedItems.filter((id) => id !== withdrawal.id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{withdrawal.withdrawalId}</TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{withdrawal.userId}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="text-base">{withdrawal.assetIcon}</span>
                        <span className="font-bold text-white text-sm">{withdrawal.asset}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{withdrawal.address}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{withdrawal.amount}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                          withdrawal.status === 'approved'
                            ? 'bg-[#06AE7A] text-black hover:bg-[#06AE7A]/90'
                            : 'bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90'
                        )}
                      >
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-xs">{withdrawal.requestedAt}</TableCell>
                    <TableCell className="font-medium text-[#6D767E] text-xs">{withdrawal.processedAt}</TableCell>
                    <TableCell className="text-right pr-4">
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
      </div>
    </DashboardLayout>
  )
}

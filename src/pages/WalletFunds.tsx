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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Search, Filter, Download, MoreHorizontal, Copy } from 'lucide-react'

interface Transaction {
  _id: string
  user: {
    _id: string
    name: string
    email: string
  }
  asset: string
  amount: number
  walletAddress?: string
  network?: string
  createdAt: string
  status: 'pending' | 'completed' | 'rejected' | 'failed'
  type: string
}

export function WalletFundsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdrawals' | 'other'>('overview')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [approveLoading, setApproveLoading] = useState(false)
  const [rejectLoading, setRejectLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const data = await apiCall('/admin/transactions')
      
      // Handle both direct array response and error response object
      if (Array.isArray(data)) {
        setTransactions(data)
      } else if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions(data.transactions)
      } else {
        console.warn('Unexpected response format:', data)
        setTransactions([])
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleRowClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }

  // Calculate real stats from transaction data
  const totalDeposits = transactions
    .filter(tx => (tx.type === 'deposit' || tx.type === 'adjustment') && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0)
  
  const totalWithdrawals = transactions
    .filter(tx => tx.type === 'withdrawal' && tx.status === 'completed')
    .reduce((sum, tx) => sum + tx.amount, 0)
  
  const pendingDeposits = transactions.filter(tx => (tx.type === 'deposit' || tx.type === 'adjustment') && tx.status === 'pending').length
  const pendingWithdrawals = transactions.filter(tx => tx.type === 'withdrawal' && tx.status === 'pending').length
  
  // Hot wallet = total deposits - total withdrawals (simplified calculation)
  const hotWalletBalance = totalDeposits - totalWithdrawals
  
  // Cold wallet = 0 for now (would be calculated from cold storage data)
  const coldWalletBalance = 0

  // Filter transactions by tab and search
  const filteredTransactions = transactions.filter(tx => {
    if (activeTab !== 'overview') {
      if (activeTab === 'deposit' && tx.type !== 'deposit' && tx.type !== 'adjustment') return false
      if (activeTab === 'withdrawals' && tx.type !== 'withdrawal') return false
      if (activeTab === 'other' && tx.type !== 'transfer' && tx.type !== 'reward' && tx.type !== 'trade_liquidation') return false
    }
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase()
      return tx.user?.name?.toLowerCase().includes(s) ||
             tx.user?.email?.toLowerCase().includes(s) ||
             tx.asset?.toLowerCase().includes(s) ||
             tx._id.toLowerCase().includes(s)
    }
    return true
  })

  const handleWithdrawalAction = async (txId: string, status: 'completed' | 'rejected') => {
    if (status === 'completed') setApproveLoading(true); else setRejectLoading(true)
    try {
      await apiCall(`/admin/transactions/${txId}/withdrawal`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      setSelectedTransaction(null)
      fetchTransactions()
    } catch (error) {
      console.error(`Failed to ${status} withdrawal:`, error)
    } finally {
      setApproveLoading(false); setRejectLoading(false)
    }
  }

  const handleDepositAction = async (txId: string, status: 'completed' | 'rejected') => {
    if (status === 'completed') setApproveLoading(true); else setRejectLoading(true)
    try {
      await apiCall(`/admin/transactions/${txId}/deposit`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      setSelectedTransaction(null)
      fetchTransactions()
    } catch (error) {
      console.error(`Failed to ${status} deposit:`, error)
    } finally {
      setApproveLoading(false); setRejectLoading(false)
    }
  }

  return (
    <DashboardLayout title="Wallet & Funds">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Deposits"
          value={`$${totalDeposits.toLocaleString()}`}
          change={`${pendingDeposits} pending`}
          subtitle="Completed deposits"
        />
        <StatsCard
          title="Total Withdrawals"
          value={`$${totalWithdrawals.toLocaleString()}`}
          change={`${pendingWithdrawals} pending`}
          subtitle="Completed withdrawals"
        />
        <StatsCard
          title="Hot Wallet"
          value={`$${hotWalletBalance.toLocaleString()}`}
          change={`${transactions.filter(tx => tx.status === 'completed').length} transactions`}
          subtitle="Available balance"
        />
        <StatsCard
          title="Cold Wallets"
          value={`$${coldWalletBalance.toLocaleString()}`}
          change="Secure storage"
          subtitle="Offline storage balance"
        />
      </div>

      {/* Transactions Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Active Wallet</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredTransactions.length.toLocaleString()})</span>
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
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'overview'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('deposit')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'deposit'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'withdrawals'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Withdrawals
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`py-3 text-sm font-bold tracking-tight border-b-2 transition-colors ${activeTab === 'other'
              ? 'border-[#06AE7A] text-white'
              : 'border-transparent text-[#6D767E] hover:text-white'
              }`}
          >
            Other
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-b-xl">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-white mb-2">No {activeTab === 'other' ? 'transfer' : activeTab} transactions found</p>
              <p className="text-muted-foreground text-sm">Records will appear here once activity occurs</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-[#212027]">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="w-12 h-12 py-0">
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={(checked) => {
                        setSelectedItems(checked ? filteredTransactions.map(t => t._id) : [])
                      }}
                    />
                  </TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Transaction ID</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Name</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Email</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Assets</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Amount</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Wallet Address</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Network</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Time</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                  <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow
                    key={transaction._id}
                    className="border-[#1a1a25] hover:bg-[#131219] transition-colors cursor-pointer"
                    onClick={() => handleRowClick(transaction)}
                  >
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                        checked={selectedItems.includes(transaction._id)}
                        onCheckedChange={(checked) => {
                          setSelectedItems(
                            checked
                              ? [...selectedItems, transaction._id]
                              : selectedItems.filter((id) => id !== transaction._id)
                          )
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-bold text-[#6D767E] text-sm">{transaction._id.slice(-8).toUpperCase()}</TableCell>
                    <TableCell className="font-bold text-white text-sm">{transaction.user?.name || 'Unknown'}</TableCell>
                    <TableCell className="text-[#6D767E] font-medium text-sm">{transaction.user?.email || 'N/A'}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="text-base">💰</span>
                        <span className="text-[#6D767E] font-medium text-sm">{transaction.asset}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-bold text-white text-sm">${transaction.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-[#6D767E] font-medium text-sm text-xs">{transaction.walletAddress || 'Internal'}</TableCell>
                    <TableCell className="text-[#6D767E] font-medium text-sm">{transaction.network || 'Main'}</TableCell>
                    <TableCell className="text-[#6D767E] font-medium text-sm">{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                          transaction.status === 'completed'
                            ? 'bg-[#06AE7A] text-black hover:bg-[#06AE7A]/90'
                            : transaction.status === 'pending'
                              ? 'bg-[#F59E0B] text-black hover:bg-[#F59E0B]/90'
                              : 'bg-destructive text-white'
                        )}
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#1a1a25] hover:bg-[#2A2933] rounded-lg border border-[#2A2933]">
                        <MoreHorizontal className="h-4 w-4 text-[#6D767E]" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Transaction Details Modal - Premium Design */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => { setSelectedTransaction(null); setApproveLoading(false); setRejectLoading(false); }}>
        <DialogContent className="bg-[#0a0a0f] border-[#2a2a35] w-[95vw] sm:max-w-sm p-0 overflow-hidden rounded-xl shadow-2xl shadow-black/50 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-4 border-b border-[#1a1a25]">
            <DialogTitle className="text-lg font-semibold">
              Transaction Details
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-5">
            {/* Transaction Summary - Real Data */}
            <div className="rounded-xl border border-[#2a2a35] bg-[#1a1a25] p-5 space-y-4">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Transaction summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge className={cn(
                    "rounded-md px-2 py-0.5 font-bold text-[10px] uppercase",
                    selectedTransaction?.type === 'deposit' || selectedTransaction?.type === 'adjustment'
                      ? 'bg-[#06AE7A] text-black'
                      : selectedTransaction?.type === 'withdrawal'
                        ? 'bg-red-500 text-white'
                        : 'bg-[#F59E0B] text-black'
                  )}>
                    {selectedTransaction?.type === 'adjustment' ? 'Admin Deposit' : selectedTransaction?.type}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="text-sm font-semibold text-white">${selectedTransaction?.amount.toLocaleString()} {selectedTransaction?.asset}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Date & Time</span>
                  <span className="text-sm text-white">{selectedTransaction ? new Date(selectedTransaction.createdAt).toLocaleString() : ''}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Transaction ID</span>
                  <span className="text-sm text-white">#{selectedTransaction?._id.slice(-8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">User</span>
                  <span className="text-sm text-white">{selectedTransaction?.user?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm text-white">{selectedTransaction?.user?.email || 'N/A'}</span>
                </div>
                {selectedTransaction?.walletAddress && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-muted-foreground">Wallet Address</span>
                    <span className="flex items-center gap-2 text-sm text-white">
                      {selectedTransaction.walletAddress.slice(0, 6)}...{selectedTransaction.walletAddress.slice(-6)}
                      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-white cursor-pointer transition-colors" onClick={() => navigator.clipboard.writeText(selectedTransaction.walletAddress || '')} />
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Network</span>
                  <span className="text-sm text-white">{selectedTransaction?.network || 'Main'}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge className={cn(
                    "rounded-md px-3 py-1 font-bold text-[10px] uppercase tracking-wider",
                    selectedTransaction?.status === 'completed'
                      ? 'bg-[#06AE7A] text-black'
                      : selectedTransaction?.status === 'pending'
                        ? 'bg-[#F59E0B] text-black'
                        : 'bg-destructive text-white'
                  )}>
                    {selectedTransaction?.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons - pending withdrawals */}
            {selectedTransaction?.type === 'withdrawal' && selectedTransaction?.status === 'pending' && (
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  className="h-12 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold text-base"
                  disabled={approveLoading || rejectLoading}
                  onClick={() => handleWithdrawalAction(selectedTransaction._id, 'completed')}
                >
                  {approveLoading ? 'Processing...' : 'Approve'}
                </Button>
                <Button 
                  variant="secondary" 
                  className="h-12 bg-[#2a2a35] hover:bg-[#3a3a45] text-white font-semibold text-base"
                  disabled={approveLoading || rejectLoading}
                  onClick={() => handleWithdrawalAction(selectedTransaction._id, 'rejected')}
                >
                  {rejectLoading ? 'Processing...' : 'Reject'}
                </Button>
              </div>
            )}

            {/* Action Buttons - pending deposits (manual approval when NowPayments webhook missed) */}
            {selectedTransaction?.type === 'deposit' && selectedTransaction?.status === 'pending' && (
              <div className="space-y-3">
                <p className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg px-3 py-2">
                  ⚠️ Deposit is pending. Approve only after confirming the payment was received in the wallet.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    className="h-12 bg-[#1ABFA1] hover:bg-[#18a88e] text-black font-semibold text-base"
                    disabled={approveLoading || rejectLoading}
                    onClick={() => handleDepositAction(selectedTransaction._id, 'completed')}
                  >
                    {approveLoading ? 'Processing...' : 'Approve & Credit'}
                  </Button>
                  <Button 
                    variant="secondary" 
                    className="h-12 bg-[#2a2a35] hover:bg-[#3a3a45] text-white font-semibold text-base"
                    disabled={approveLoading || rejectLoading}
                    onClick={() => handleDepositAction(selectedTransaction._id, 'rejected')}
                  >
                    {rejectLoading ? 'Processing...' : 'Reject'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

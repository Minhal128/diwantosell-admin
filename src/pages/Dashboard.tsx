import { useState, useEffect } from 'react'
import { apiCall } from '@/lib/api'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { TransactionChart } from '@/components/dashboard/TransactionChart'
import { OperationalQueues } from '@/components/dashboard/OperationalQueues'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'

interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalDeposits: number
  totalWithdrawals: number
  pendingKyc: number
  verifiedKyc: number
  rejectedKyc: number
  pendingTransactions: number
  transactionVolume: number
  recentTransactions: any[]
  dailyTransactions: any[]
  operationalQueues: any[]
  error?: string
}

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Helper function to format large numbers
  const formatLargeNumber = (num: number): string => {
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`
    } else {
      return `$${num.toLocaleString()}`
    }
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setError(null)
        console.log('Fetching dashboard stats...')
        const data = await apiCall('/admin/dashboard')
        console.log('Dashboard stats received:', data)
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
      } finally {
        setIsLoading(false)
      }
    }
    
    // Only fetch if we have a token
    const token = localStorage.getItem('adminToken')
    if (token) {
      fetchStats()
    } else {
      setIsLoading(false)
      setError('No authentication token found')
    }
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Dashboard">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers?.toLocaleString() || "0"}
          change={`${stats?.activeUsers || 0} active users`}
          subtitle="Total registered accounts"
        />
        <StatsCard
          title="Total Deposits"
          value={formatLargeNumber(stats?.totalDeposits || 0)}
          change="Completed deposits"
          subtitle="Cumulative platform deposits"
        />
        <StatsCard
          title="Total Withdrawals"
          value={formatLargeNumber(stats?.totalWithdrawals || 0)}
          change="Completed withdrawals"
          subtitle="Cumulative platform withdrawals"
        />
        <StatsCard
          title="Pending KYC"
          value={stats?.pendingKyc?.toString() || "0"}
          change={`${stats?.verifiedKyc || 0} verified, ${stats?.rejectedKyc || 0} rejected`}
          subtitle="Submissions needing review"
        />
      </div>

      {/* Transaction Volume Card */}
      <div className="mb-6 p-6 rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground">Transaction Volume (30 days)</h3>
            <p className="text-2xl lg:text-3xl font-bold mt-1">
              {formatLargeNumber(stats?.transactionVolume || 0)}
            </p>
            <span className="text-sm text-muted-foreground">
              {stats?.pendingTransactions || 0} pending transactions
            </span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mb-6">
        <TransactionChart data={stats?.dailyTransactions} />
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OperationalQueues queues={stats?.operationalQueues} />
        <RecentTransactions transactions={stats?.recentTransactions} />
      </div>
    </DashboardLayout>
  )
}
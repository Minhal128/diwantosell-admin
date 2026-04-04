import { CheckCircle, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Transaction {
  _id: string
  type: 'deposit' | 'withdrawal' | 'adjustment' | 'reward'
  amount: number
  asset: string
  status: 'pending' | 'completed' | 'rejected' | 'failed'
  createdAt: string
  user?: {
    name: string
    email: string
  } | null
}

interface RecentTransactionsProps {
  transactions?: Transaction[]
}

export function RecentTransactions({ transactions = [] }: RecentTransactionsProps) {
  // Separate deposits and withdrawals (include admin adjustments as deposits)
  const deposits = transactions.filter(tx => tx.type === 'deposit' || tx.type === 'adjustment')
  const withdrawals = transactions.filter(tx => tx.type === 'withdrawal')

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
  }

  const getStatusIcon = (type: string, status: string) => {
    if (status === 'completed') {
      return type === 'deposit' || type === 'adjustment' ? (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#06AE7A] shadow-lg shadow-[#06AE7A]/20">
          <ArrowDownLeft className="h-3.5 w-3.5 text-black stroke-[3px]" />
        </div>
      ) : (
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#06AE7A] shadow-lg shadow-[#06AE7A]/20">
          <ArrowUpRight className="h-3.5 w-3.5 text-black stroke-[3px]" />
        </div>
      )
    }
    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-500 shadow-lg shadow-yellow-500/20">
        <CheckCircle className="h-3.5 w-3.5 text-black stroke-[3px]" />
      </div>
    )
  }

  const TransactionList = ({ txList, emptyMessage }: { txList: Transaction[], emptyMessage: string }) => (
    <>
      {txList.length > 0 ? (
        <div className="space-y-3">
          {txList.slice(0, 5).map((tx) => {
            const { date, time } = formatDate(tx.createdAt)
            const userName = tx.user?.name || 'Unknown User'
            return (
              <div
                key={tx._id}
                className="group flex items-center justify-between p-4 rounded-xl bg-[#0e0d15] border border-[#1a1a25] hover:bg-[#131219] transition-all cursor-default"
              >
                <div className="flex items-center gap-4">
                  {getStatusIcon(tx.type, tx.status)}
                  <div>
                    <p className="text-sm font-bold text-white tracking-tight">
                      {tx.type === 'deposit' || tx.type === 'adjustment' ? 'Received' : 'Sent'}
                    </p>
                    <p className="text-[10px] uppercase font-bold text-[#6D767E] tracking-wider mt-0.5">
                      {userName} • {tx.status}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">
                    {tx.amount.toLocaleString()} {tx.asset}
                  </p>
                  <p className="text-[10px] font-bold text-[#6D767E] mt-0.5">
                    {date}, {time}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8 text-sm">
          {emptyMessage}
        </div>
      )}
    </>
  )

  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Recent Transactions</h3>
      <Tabs defaultValue="deposits" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-[#0e0d15] p-1 rounded-xl h-11 border border-[#1a1a25]">
          <TabsTrigger
            value="deposits"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-muted-foreground font-medium transition-all"
          >
            Deposits ({deposits.length})
          </TabsTrigger>
          <TabsTrigger
            value="withdrawals"
            className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-black text-muted-foreground font-medium transition-all"
          >
            Withdrawals ({withdrawals.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="deposits" className="mt-6 outline-none">
          <TransactionList 
            txList={deposits} 
            emptyMessage="No recent deposits" 
          />
        </TabsContent>
        <TabsContent value="withdrawals" className="mt-6 outline-none">
          <TransactionList 
            txList={withdrawals} 
            emptyMessage="No recent withdrawals" 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

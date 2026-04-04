import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Market {
  id: string
  asset: string
  assetIcon: string
  pair: string
  price: string
  change24h: string
  changePositive: boolean
  feedSource: string
  feedSourceIcon: string
  lastUpdate: string
  enabled: boolean
  category: 'crypto' | 'commodity' | 'stock'
}

const assetIcons: Record<string, string> = {
  BTC: '₿', ETH: 'Ξ', SOL: '◎', BNB: '⬡', XRP: '✕', DOGE: 'Ð', ADA: '₳',
  AVAX: '🔺', DOT: '●', LINK: '⬡', LTC: 'Ł', NEAR: 'Ⓝ', APT: '🅰', ATOM: '⚛',
  UNI: '🦄', OP: '🔴', ARB: '🔵', MATIC: '⬟',  // Commodities
  XAU: '🪩', GOLD: '🪩', XAG: '🪷', SILVER: '🪷', WTI: '🛢️', OIL: '🛢️',
  // Stocks
  AAPL: '🍎', TSLA: '⚡', NVDA: '💻', AMZN: '📦', MSFT: '🪟', GOOGL: '🔍',}

export function MarketPricePage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [lastFetch, setLastFetch] = useState<string>('Never')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null)
  const [marketEnabled, setMarketEnabled] = useState<Record<string, boolean>>({})
  const [categoryFilter, setCategoryFilter] = useState<'all'|'crypto'|'commodity'|'stock'>('all')
  const [primaryFeed, setPrimaryFeed] = useState('Binance')
  const [backupFeed, setBackupFeed] = useState('Binance')
  const [refreshInterval, setRefreshInterval] = useState('10 Secs')
  const [deviationThreshold, setDeviationThreshold] = useState('2%')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(`${API_URL}/trades/market-data`)
        if (!response.ok) throw new Error('Failed to fetch')
        const data = await response.json()

        const formatted: Market[] = Object.entries(data).map(([symbol, info]: [string, any]) => {
          const coin = symbol.split('/')[0]
          return {
            id: symbol,
            asset: coin,
            assetIcon: assetIcons[coin] || coin[0],
            pair: symbol.split('/')[1] || 'USDT',
            price: info.price ? `$${Number(info.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00',
            change24h: info.change24h ? `${info.change24h >= 0 ? '+' : ''}${Number(info.change24h).toFixed(2)}%` : '0.00%',
            changePositive: (info.change24h || 0) >= 0,
            feedSource: 'CoinGecko',
            feedSourceIcon: '🦎',
            lastUpdate: new Date().toLocaleTimeString(),
            enabled: true,
            category: 'crypto' as const,
          }
        })

        setMarkets(formatted)
        setMarketEnabled(Object.fromEntries(formatted.map(m => [m.id, m.enabled])))
        setLastFetch(new Date().toLocaleTimeString())
      } catch (err) {
        console.error('Failed to fetch market data:', err)
      }
    }

    fetchMarketData()
    const interval = setInterval(fetchMarketData, 15000)
    return () => clearInterval(interval)
  }, [])

  // Commodities via backend (Yahoo Finance GC=F, SI=F, CL=F)
  useEffect(() => {
    const fetchCommodities = async () => {
      try {
        const r = await fetch(`${API_URL}/trades/prices?symbols=${encodeURIComponent('XAU/USDT,XAG/USDT,WTI/USDT,XPT/USDT,NG/USDT')}`)
        if (!r.ok) return
        const data = await r.json() as Record<string, { price?: number }>
        const now = new Date().toLocaleTimeString()
        const entries: [string, string, string][] = [
          ['XAU/USDT', 'XAU', '🪙'],
          ['XAG/USDT', 'XAG', '🥈'],
          ['WTI/USDT', 'WTI', '🛢️'],
          ['XPT/USDT', 'XPT', '💎'],
          ['NG/USDT',  'NG',  '🔥'],
        ]
        const commodities: Market[] = entries.map(([sym, asset, icon]) => ({
          id: sym, asset, assetIcon: icon, pair: 'USDT',
          price: data[sym]?.price ? `$${Number(data[sym]!.price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : 'N/A',
          change24h: '0.00%', changePositive: true,
          feedSource: 'Yahoo Finance', feedSourceIcon: '📈',
          lastUpdate: now, enabled: true, category: 'commodity' as const,
        }))
        setMarkets(prev => {
          const ids = new Set(commodities.map(c => c.id))
          return [...prev.filter(m => !ids.has(m.id)), ...commodities]
        })
      } catch (e) { console.error('Commodity fetch failed', e) }
    }
    fetchCommodities()
    const t = setInterval(fetchCommodities, 30000)
    return () => clearInterval(t)
  }, [])

  // Stocks from backend (Yahoo Finance)
  useEffect(() => {
    const stockSymbols = ['AAPL/USD','TSLA/USD','NVDA/USD','AMZN/USD','MSFT/USD','GOOGL/USD','META/USD','NFLX/USD','AMD/USD','INTC/USD','JPM/USD','BAC/USD','DIS/USD','UBER/USD','COIN/USD']
    const stockIcons: Record<string,string> = { AAPL:'🍎', TSLA:'⚡', NVDA:'💻', AMZN:'📦', MSFT:'🪟', GOOGL:'🔍', META:'👤', NFLX:'🎬', AMD:'🔴', INTC:'🔵', JPM:'🏦', BAC:'🏛️', DIS:'🎠', UBER:'🚗', COIN:'🪙' }
    const fetchStocks = async () => {
      try {
        const r = await fetch(`${API_URL}/trades/prices?symbols=${stockSymbols.join(',')}`)
        if (!r.ok) return
        const data = await r.json()
        const now = new Date().toLocaleTimeString()
        const stocks: Market[] = stockSymbols.map(sym => {
          const ticker = sym.split('/')[0]
          const info = data[sym] || data[ticker] || {}
          return {
            id: sym, asset: ticker, assetIcon: stockIcons[ticker] || ticker[0], pair: 'USD',
            price: info.price ? `$${Number(info.price).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}` : 'N/A',
            change24h: info.change24h != null ? `${info.change24h >= 0 ? '+' : ''}${Number(info.change24h).toFixed(2)}%` : '0.00%',
            changePositive: (info.change24h || 0) >= 0,
            feedSource: 'Yahoo Finance', feedSourceIcon: '📈', lastUpdate: now, enabled: true, category: 'stock' as const,
          }
        })
        setMarkets(prev => {
          const ids = new Set(stocks.map(s => s.id))
          return [...prev.filter(m => !ids.has(m.id)), ...stocks]
        })
      } catch (e) { console.error('Stocks fetch failed', e) }
    }
    fetchStocks()
    const t = setInterval(fetchStocks, 30000)
    return () => clearInterval(t)
  }, [])

  const filteredMarkets = markets.filter(m => {
    if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
    if (searchQuery.trim()) {
      const s = searchQuery.toLowerCase()
      return m.asset?.toLowerCase().includes(s) || m.pair?.toLowerCase().includes(s) || m.id?.toLowerCase().includes(s)
    }
    return true
  })

  const handleRowClick = (market: Market) => {
    setSelectedMarket(market)
  }



  return (
    <DashboardLayout title="Market Price & Feeds">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Active Markets"
          value={String(markets.length)}
          change={markets.length > 0 ? `${markets.filter(m => marketEnabled[m.id]).length} enabled` : 'No markets configured'}
          subtitle="Trading pairs available"
        />
        <StatsCard
          title="Price Feeds"
          value={markets.length > 0 ? markets[0].price : '$0.00'}
          change={markets.length > 0 ? `BTC ${markets[0].change24h}` : 'No price data'}
          subtitle="Latest BTC price"
        />
        <StatsCard
          title="Last Update"
          value={lastFetch}
          change="Auto-refresh 15s"
          subtitle="Price feed timestamp"
        />
        <StatsCard
          title="Feed Status"
          value={markets.length > 0 ? 'Active' : 'Inactive'}
          change={markets.length > 0 ? 'CoinGecko Pro' : 'Not configured'}
          subtitle="Price feed health"
        />
      </div>

      {/* Markets Table Card */}
      <div className="rounded-xl border border-[#1a1a25] bg-[#0E0D15]">
        {/* Table Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 lg:p-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Supported Markets</h2>
            <span className="text-[#6D767E] text-sm font-medium">({filteredMarkets.length})</span>
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

        {/* Category Filter Tabs */}
        <div className="flex gap-1 px-6 pb-3 border-b border-[#1a1a25]">
          {(['all','crypto','commodity','stock'] as const).map(cat => (
            <button key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${
                categoryFilter === cat
                  ? 'bg-[#06AE7A] text-black'
                  : 'bg-[#1a1a25] text-[#6D767E] hover:text-white'
              }`}>
              {cat === 'all' ? 'All' : cat === 'crypto' ? 'Crypto' : cat === 'commodity' ? 'Commodities' : 'Stocks'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-b-xl">
          <Table>
            <TableHeader className="bg-[#212027]">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-12 h-12 py-0">
                  <Checkbox
                    className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                    checked={selectedItems.length === filteredMarkets.length && filteredMarkets.length > 0}
                    onCheckedChange={(checked) => {
                      setSelectedItems(checked ? filteredMarkets.map(m => m.id) : [])
                    }}
                  />
                </TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Assets</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Category</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Pair</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Price</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">24h Change</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Feed Source</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Last update</TableHead>
                <TableHead className="text-white font-bold h-12 py-0">Status</TableHead>
                <TableHead className="text-white font-bold h-12 py-0 text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMarkets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-[#6D767E] text-lg font-medium">No markets configured yet</div>
                      <div className="text-[#6D767E] text-sm">Market price feeds will appear here once configured</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMarkets.map((market) => (
                <TableRow
                  key={market.id}
                  className="border-[#1a1a25] hover:bg-[#131219] transition-colors cursor-pointer"
                  onClick={() => handleRowClick(market)}
                >
                  <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      className="border-[#2A2933] data-[state=checked]:bg-[#06AE7A] data-[state=checked]:border-[#06AE7A]"
                      checked={selectedItems.includes(market.id)}
                      onCheckedChange={(checked) => {
                        setSelectedItems(
                          checked
                            ? [...selectedItems, market.id]
                            : selectedItems.filter((id) => id !== market.id)
                        )
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className="text-base">{market.assetIcon}</span>
                      <span className="font-bold text-white text-sm">{market.asset}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      'text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider',
                      market.category === 'crypto' ? 'bg-[#1a1a35] text-[#6D9FFF]' :
                      market.category === 'commodity' ? 'bg-[#2a1a05] text-[#F59E0B]' :
                      'bg-[#051a10] text-[#06AE7A]'
                    )}>
                      {market.category === 'crypto' ? 'Crypto' : market.category === 'commodity' ? 'Commodity' : 'Stock'}
                    </span>
                  </TableCell>
                  <TableCell className="font-bold text-[#6D767E] text-sm">{market.pair}</TableCell>
                  <TableCell className="font-bold text-[#06AE7A] text-sm">{market.price}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        market.changePositive ? "bg-[#06AE7A] shadow-[0_0_8px_rgba(6,174,122,0.4)]" : "bg-destructive"
                      )} />
                      <span className={cn(
                        "font-bold text-sm",
                        market.changePositive ? "text-[#06AE7A]" : "text-destructive"
                      )}>{market.change24h}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span className="text-base">{market.feedSourceIcon}</span>
                      <span className="text-[#6D767E] font-medium text-sm">{market.feedSource}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-[#6D767E] font-medium text-sm">{market.lastUpdate}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="scale-75 origin-left">
                      <Switch
                        checked={marketEnabled[market.id]}
                        onCheckedChange={() => {
                          setMarketEnabled(prev => ({ ...prev, [market.id]: !prev[market.id] }))
                        }}
                        className="data-[state=checked]:bg-[#06AE7A]"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
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
      </div>

      {/* Market Details Modal */}
      <Dialog open={!!selectedMarket} onOpenChange={() => setSelectedMarket(null)}>
        <DialogContent className="bg-[#0a0a0f] border-[#2a2a35] w-[95vw] sm:max-w-sm p-6 max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl shadow-black/50">
          <DialogHeader>
            <DialogTitle className="text-base">
              Market Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Asset Info */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
                ₿
              </div>
              <div>
                <p className="font-semibold">BTC</p>
                <p className="text-sm text-primary">$86,3547</p>
              </div>
            </div>

            {/* Price Feeds Settings */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Price Feeds Settings</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Primary Feed</label>
                  <Select value={primaryFeed} onValueChange={setPrimaryFeed}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Binance">
                        <span className="flex items-center gap-2">
                          <span>🔶</span> Binance
                        </span>
                      </SelectItem>
                      <SelectItem value="Bybit">
                        <span className="flex items-center gap-2">
                          <span>🟡</span> Bybit
                        </span>
                      </SelectItem>
                      <SelectItem value="Coinbase">
                        <span className="flex items-center gap-2">
                          <span>🔵</span> Coinbase
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Backup Feed</label>
                  <Select value={backupFeed} onValueChange={setBackupFeed}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Binance">
                        <span className="flex items-center gap-2">
                          <span>🔶</span> Binance
                        </span>
                      </SelectItem>
                      <SelectItem value="Bybit">
                        <span className="flex items-center gap-2">
                          <span>🟡</span> Bybit
                        </span>
                      </SelectItem>
                      <SelectItem value="Coinbase">
                        <span className="flex items-center gap-2">
                          <span>🔵</span> Coinbase
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Price Refresh Interval</label>
                <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5 Secs">5 Secs</SelectItem>
                    <SelectItem value="10 Secs">10 Secs</SelectItem>
                    <SelectItem value="30 Secs">30 Secs</SelectItem>
                    <SelectItem value="1 Min">1 Min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Deviation threshold (1%-100%)</label>
                <Select value={deviationThreshold} onValueChange={setDeviationThreshold}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1%">1%</SelectItem>
                    <SelectItem value="2%">2%</SelectItem>
                    <SelectItem value="5%">5%</SelectItem>
                    <SelectItem value="10%">10%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Pause market
              </Button>
              <Button variant="secondary" className="bg-secondary hover:bg-secondary/80">
                Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

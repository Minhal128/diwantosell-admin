import { useState, useEffect, useRef } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DailyTransaction {
  _id: string
  total: number
  count: number
}

interface TransactionChartProps {
  data?: DailyTransaction[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
  }>
  label?: string
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          Daily transaction: ${payload[0].value.toLocaleString()}
        </p>
      </div>
    )
  }
  return null
}

export function TransactionChart({ data }: TransactionChartProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Transform the data for the chart
  const chartData = data?.map(item => ({
    day: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: item.total,
    count: item.count
  })) || []

  // Calculate total volume and growth
  const totalVolume = chartData.reduce((sum, item) => sum + item.value, 0)
  const hasData = chartData.length > 0

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current
        setDimensions({ 
          width: offsetWidth || 400, 
          height: offsetHeight || 300 
        })
      }
    }

    // Initial measurement
    updateDimensions()

    // Set up resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Fallback for window resize
    window.addEventListener('resize', updateDimensions)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">Transaction Volume</h3>
          <p className="text-2xl lg:text-3xl font-bold mt-1">
            ${hasData ? totalVolume.toLocaleString() : '0.00'}
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
            {hasData ? (
              <>
                <span className="inline-block px-1 py-0.5 rounded bg-[var(--color-info-green)]/10 text-[var(--color-info-green)] font-bold">
                  ↑
                </span>
                <span className="text-[var(--color-info-green)]">Last 7 days</span>
                <span className="text-[#6D767E]">{chartData.length} days of data</span>
              </>
            ) : (
              <span className="text-[#6D767E]">No transaction data available</span>
            )}
          </span>
        </div>
        <Select defaultValue="weekly">
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div 
        ref={containerRef}
        className="h-[250px] lg:h-[300px] w-full min-h-[250px]"
        style={{ minWidth: '300px' }}
      >
        {dimensions.width > 0 && dimensions.height > 0 ? (
          hasData ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
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
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground">No transaction data available</p>
                <p className="text-xs text-muted-foreground mt-2">Data will appear once transactions are processed</p>
              </div>
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading chart...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

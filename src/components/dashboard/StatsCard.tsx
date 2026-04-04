import { ArrowUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string
  change?: string
  changeType?: 'positive' | 'negative'
  subtitle?: string
  className?: string
}

export function StatsCard({
  title,
  value,
  change,
  changeType = 'positive',
  subtitle,
  className,
}: StatsCardProps) {
  return (
    <div className={cn('rounded-xl border border-[#1a1a25] bg-card p-4 lg:p-6 flex flex-col gap-5', className)}>
      <div>
        <p className="text-sm font-medium text-[#6D767E] mb-3">{title}</p>
        <p className="text-3xl lg:text-4xl font-bold text-white tracking-tight">{value}</p>
      </div>

      <div className="flex flex-col gap-4">
        {change && (
          <div className="flex items-center gap-2.5 text-xs font-bold">
            <div
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full',
                changeType === 'positive'
                  ? 'bg-[#06AE7A] text-black shadow-lg shadow-[#06AE7A]/20'
                  : 'bg-destructive text-white'
              )}
            >
              <ArrowUp
                className={cn(
                  'h-3.5 w-3.5 stroke-[3px]',
                  changeType === 'negative' && 'rotate-180'
                )}
              />
            </div>
            <span className={changeType === 'positive' ? 'text-[#06AE7A]' : 'text-destructive'}>
              {change.split(' ')[0]}
            </span>
            <span className="text-[#6D767E] font-medium">
              {change.split(' ').slice(1).join(' ')}
            </span>
          </div>
        )}

        {subtitle && (
          <div className="flex flex-col gap-4">
            <div className="h-px w-full bg-[#1a1a25]" />
            <div className="flex items-center gap-2.5 text-xs text-[#6D767E] font-medium">
              <Sparkles className="h-4 w-4 text-[#06AE7A] fill-[#06AE7A]/10" />
              <span>{subtitle}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

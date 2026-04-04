import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface QueueItem {
  name: string
  count: number
  priority: 'high' | 'medium' | 'low'
}

interface OperationalQueuesProps {
  queues?: QueueItem[]
}

export function OperationalQueues({ queues = [] }: OperationalQueuesProps) {
  const getVariantFromPriority = (priority: string) => {
    return priority === 'high' ? 'investigate' : 'review'
  }

  const getButtonText = (priority: string) => {
    return priority === 'high' ? 'Investigate' : 'Review'
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 lg:p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Operational Queues</h3>
      <div className="space-y-4">
        {queues.length > 0 ? (
          queues.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded-xl bg-[#0e0d15] border border-[#1a1a25] p-4 hover:bg-[#131219] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-[#6D767E]">{item.name}</span>
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-2 text-[10px] font-bold",
                    getVariantFromPriority(item.priority) === 'investigate'
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-[#06AE7A]/10 text-[#06AE7A]'
                  )}
                >
                  {item.count}
                </span>
              </div>
              <Button
                size="sm"
                className={cn(
                  "h-8 px-4 text-xs font-bold rounded-md",
                  getVariantFromPriority(item.priority) === 'investigate'
                    ? "bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black"
                    : "bg-[#06AE7A] hover:bg-[#06AE7A]/90 text-black"
                )}
              >
                {getButtonText(item.priority)}
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-8 text-sm">
            <p>No operational queues</p>
            <p className="text-xs mt-2">All tasks are up to date</p>
          </div>
        )}
      </div>
    </div>
  )
}

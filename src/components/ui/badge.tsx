import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-[#1ABFA1] text-black font-semibold",
        warning: "border-transparent bg-warning text-warning-foreground",
        pending: "border-transparent bg-[#F59E0B] text-black font-semibold",
        verified: "border-transparent bg-[#1ABFA1] text-black font-semibold",
        approved: "border-transparent bg-[#1ABFA1] text-black font-semibold",
        active: "border-transparent bg-[#1ABFA1] text-black font-semibold",
        paused: "border-transparent bg-[#F59E0B] text-black font-semibold",
        cancelled: "border-transparent bg-[#EF4444] text-white font-semibold",
        closed: "border-transparent bg-[#EF4444] text-white font-semibold",
        open: "border-transparent bg-[#1ABFA1] text-black font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#4A5A7A] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-[#1A1A1A] bg-[#1A1A1A] text-white dark:border-[#F1F3F6] dark:bg-[#F1F3F6] dark:text-[#0A0F1C]",
        secondary:
          "border-[#E0E3E8] dark:border-[#2D3748] bg-[#F5F3F0] dark:bg-[#1E2532] text-[#3A3A3A] dark:text-[#A0AEC0]",
        destructive:
          "border-[#B86B6B] bg-[#B86B6B] text-white dark:border-[#EF4444] dark:bg-[#EF4444] dark:text-white",
        outline: "border-[#E0E3E8] dark:border-[#2D3748] text-[#1A1A1A] dark:text-[#F1F3F6]",
        success:
          "border-[#10B981] bg-[#10B981] text-white",
        warning:
          "border-[#F59E0B] bg-[#F59E0B] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

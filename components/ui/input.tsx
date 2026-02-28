import * as React from "react"

import { cn } from "@/lib/utils"

type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-sm border border-[#E0E3E8] dark:border-[#2D3748] bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#9AA5B1] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#1A1A1A] dark:focus-visible:border-[#F1F3F6] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }

import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-sm border border-[#E0E3E8] dark:border-[#2D3748] bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-[#9AA5B1] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[#1A1A1A] dark:focus-visible:border-[#F1F3F6] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-sans",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#1A1A1A] text-white shadow hover:bg-[#3A3A3A] dark:bg-[#F1F3F6] dark:text-[#0A0F1C] dark:hover:bg-[#E2E8F0]",
        destructive:
          "bg-[#B86B6B] text-white shadow-sm hover:bg-[#A55A5A] dark:bg-[#EF4444] dark:text-white dark:hover:bg-[#DC2626]",
        outline:
          "border border-[#E0E3E8] dark:border-[#2D3748] bg-transparent shadow-sm hover:bg-[#F5F3F0] dark:hover:bg-[#1E2532] hover:text-[#1A1A1A] dark:hover:text-[#F1F3F6]",
        secondary:
          "bg-[#E3E7EF] dark:bg-[#2D3748] text-[#1A1A1A] dark:text-[#F1F3F6] shadow-sm hover:bg-[#D1D5DE] dark:hover:bg-[#3A4050]",
        ghost: "hover:bg-[#F5F3F0] dark:hover:bg-[#1E2532] hover:text-[#1A1A1A] dark:hover:text-[#F1F3F6]",
        link: "text-[#4A5A7A] underline-offset-4 hover:underline dark:text-[#6B8AAD]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

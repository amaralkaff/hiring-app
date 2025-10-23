"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-5 w-5 shrink-0 rounded border-2 transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Default state
      "border-neutral-60 bg-neutral-10",
      // Checked state
      "data-[state=checked]:bg-primary-main data-[state=checked]:border-primary-main",
      // Hover state
      "hover:border-neutral-70",
      // Focus state
      "focus-visible:ring-primary-focus",
      // Disabled checked state
      "disabled:data-[state=checked]:bg-neutral-50 disabled:data-[state=checked]:border-neutral-50",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <CheckIcon className="h-4 w-4 text-neutral-10 stroke-[3]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }

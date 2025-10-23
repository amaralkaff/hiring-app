"use client"

import * as React from "react"
import { XMarkIcon } from "@heroicons/react/24/outline"
import { cn } from "@/lib/utils"

export interface ChipProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean
  onRemove?: () => void
  disabled?: boolean
  variant?: "default" | "rest"
  hideIcon?: boolean
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, children, active = false, onRemove, disabled, variant = "default", hideIcon = false, ...props }, ref) => {
    const isActive = variant === "default" ? true : active
    
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-s-bold transition-all",
          "border-2",
          // Active and disabled state (teal border, no hover)
          isActive && disabled && [
            "border-primary-main bg-neutral-10 text-primary-main",
            "cursor-not-allowed"
          ],
          // Active state (teal border)
          isActive && !disabled && [
            "border-primary-main bg-neutral-10 text-primary-main",
            "hover:bg-primary-surface"
          ],
          // Rest state (gray border)
          !isActive && !disabled && [
            "border-neutral-40 bg-neutral-10 text-neutral-80",
            "hover:border-neutral-50 hover:bg-neutral-20"
          ],
          // Disabled and not active state
          !isActive && disabled && [
            "border-neutral-30 bg-neutral-20 text-neutral-50",
            "cursor-not-allowed"
          ],
          className
        )}
        {...props}
      >
        {isActive && !hideIcon && (
          <CheckmarkIcon className="w-4 h-4" />
        )}
        <span>{children}</span>
        {onRemove && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
            aria-label="Remove"
          >
            <XMarkIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    )
  }
)
Chip.displayName = "Chip"

// Checkmark icon component
const CheckmarkIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.3333 4L6 11.3333L2.66667 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

export { Chip }

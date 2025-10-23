"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TagProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "success" | "danger" | "warning"
  filled?: boolean
  withIcon?: boolean
}

const Tag = React.forwardRef<HTMLDivElement, TagProps>(
  ({ className, children, variant = "success", filled = false, withIcon = true, ...props }, ref) => {
    const getVariantClasses = () => {
      const baseClasses = "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-s-bold transition-all border"
      
      if (variant === "success") {
        if (filled) {
          return cn(
            baseClasses,
            "bg-success-main border-success-main text-neutral-10",
            "hover:bg-success-hover"
          )
        }
        return cn(
          baseClasses,
          "bg-neutral-10 border-success-border text-success-main",
          "hover:bg-success-surface"
        )
      }
      
      if (variant === "danger") {
        if (filled) {
          return cn(
            baseClasses,
            "bg-danger-main border-danger-main text-neutral-10",
            "hover:bg-danger-hover"
          )
        }
        return cn(
          baseClasses,
          "bg-neutral-10 border-danger-border text-danger-main",
          "hover:bg-danger-surface"
        )
      }
      
      if (variant === "warning") {
        if (filled) {
          return cn(
            baseClasses,
            "bg-warning-main border-warning-main text-neutral-10",
            "hover:bg-warning-hover"
          )
        }
        return cn(
          baseClasses,
          "bg-neutral-10 border-warning-border text-warning-main",
          "hover:bg-warning-surface"
        )
      }
      
      return baseClasses
    }
    
    return (
      <div
        ref={ref}
        className={cn(getVariantClasses(), className)}
        {...props}
      >
        {withIcon && <TagIcon />}
        <span>{children}</span>
      </div>
    )
  }
)
Tag.displayName = "Tag"

// Tag icon component
const TagIcon = () => (
  <svg
    className="w-3.5 h-3.5"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 2.66667V7.33333L8.66667 14L13.3333 9.33333L6.66667 2.66667H2Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="4.66667" cy="4.66667" r="0.666667" fill="currentColor" />
  </svg>
)

export { Tag }

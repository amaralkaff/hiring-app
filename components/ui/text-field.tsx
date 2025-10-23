"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string
  helperText?: string
  errorText?: string
  isError?: boolean
  isSuccess?: boolean
  maxLength?: number
  showCount?: boolean
  prefix?: React.ReactNode
  suffix?: React.ReactNode
  containerClassName?: string
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  (
    {
      className,
      label,
      helperText,
      errorText,
      isError,
      isSuccess,
      maxLength,
      showCount = false,
      prefix,
      suffix,
      containerClassName,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const [charCount, setCharCount] = React.useState(0)

    React.useEffect(() => {
      if (value !== undefined) {
        setCharCount(String(value).length)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCharCount(e.target.value.length)
      props.onChange?.(e)
    }

    // Determine the state classes
    const getInputClasses = () => {
      const baseClasses = "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none"
      
      if (disabled) {
        return cn(
          baseClasses,
          "bg-neutral-30 border-neutral-40 text-neutral-60 cursor-not-allowed"
        )
      }
      
      if (isError || errorText) {
        return cn(
          baseClasses,
          "bg-neutral-10 border-danger-main text-neutral-100",
          "focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
        )
      }
      
      if (isSuccess) {
        return cn(
          baseClasses,
          "bg-neutral-10 border-primary-main text-neutral-100",
          "focus:border-primary-main focus:ring-2 focus:ring-primary-focus"
        )
      }
      
      if (isFocused) {
        return cn(
          baseClasses,
          "bg-neutral-10 border-primary-main text-neutral-100",
          "ring-2 ring-primary-focus"
        )
      }
      
      // Default state
      return cn(
        baseClasses,
        "bg-neutral-10 border-neutral-40 text-neutral-100",
        "hover:border-neutral-50",
        "focus:border-primary-main focus:ring-2 focus:ring-primary-focus",
        "placeholder:text-neutral-60"
      )
    }

    const getLabelClasses = () => {
      return cn(
        "text-s-bold mb-2 inline-block",
        disabled ? "text-neutral-60" : "text-neutral-100"
      )
    }

    const getHelperTextClasses = () => {
      if (isError || errorText) {
        return "text-s-regular text-danger-main mt-2"
      }
      
      if (isSuccess) {
        return "text-s-regular text-primary-main mt-2"
      }
      
      return "text-s-regular text-neutral-70 mt-2"
    }

    const displayHelperText = errorText || helperText
    const showCharacterCount = showCount && maxLength

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label className={getLabelClasses()}>
            {label}
            {props.required && <span className="text-danger-main ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {prefix && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {prefix}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              getInputClasses(),
              prefix && "pl-12",
              suffix && "pr-12",
              className
            )}
            disabled={disabled}
            maxLength={maxLength}
            value={value}
            onChange={handleChange}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            {...props}
          />
          
          {suffix && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              {suffix}
            </div>
          )}
        </div>
        
        {(displayHelperText || showCharacterCount) && (
          <div className="flex items-center justify-between mt-2">
            {displayHelperText && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />
                <span className={getHelperTextClasses()}>
                  {displayHelperText}
                </span>
              </div>
            )}
            
            {showCharacterCount && (
              <span className="text-s-regular text-neutral-70 ml-auto">
                {charCount} / {maxLength}
              </span>
            )}
          </div>
        )}
      </div>
    )
  }
)

TextField.displayName = "TextField"

export { TextField }

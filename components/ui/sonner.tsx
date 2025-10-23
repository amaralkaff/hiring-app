"use client"

import { CheckCircleIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { Toaster as Sonner, type ToasterProps, toast } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      position="bottom-left"
      offset="24px"
      expand={false}
      closeButton
      toastOptions={{
        classNames: {
          toast: 'group toast group-[.toaster]:!bg-white group-[.toaster]:!text-neutral-100 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:w-auto group-[.toaster]:min-w-[300px] group-[.toaster]:max-w-[500px] group-[.toaster]:p-4 group-[.toaster]:!flex group-[.toaster]:items-center group-[.toaster]:gap-3 group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary-main',
          title: 'group-[.toast]:text-m-regular group-[.toast]:!text-neutral-100 group-[.toast]:font-medium',
          description: 'group-[.toast]:text-neutral-60 group-[.toast]:text-sm group-[.toast]:mt-1',
          actionButton: 'group-[.toast]:bg-primary-main group-[.toast]:text-neutral-10 group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:rounded group-[.toast]:text-sm group-[.toast]:font-medium',
          cancelButton: 'group-[.toast]:bg-neutral-60 group-[.toast]:text-neutral-10 group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:rounded group-[.toast]:text-sm group-[.toast]:font-medium',
          success: 'group-[.toast]:!border-l-primary-main',
          error: 'group-[.toast]:!border-l-primary-main',
          warning: 'group-[.toast]:!border-l-primary-main',
          info: 'group-[.toast]:!border-l-primary-main',
          closeButton: 'group-[.toast]:!relative group-[.toast]:!bg-transparent group-[.toast]:!border-0 group-[.toast]:!text-neutral-60 hover:group-[.toast]:!text-neutral-100 group-[.toast]:!transition-colors group-[.toast]:!w-5 group-[.toast]:!h-5 group-[.toast]:!p-0 group-[.toast]:!ml-auto group-[.toast]:opacity-100',
        },
      }}
      icons={{
        success: (
          <CheckCircleIcon className="w-5 h-5 text-primary-main flex-shrink-0" />
        ),
        error: (
          <XMarkIcon className="w-5 h-5 text-primary-main flex-shrink-0" />
        ),
        warning: (
          <CheckCircleIcon className="w-5 h-5 text-primary-main flex-shrink-0" />
        ),
        info: (
          <CheckCircleIcon className="w-5 h-5 text-primary-main flex-shrink-0" />
        ),
        loading: (
          <CheckCircleIcon className="w-5 h-5 text-primary-main flex-shrink-0 animate-spin" />
        ),
      }}
      {...props}
    />
  )
}

export { Toaster, toast }

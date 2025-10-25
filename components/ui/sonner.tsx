"use client"

import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from "@heroicons/react/24/solid"
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
          toast: 'group toast group-[.toaster]:!bg-white group-[.toaster]:!text-neutral-100 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:w-auto group-[.toaster]:min-w-[350px] group-[.toaster]:max-w-[500px] group-[.toaster]:!flex group-[.toaster]:items-center group-[.toaster]:overflow-hidden group-[.toaster]:relative group-[.toaster]:pl-5 group-[.toaster]:pr-12 group-[.toaster]:py-4',
          title: 'group-[.toast]:text-m-regular group-[.toast]:!text-neutral-100 group-[.toast]:font-semibold group-[.toast]:ml-3',
          description: 'group-[.toast]:text-neutral-60 group-[.toast]:text-sm group-[.toast]:mt-1 group-[.toast]:ml-3',
          actionButton: 'group-[.toast]:bg-primary-main group-[.toast]:text-neutral-10 group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:rounded group-[.toast]:text-sm group-[.toast]:font-medium',
          cancelButton: 'group-[.toast]:bg-neutral-60 group-[.toast]:text-neutral-10 group-[.toast]:px-3 group-[.toast]:py-1 group-[.toast]:rounded group-[.toast]:text-sm group-[.toast]:font-medium',
          success: '',
          error: '',
          warning: '',
          info: '',
          closeButton: 'group-[.toast]:!absolute group-[.toast]:!right-4 group-[.toast]:!top-1/2 group-[.toast]:!-translate-y-1/2 group-[.toast]:!bg-transparent group-[.toast]:!border-0 group-[.toast]:!text-neutral-60 hover:group-[.toast]:!text-neutral-100 group-[.toast]:!transition-colors group-[.toast]:!w-5 group-[.toast]:!h-5 group-[.toast]:!p-0 group-[.toast]:opacity-100',
        },
      }}
      icons={{
        success: (
          <>
            <div className="w-1.5 h-full bg-primary-main absolute left-0 top-0 bottom-0 rounded-l-lg"></div>
            <CheckCircleIcon className="w-6 h-6 text-primary-main flex-shrink-0" />
          </>
        ),
        error: (
          <>
            <div className="w-1.5 h-full bg-danger-main absolute left-0 top-0 bottom-0 rounded-l-lg"></div>
            <XCircleIcon className="w-6 h-6 text-danger-main flex-shrink-0" />
          </>
        ),
        warning: (
          <>
            <div className="w-1.5 h-full bg-warning-main absolute left-0 top-0 bottom-0 rounded-l-lg"></div>
            <ExclamationCircleIcon className="w-6 h-6 text-warning-main flex-shrink-0" />
          </>
        ),
        info: (
          <>
            <div className="w-1.5 h-full bg-primary-main absolute left-0 top-0 bottom-0 rounded-l-lg"></div>
            <InformationCircleIcon className="w-6 h-6 text-primary-main flex-shrink-0" />
          </>
        ),
        loading: (
          <>
            <div className="w-1.5 h-full bg-primary-main absolute left-0 top-0 bottom-0 rounded-l-lg"></div>
            <CheckCircleIcon className="w-6 h-6 text-primary-main flex-shrink-0 animate-spin" />
          </>
        ),
      }}
      {...props}
    />
  )
}

export { Toaster, toast }

'use client';

import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center justify-between py-4 px-6">
      <div className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isActive = item.active || isLast;

          return (
            <div key={index} className="flex items-center">
              {index > 0 && (
                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-2" />
              )}
              {item.href && !isActive ? (
                <Link
                  href={item.href}
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>
      
      {/* User Profile Icon */}
      <div className="w-10 h-10 rounded-full overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
        <Image
          src="/avatar.png"
          alt="User Profile"
          width={40}
          height={40}
          className="w-full h-full object-cover"
        />
      </div>
    </nav>
  );
}

export function useBreadcrumbs() {
  const pathname = usePathname();
  
  // Generate breadcrumb items based on current path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean);
    
    // Admin routes
    if (segments[0] === 'dashboard') {
      // Default breadcrumb for dashboard
      if (segments.length === 1) {
        return [{ label: 'Job list', href: '/dashboard', active: true }];
      }
      
      // For candidates page (now under /dashboard/candidates/[jobId])
      if (segments.includes('candidates')) {
        return [
          { label: 'Job list', href: '/dashboard' },
          { label: 'Manage Candidate', active: true }
        ];
      }
      
      return [{ label: 'Job list', href: '/dashboard' }];
    }
    
    // Applicant routes
    if (segments[0] === 'jobs') {
      // Jobs listing page
      if (segments.length === 1) {
        return [{ label: 'Available Jobs', href: '/jobs', active: true }];
      }
      
      // Job detail page
      if (segments.length === 2 && segments[1] !== 'apply') {
        return [
          { label: 'Available Jobs', href: '/jobs' },
          { label: 'Job Details', active: true }
        ];
      }
      
      // Job application page
      if (segments.includes('apply')) {
        return [
          { label: 'Available Jobs', href: '/jobs' },
          { label: 'Job Details', href: `/jobs/${segments[1]}` },
          { label: 'Apply', active: true }
        ];
      }
    }
    
    // Default fallback
    return [{ label: 'Home', href: '/', active: true }];
  };

  return generateBreadcrumbs();
}

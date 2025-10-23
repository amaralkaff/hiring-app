import { ReactNode } from 'react';

export default function ApplicantLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Job Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Job Seeker</span>
              <a 
                href="/" 
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Switch Role
              </a>
            </div>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

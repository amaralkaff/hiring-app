'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/app-store';
import { Button } from '@/components/ui/button';
import { BriefcaseIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const router = useRouter();
  const setUserRole = useAppStore((state) => state.setUserRole);

  const handleRoleSelect = (role: 'admin' | 'applicant') => {
    setUserRole(role);
    if (role === 'admin') {
      router.push('/dashboard');
    } else {
      router.push('/jobs');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="w-full max-w-4xl px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Hiring Management System
          </h1>
          <p className="text-lg text-gray-600">
            Select your role to continue
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Admin Card */}
          <div 
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500"
            onClick={() => handleRoleSelect('admin')}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <BriefcaseIcon className="w-10 h-10 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Admin / Recruiter
                </h2>
                <p className="text-gray-600">
                  Manage job postings, review candidates, and track applications
                </p>
              </div>
              <Button className="w-full" size="lg">
                Continue as Admin
              </Button>
            </div>
          </div>

          {/* Applicant Card */}
          <div 
            className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500"
            onClick={() => handleRoleSelect('applicant')}
          >
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <UserIcon className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                  Applicant / Job Seeker
                </h2>
                <p className="text-gray-600">
                  Browse job openings and submit your applications
                </p>
              </div>
              <Button className="w-full" variant="outline" size="lg">
                Continue as Applicant
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

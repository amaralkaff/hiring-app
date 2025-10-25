'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { DynamicApplicationForm } from '@/components/features/dynamic-form';
import type { Job } from '@/lib/types';

export default function ApplyJobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchJob = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data.data);
      } else {
        const localJobs = localStorage.getItem('custom_jobs');
        const customJobs = localJobs ? JSON.parse(localJobs) : [];
        const foundJob = customJobs.find((j: Job) => j.slug === slug);
        setJob(foundJob || null);
      }
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading application form...</p>
      </div>
    );
  }

  if (!job || !job.application_form) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Application form not available</p>
          <Button onClick={() => router.push('/jobs')} className="mt-4">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Combined Card with Header, Info Banner and Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header with Info Banner */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/jobs/${slug}`)}
                  className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="text-lg font-bold text-gray-900">
                  Apply {job.title} at {job.department || 'Rakamin'}
                </h1>
              </div>
              
              {/* Info Banner - Top Right */}
              <div className="rounded-lg p-3 flex items-start gap-2 max-w-xs">
                <p className="text-xs ">ℹ️ This field required to fill</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 pt-0">
            <DynamicApplicationForm job={job} />
          </div>
        </div>
      </div>
    </div>
  );
}

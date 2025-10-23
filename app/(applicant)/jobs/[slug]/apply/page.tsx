'use client';

import { use, useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchJob();
  }, [slug]);

  const fetchJob = async () => {
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
  };

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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="ghost"
        onClick={() => router.push(`/applicant/jobs/${slug}`)}
        className="mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Job Details
      </Button>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Apply for {job.title}</h1>
          <p className="text-gray-600">
            Please fill out the application form below. Fields marked with * are required.
          </p>
        </div>

        <DynamicApplicationForm job={job} />
      </div>
    </div>
  );
}

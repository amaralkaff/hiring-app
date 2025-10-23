'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, BriefcaseIcon, CurrencyDollarIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Job } from '@/lib/types';

export default function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJob();
  }, [slug]);

  const fetchJob = async () => {
    try {
      // Try API first
      const response = await fetch(`/api/jobs/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data.data);
      } else {
        // Check localStorage
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
        <p className="text-gray-600">Loading job details...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <Button onClick={() => router.push('/jobs')} className="mt-4">
            Back to Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/jobs')}
        className="mb-6"
      >
        <ArrowLeftIcon className="w-4 h-4 mr-2" />
        Back to Jobs
      </Button>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
          <Badge className="bg-green-100 text-green-800">
            {job.list_card.badge}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {job.department && (
            <div className="flex items-center text-gray-600">
              <BriefcaseIcon className="w-5 h-5 mr-2" />
              <span>{job.department}</span>
            </div>
          )}
          
          <div className="flex items-center text-gray-600">
            <CurrencyDollarIcon className="w-5 h-5 mr-2" />
            <span>{job.salary_range.display_text}</span>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-6">
          {job.list_card.started_on_text}
        </div>

        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => router.push(`/jobs/${job.slug}/apply`)}
        >
          Apply Now
        </Button>
      </div>

      {/* Job Description */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Job Description</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-700 whitespace-pre-wrap">
            {job.description || 'No description available.'}
          </p>
        </div>

        {job.application_form && (
          <div className="mt-8 pt-8 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Application Requirements
            </h3>
            <p className="text-gray-600 mb-4">
              To apply for this position, you'll need to provide the following information:
            </p>
            <ul className="list-disc list-inside space-y-2">
              {job.application_form.sections[0].fields.map((field) => (
                <li key={field.key} className="text-gray-700">
                  {field.key.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                  {field.validation.required && (
                    <span className="text-red-600 ml-1">*</span>
                  )}
                  {!field.validation.required && (
                    <span className="text-gray-500 text-sm ml-1">(optional)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

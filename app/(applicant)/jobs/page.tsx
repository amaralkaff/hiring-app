'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Job } from '@/lib/types';

export default function JobsListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const router = useRouter();

  // Fetch jobs on mount
  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        const response = await fetch('/api/jobs?status=active', { signal: controller.signal });
        const data = await response.json();
        const jobsList = data.data || [];

        const allJobs = jobsList;
        setJobs(allJobs);

        if (allJobs.length > 0) {
          setSelectedJob(allJobs[0]);
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error fetching jobs:', error);
        setJobs([]);
        setSelectedJob(null);
      }
    };

    fetchData();

    return () => controller.abort();
  }, []);

  if (jobs.length === 0) {
    return (
      <div className="w-full pt-10 px-[104px] pb-10 bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">No jobs available</p>
      </div>
    );
  }

  return (
    <div className="w-full pt-10 px-[104px] pb-10 bg-gray-50 min-h-screen">
        <div className="flex gap-6 max-w-[1440px] mx-auto">
          {/* Left Sidebar - Job List */}
          <div className="w-[406px] max-h-[calc(100vh-120px)] overflow-y-auto space-y-4 pr-2">
            {jobs.map((job) => (
              <div
                key={job.id}
                onClick={() => setSelectedJob(job)}
                className={`
                  bg-white p-5 rounded-xl border-2 cursor-pointer transition-all
                  ${selectedJob?.id === job.id
                    ? 'border-teal-500 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                {/* Company Logo & Title */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">
                      {job.department?.charAt(0) || 'R'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base mb-1 leading-tight">
                      {job.title}
                    </h3>
                    <p className="text-sm text-gray-600">{job.department || 'Rakamin'}</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <MapPinIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>Jakarta Selatan</span>
                </div>

                {/* Salary */}
                <div className="flex items-center text-sm text-gray-600">
                  <CurrencyDollarIcon className="w-4 h-4 mr-2 text-gray-400" />
                  <span>{job.salary_range?.display_text || 'Salary not specified'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Right Side - Job Details */}
          <div className="w-[802px] sticky top-10 h-fit">
            {selectedJob ? (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                {/* Header with Badge and Apply Button */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-xl">
                        {selectedJob.department?.charAt(0) || 'R'}
                      </span>
                    </div>
                    <div>
                      <Badge className="bg-green-100 text-green-700 border-0 mb-2 px-3 py-1">
                        {selectedJob.list_card.badge}
                      </Badge>
                      <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {selectedJob.title}
                      </h1>
                      <p className="text-gray-600">{selectedJob.department || 'Rakamin'}</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => router.push(`/jobs/${selectedJob.slug}/apply`)}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold px-6 rounded-lg"
                  >
                    Apply
                  </Button>
                </div>

                {/* Job Description */}
                <div className="prose prose-gray max-w-none">
                  {selectedJob.description && (
                    <ul className="space-y-2 text-gray-700 list-disc list-inside">
                      {selectedJob.description.split('\n').map((line, idx) => (
                        line.trim() && (
                          <li key={idx} className="text-sm leading-relaxed pl-2">
                            {line.replace(/^[-•]\s*/, '').trim()}
                          </li>
                        )
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-white rounded-lg border border-gray-200">
                <p className="text-gray-500">Select a job to view details</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BriefcaseIcon, MapPinIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Job } from '@/lib/types';

export default function JobsListPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // Fetch from API (only active jobs)
      const response = await fetch('/api/jobs?status=active');
      const data = await response.json();
      
      // Also check localStorage for custom jobs
      const localJobs = localStorage.getItem('custom_jobs');
      const customJobs = localJobs ? JSON.parse(localJobs) : [];
      const activeCustomJobs = customJobs.filter((j: Job) => j.status === 'active');
      
      const allJobs = [...data.data, ...activeCustomJobs];
      setJobs(allJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Available Jobs</h2>
        <p className="mt-2 text-gray-600">
          Browse and apply to open positions
        </p>
      </div>

      {/* Job Cards */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <p className="text-gray-600">No active jobs available at the moment</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link href={`/jobs/${job.slug}`} key={job.id}>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all hover:border-blue-500 cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    {job.title}
                  </h3>
                  <Badge className="bg-green-100 text-green-800">
                    {job.list_card.badge}
                  </Badge>
                </div>

                <div className="space-y-3 mb-6 flex-grow">
                  {job.department && (
                    <div className="flex items-center text-gray-600">
                      <BriefcaseIcon className="w-4 h-4 mr-2" />
                      <span className="text-sm">{job.department}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-gray-600">
                    <CurrencyDollarIcon className="w-4 h-4 mr-2" />
                    <span className="text-sm">{job.salary_range.display_text}</span>
                  </div>
                  
                  {job.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {job.description}
                    </p>
                  )}
                </div>

                <Button className="w-full">
                  View Details
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

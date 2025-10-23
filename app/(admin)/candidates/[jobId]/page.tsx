'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { CandidateTable } from '@/components/features/candidate-table';
import type { Candidate, Job } from '@/lib/types';

export default function CandidatesPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [jobId]);

  const fetchData = async () => {
    try {
      // Fetch candidates
      const candidatesResponse = await fetch(`/api/candidates/${jobId}`);
      const candidatesData = await candidatesResponse.json();
      
      // Also check localStorage for submitted applications
      const localApplications = localStorage.getItem(`applications_${jobId}`);
      const submittedApps = localApplications ? JSON.parse(localApplications) : [];
      
      const allCandidates = [...candidatesData.data, ...submittedApps];
      setCandidates(allCandidates);

      // Fetch job details from API
      const jobsResponse = await fetch('/api/jobs');
      const jobsData = await jobsResponse.json();
      let foundJob = jobsData.data.find((j: Job) => j.id === jobId);
      
      // If not found, check localStorage
      if (!foundJob) {
        const localJobs = localStorage.getItem('custom_jobs');
        const customJobs = localJobs ? JSON.parse(localJobs) : [];
        foundJob = customJobs.find((j: Job) => j.id === jobId);
      }
      
      setJob(foundJob || null);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading candidates...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Job not found</p>
          <Button onClick={() => router.push('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="mb-4"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h2 className="text-3xl font-bold text-gray-900">{job.title}</h2>
        <p className="mt-2 text-gray-600">
          Manage candidates for this position
        </p>
      </div>

      {/* Candidate Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Candidates ({candidates.length})
          </h3>
          <p className="text-sm text-gray-600">
            Resize columns by dragging the edges, reorder by dragging column headers
          </p>
        </div>
        
        {candidates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No candidates have applied yet</p>
          </div>
        ) : (
          <CandidateTable data={candidates} />
        )}
      </div>
    </div>
  );
}

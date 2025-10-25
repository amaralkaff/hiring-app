'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { EnhancedCandidateTable } from '@/components/features/candidate-table';
import type { Candidate, Job } from '@/lib/types';

export default function CandidatesPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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
  }, [jobId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading candidates...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto px-6 py-8">
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
    <div className="mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">{job.title}</h2>
        {job.department && (
          <p className="text-lg text-neutral-80 mt-2">{job.department}</p>
        )}
      </div>

      {/* Content Area */}
      {candidates.length === 0 ? (
        <div className="flex items-center justify-center min-h-[600px] bg-white rounded-lg" style={{ boxShadow: '0px 4px 8px 0px #0000001A' }}>
          <div className="flex flex-col items-center justify-center py-20 px-4">
            {/* Illustration */}
            <div className="mb-8">
              <Image
                src="/artwork-no-candidates.png"
                alt="No candidates found"
                width={320}
                height={240}
                className="w-80 h-auto"
              />
            </div>

            {/* Text Content */}
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              No candidates found
            </h3>
            <p className="text-base text-gray-600 max-w-md text-center">
              Share your job vacancies so that more candidates will apply.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-6" style={{ boxShadow: '0px 4px 8px 0px #0000001A' }}>
          <EnhancedCandidateTable data={candidates} />
        </div>
      )}
    </div>
  );
}

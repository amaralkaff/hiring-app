import type { Job } from '@/lib/types';
import ApplicantJobsClient from '@/components/features/applicant-jobs-client';
import { createClient } from '@/utils/supabase/server';

// Fetch active jobs directly from database on the server side
async function getActiveJobs(): Promise<Job[]> {
  try {
    console.log('Fetching active jobs from database...');
    const supabase = await createClient();

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active jobs:', error);
      return [];
    }

    console.log(`Successfully fetched ${jobs?.length || 0} active jobs`);
    return jobs || [];
  } catch (error) {
    console.error('Error fetching active jobs:', error);
    return [];
  }
}

export default async function JobsListPage() {
  // Fetch active jobs directly from database on the server
  const jobs = await getActiveJobs();

  // Pass data to client component for interactivity
  return <ApplicantJobsClient initialJobs={jobs} />;
}

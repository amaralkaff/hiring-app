import type { Job } from '@/lib/types';
import DashboardClient from '@/components/features/dashboard-client';
import { createClient } from '@/utils/supabase/server';

// Fetch data directly from database on the server side
async function getJobs(): Promise<Job[]> {
  try {
    const supabase = await createClient();

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      return [];
    }

    return jobs || [];
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

export default async function AdminDashboard() {
  // Fetch data directly from database on the server
  const jobs = await getJobs();

  // Pass data to client component for interactivity
  return <DashboardClient initialJobs={jobs} />;
}

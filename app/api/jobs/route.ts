import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const filePath = path.join(process.cwd(), 'data', 'mock-jobs.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const jobs = JSON.parse(fileContent);

  let filteredJobs = [...jobs];

  // Filter by status
  if (status && status !== 'all') {
    filteredJobs = filteredJobs.filter(job => job.status === status);
  }

  // Filter by search query (title or department)
  if (search) {
    const searchLower = search.toLowerCase();
    filteredJobs = filteredJobs.filter(job => 
      job.title.toLowerCase().includes(searchLower) ||
      job.department?.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json({ data: filteredJobs });
}

export async function POST(request: NextRequest) {
  try {
    const newJob = await request.json();
    
    const filePath = path.join(process.cwd(), 'data', 'mock-jobs.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const jobs = JSON.parse(fileContent);
    
    jobs.push(newJob);
    
    await fs.writeFile(filePath, JSON.stringify(jobs, null, 2), 'utf-8');
    
    return NextResponse.json({ 
      success: true,
      data: newJob 
    });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save job' },
      { status: 500 }
    );
  }
}

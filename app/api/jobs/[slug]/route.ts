import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import type { Job } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  
  const filePath = path.join(process.cwd(), 'data', 'mock-jobs.json');
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const jobsData = JSON.parse(fileContent) as Job[];
  
  const job = jobsData.find(j => j.slug === slug);

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: job });
}

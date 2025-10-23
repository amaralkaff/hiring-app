import { NextRequest, NextResponse } from 'next/server';
import candidatesData from '@/data/mock-candidates.json';
import type { Candidate } from '@/lib/types';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  // Filter candidates by job_id
  const candidates = (candidatesData as Candidate[]).filter(c => c.job_id === jobId);

  return NextResponse.json({ data: candidates });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const body = await request.json();

  // Generate candidate ID
  const candidateId = `cand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const candidate = {
    id: candidateId,
    job_id: jobId,
    attributes: Object.entries(body).map(([key, value], index) => ({
      key,
      label: key.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      value: value as string,
      order: index + 1
    })),
    created_at: new Date().toISOString()
  };

  return NextResponse.json({ 
    success: true,
    data: candidate 
  });
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    const supabase = await createClient();
    
    const { data: candidates, error } = await supabase
      .from('candidates')
      .select('id, job_id, attributes, created_at, updated_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching candidates:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch candidates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: candidates || [] });
  } catch (error) {
    console.error('Error in candidates GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();

    // Generate candidate ID
    const candidateId = `cand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const candidate = {
      id: candidateId,
      job_id: jobId,
      attributes: body
    };

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('candidates')
      .insert([candidate])
      .select('id, job_id, attributes, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating candidate:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create candidate' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error in candidates POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

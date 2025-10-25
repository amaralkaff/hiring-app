import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const supabase = await createClient();
    
    let query = supabase.from('jobs').select('*');
    
    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by search query (title or department)
    if (search) {
      const searchLower = search.toLowerCase();
      query = query.or(`title.ilike.%${searchLower}%,department.ilike.%${searchLower}%`);
    }

    const { data: jobs, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch jobs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: jobs || [] });
  } catch (error) {
    console.error('Error in jobs GET:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const newJob = await request.json();
    
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('jobs')
      .insert([newJob])
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create job' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error in jobs POST:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

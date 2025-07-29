import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get search query from URL params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    // Fetch job titles (global + company-specific)
    let query = supabase
      .from('job_titles')
      .select('*')
      .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: jobTitles, error } = await query;

    if (error) {
      console.error('Error fetching job titles:', error);
      return NextResponse.json({ error: 'Failed to fetch job titles' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobTitles: jobTitles || [],
    });
  } catch (error) {
    console.error('Error in job titles API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Job title name is required' }, { status: 400 });
    }

    // Check if job title already exists for this company
    const { data: existingTitle, error: checkError } = await supabase
      .from('job_titles')
      .select('id')
      .eq('name', name.trim())
      .eq('company_id', profile.company_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "not found"
      console.error('Error checking existing job title:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingTitle) {
      return NextResponse.json(
        { error: 'Job title already exists for your company' },
        { status: 409 },
      );
    }

    // Create new job title
    const { data: newJobTitle, error: createError } = await supabase
      .from('job_titles')
      .insert({
        name: name.trim(),
        company_id: profile.company_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating job title:', createError);
      return NextResponse.json({ error: 'Failed to create job title' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobTitle: newJobTitle,
    });
  } catch (error) {
    console.error('Error in create job title API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

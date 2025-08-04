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

    // Fetch departments (global + company-specific)
    let query = supabase
      .from('departments')
      .select('*')
      .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: departments, error } = await query;

    if (error) {
      console.error('Error fetching departments:', error);
      return NextResponse.json({ error: 'Failed to fetch departments' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      departments: departments || [],
    });
  } catch (error) {
    console.error('Error in departments API:', error);
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
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    // Check if department already exists for this company
    const { data: existingDept, error: checkError } = await supabase
      .from('departments')
      .select('id')
      .eq('name', name.trim())
      .eq('company_id', profile.company_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing department:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingDept) {
      return NextResponse.json(
        { error: 'Department already exists for your company' },
        { status: 409 },
      );
    }

    // Create new department
    const { data: newDepartment, error: createError } = await supabase
      .from('departments')
      .insert({
        name: name.trim(),
        company_id: profile.company_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating department:', createError);
      return NextResponse.json({ error: 'Failed to create department' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      department: newDepartment,
    });
  } catch (error) {
    console.error('Error in create department API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

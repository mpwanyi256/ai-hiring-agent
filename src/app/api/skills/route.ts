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

    // Fetch skills (global + company-specific)
    let query = supabase
      .from('skills_view')
      .select('*')
      .or(`company_id.is.null,company_id.eq.${profile.company_id}`)
      .order('name');

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: skills, error } = await query;

    if (error) {
      console.error('Error fetching skills:', error);
      return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      skills: skills || [],
    });
  } catch (error) {
    console.error('Error in skills API:', error);
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
    const { name, description, categoryId } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }

    // Check if skill already exists for this company
    const { data: existingSkill, error: checkError } = await supabase
      .from('skills')
      .select('id')
      .eq('name', name.trim())
      .eq('company_id', profile.company_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing skill:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingSkill) {
      return NextResponse.json({ error: 'Skill already exists for your company' }, { status: 409 });
    }

    // Create new skill
    const { data: newSkill, error: createError } = await supabase
      .from('skills')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        category_id: categoryId || null,
        company_id: profile.company_id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating skill:', createError);
      return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      skill: newSkill,
    });
  } catch (error) {
    console.error('Error in create skill API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

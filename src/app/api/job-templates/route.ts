import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's job templates
    const { data: templates, error } = await supabase
      .from('job_templates')
      .select('id, name, title, fields, interview_format, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching job templates:', error);
      return NextResponse.json({ error: 'Failed to fetch job templates' }, { status: 500 });
    }

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Job templates API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, title, fields, interviewFormat } = body;

    // Validate required fields
    if (!name || !title) {
      return NextResponse.json({ error: 'Name and title are required' }, { status: 400 });
    }

    // Create job template
    const { data: template, error } = await supabase
      .from('job_templates')
      .insert({
        user_id: user.id,
        name,
        title,
        fields,
        interview_format: interviewFormat || 'text',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job template:', error);
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'A template with this name already exists' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Failed to create job template' }, { status: 500 });
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Job templates POST API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
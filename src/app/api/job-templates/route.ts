import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    // Fetch job templates for the authenticated user
    const { data: templates, error } = await supabase
      .from('job_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    // Transform templates to match expected format
    const formattedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      title: template.title,
      fields: template.fields,
      interview_format: template.interview_format,
      is_active: template.is_active,
      created_at: template.created_at,
      updated_at: template.updated_at,
    }));

    return NextResponse.json({
      success: true,
      templates: formattedTemplates,
    });
  } catch (error) {
    console.error('Error fetching job templates:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch job templates',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, title, fields, interviewFormat } = body;

    // Validate required fields
    if (!name || !title) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template name and title are required',
        },
        { status: 400 }
      );
    }

    // Create new job template
    const { data: template, error } = await supabase
      .from('job_templates')
      .insert({
        user_id: user.id,
        name,
        title,
        fields: fields || {},
        interview_format: interviewFormat || 'text',
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          {
            success: false,
            error: 'A template with this name already exists',
          },
          { status: 409 }
        );
      }
      throw new Error(error.message);
    }

    // Transform template to match expected format
    const formattedTemplate = {
      id: template.id,
      name: template.name,
      title: template.title,
      fields: template.fields,
      interview_format: template.interview_format,
      is_active: template.is_active,
      created_at: template.created_at,
      updated_at: template.updated_at,
    };

    console.log('Created job template:', {
      id: template.id,
      name: template.name,
      title: template.title,
      user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      template: formattedTemplate,
    });
  } catch (error) {
    console.error('Error creating job template:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create job template',
      },
      { status: 500 }
    );
  }
} 
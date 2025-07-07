import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Await params before accessing properties (Next.js 15 requirement)
    const { id: candidateId } = await params;
    
    // Get current user profile
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile not found' 
      }, { status: 404 });
    }

    const profileId = profile.id;

    // Use the secure database function to get resume URL with access control
    const { data: resumeData, error: resumeError } = await supabase
      .rpc('get_candidate_resume_url', {
        p_candidate_id: candidateId,
        p_profile_id: profileId
      });

    if (resumeError) {
      console.error('Resume access error:', resumeError);
      if (resumeError.message.includes('Access denied')) {
        return NextResponse.json({ 
          success: false, 
          error: 'Access denied: candidate not found or not owned by you' 
        }, { status: 403 });
      }
      throw new Error(resumeError.message);
    }

    const resume = resumeData?.[0];
    
    if (!resume) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      resume: {
        id: resume.resume_id,
        filename: resume.original_filename,
        publicUrl: resume.public_url,
        fileSize: resume.file_size,
        fileType: resume.file_type,
      }
    });

  } catch (error) {
    console.error('Error fetching candidate resume:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch candidate resume'
    }, { status: 500 });
  }
} 
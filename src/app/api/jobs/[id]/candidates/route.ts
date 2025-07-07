import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define the candidate type from database function (updated with resume fields)
interface CandidateFromDB {
  id: string;
  job_id: string;
  interview_token: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  current_step: number;
  total_steps: number;
  is_completed: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  progress_percentage: number;
  status: string;
  response_count: number;
  job_title: string;
  job_status: string;
  profile_id: string;
  job_fields: any;
  evaluation_id: string | null;
  score: number | null;
  recommendation: string | null;
  summary: string | null;
  strengths: string[] | null;
  red_flags: string[] | null;
  skills_assessment: any;
  traits_assessment: any;
  evaluation_created_at: string | null;
  // Resume fields
  resume_id: string | null;
  resume_filename: string | null;
  resume_file_path: string | null;
  resume_public_url: string | null;
  resume_file_size: number | null;
  resume_file_type: string | null;
  resume_word_count: number | null;
  resume_parsing_status: string | null;
  resume_parsing_error: string | null;
  resume_uploaded_at: string | null;
  // Resume evaluation fields
  resume_score: number | null;
  resume_summary: string | null;
  evaluation_type: string | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    
    // Await params before accessing properties (Next.js 15 requirement)
    const { id: jobId } = await params;
    const searchParams = request.nextUrl.searchParams;
    
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
    
    // Get query parameters
    const search = searchParams.get('search') || null;
    const status = searchParams.get('status') || null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Verify job ownership
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, profile_id')
      .eq('id', jobId)
      .eq('profile_id', profileId)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job not found or access denied' 
      }, { status: 404 });
    }

    // Get candidate details using the database function (now includes resume data)
    const { data: candidates, error: candidatesError } = await supabase
      .rpc('get_job_candidate_details', {
        p_job_id: jobId,
        p_profile_id: profileId,
        p_search: search,
        p_status: status,
        p_limit: limit,
        p_offset: offset
      });

    if (candidatesError) {
      console.error('Candidates error:', candidatesError);
      throw new Error(candidatesError.message);
    }

    // Get candidate statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_job_candidate_stats', {
        p_job_id: jobId,
        p_profile_id: profileId
      });

    if (statsError) {
      console.error('Stats error:', statsError);
      throw new Error(statsError.message);
    }

    const statsData = stats?.[0] || {
      total_candidates: 0,
      completed_candidates: 0,
      in_progress_candidates: 0,
      pending_candidates: 0,
      average_score: 0
    };

    // Format the response data with resume information
    const formattedCandidates = (candidates || []).map((candidate: any) => ({
      id: candidate.id,
      jobId: candidate.job_id,
      jobTitle: candidate.job_title,
      jobStatus: candidate.job_status,
      interviewToken: candidate.interview_token,
      email: candidate.email,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      name: candidate.full_name,
      currentStep: candidate.current_step,
      totalSteps: candidate.total_steps,
      isCompleted: candidate.is_completed,
      progress: Math.round(candidate.progress_percentage || 0),
      responses: candidate.response_count || 0,
      status: candidate.status,
      submittedAt: candidate.submitted_at,
      createdAt: candidate.created_at,
      updatedAt: candidate.updated_at,
      evaluation: candidate.evaluation_id ? {
        id: candidate.evaluation_id,
        score: candidate.score || 0,
        recommendation: candidate.recommendation,
        summary: candidate.summary,
        strengths: candidate.strengths || [],
        redFlags: candidate.red_flags || [],
        skillsAssessment: candidate.skills_assessment,
        traitsAssessment: candidate.traits_assessment,
        createdAt: candidate.evaluation_created_at,
        resumeScore: candidate.resume_score,
        resumeSummary: candidate.resume_summary,
        evaluationType: candidate.evaluation_type,
      } : null,
      resume: candidate.resume_id ? {
        id: candidate.resume_id,
        filename: candidate.resume_filename,
        filePath: candidate.resume_file_path,
        publicUrl: candidate.resume_public_url,
        fileSize: candidate.resume_file_size,
        fileType: candidate.resume_file_type,
        wordCount: candidate.resume_word_count,
        parsingStatus: candidate.resume_parsing_status,
        parsingError: candidate.resume_parsing_error,
        uploadedAt: candidate.resume_uploaded_at,
      } : null,
    }));

    const totalCandidates = parseInt(statsData.total_candidates?.toString() || '0');
    const totalPages = Math.ceil(totalCandidates / limit);

    return NextResponse.json({
      success: true,
      candidates: formattedCandidates,
      stats: {
        total: totalCandidates,
        completed: parseInt(statsData.completed_candidates?.toString() || '0'),
        inProgress: parseInt(statsData.in_progress_candidates?.toString() || '0'),
        pending: parseInt(statsData.pending_candidates?.toString() || '0'),
        averageScore: Math.round(parseFloat(statsData.average_score?.toString() || '0')),
      },
      pagination: {
        page,
        limit,
        total: totalCandidates,
        totalPages,
        hasMore: page < totalPages,
      },
      job: {
        id: job.id,
        title: job.title,
      }
    });

  } catch (error) {
    console.error('Error fetching job candidates:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to fetch job candidates'
    }, { status: 500 });
  }
} 
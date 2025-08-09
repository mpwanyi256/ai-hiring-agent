import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; candidateId: string }> },
) {
  try {
    const supabase = await createClient();
    const { id: jobId, candidateId } = await params;

    // Ensure job exists and is accessible (RLS enforced)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id')
      .eq('id', jobId)
      .single();

    if (jobError) {
      const status = jobError.code === 'PGRST116' ? 404 : jobError.code === '42501' ? 403 : 500;
      return NextResponse.json({ success: false, error: 'Job access denied' }, { status });
    }

    // Fetch full candidate row from view via function
    const { data, error } = await supabase.rpc('get_candidate_details_by_id', {
      p_candidate_id: candidateId,
    });

    let row = (data || [])[0];
    if (error && error.code === 'PGRST202') {
      // Fallback to view
      const { data: vrows, error: vErr } = await supabase
        .from('candidate_details')
        .select('*')
        .eq('id', candidateId)
        .single();
      if (vErr) {
        const status = vErr.code === 'PGRST116' ? 404 : vErr.code === '42501' ? 403 : 500;
        return NextResponse.json(
          { success: false, error: 'Failed to fetch candidate' },
          { status },
        );
      }
      row = vrows as any;
    } else if (error) {
      const status = error.code === 'PGRST116' ? 404 : error.code === '42501' ? 403 : 500;
      return NextResponse.json({ success: false, error: 'Failed to fetch candidate' }, { status });
    }

    if (!row) {
      return NextResponse.json({ success: false, error: 'Candidate not found' }, { status: 404 });
    }

    const candidate = {
      id: row.id,
      jobId: row.job_id,
      jobTitle: row.job_title,
      jobStatus: row.job_status,
      interviewToken: row.interview_token,
      candidateInfoId: row.candidate_info_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      name: row.full_name,
      currentStep: row.current_step,
      totalSteps: row.total_steps,
      isCompleted: row.is_completed,
      progress: row.progress_percentage,
      responses: row.response_count || 0,
      status: row.status,
      submittedAt: row.submitted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      candidateStatus: row.candidate_status,
      evaluation: row.evaluation_id
        ? {
            id: row.evaluation_id,
            score: row.score || 0,
            recommendation: row.recommendation || '',
            summary: row.summary || '',
            strengths: row.strengths || [],
            redFlags: row.red_flags || [],
            skillsAssessment: row.skills_assessment || {},
            traitsAssessment: row.traits_assessment || {
              skills: 0,
              culture: 0,
              team_work: 0,
              communication: 0,
              growth_mindset: 0,
            },
            createdAt: row.evaluation_created_at,
            resumeScore: row.resume_score || 0,
            resumeSummary: row.resume_summary || '',
            evaluationType: row.evaluation_type || 'manual',
          }
        : null,
      resume: row.resume_id
        ? {
            id: row.resume_id,
            filename: row.resume_filename,
            filePath: row.resume_file_path,
            publicUrl: row.resume_public_url,
            fileSize: row.resume_file_size || 0,
            fileType: row.resume_file_type,
            wordCount: row.resume_word_count || 0,
            parsingStatus: row.resume_parsing_status || 'pending',
            parsingError: row.resume_parsing_error,
            uploadedAt: row.resume_uploaded_at,
          }
        : null,
    };

    return NextResponse.json({ success: true, candidate });
  } catch (error) {
    console.error('Error fetching candidate details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch candidate' },
      { status: 500 },
    );
  }
}

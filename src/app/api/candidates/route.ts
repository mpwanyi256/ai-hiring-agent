import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jobsService } from '@/lib/services/jobsService';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    
    const profileId = searchParams.get('profileId');
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status'); // 'completed', 'in_progress', 'all'
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Advanced filters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    const recommendation = searchParams.get('recommendation');
    const candidateStatus = searchParams.get('candidateStatus'); // New filter for candidate_status
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!profileId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Profile ID is required' 
      }, { status: 400 });
    }

    // Build the query using candidate_details view
    let query = supabase
      .from('candidate_details')
      .select('*')
      .eq('profile_id', profileId);

    // Apply filters
    if (jobId) {
      query = query.eq('job_id', jobId);
    }

    if (status === 'completed') {
      query = query.eq('is_completed', true);
    } else if (status === 'in_progress') {
      query = query.eq('is_completed', false);
    }

    if (candidateStatus && candidateStatus !== 'all') {
      query = query.eq('candidate_status', candidateStatus);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Date range filter
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate + 'T23:59:59');
    }

    // Apply sorting
    if (sortBy === 'score') {
      query = query.order('score', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'full_name') {
      query = query.order('full_name', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'completion_percentage') {
      query = query.order('progress_percentage', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'candidate_status') {
      query = query.order('candidate_status', { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('candidate_details')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId);

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: candidates, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    // Format the response data to match the expected interface
    const formattedCandidates = candidates?.map(candidate => ({
      id: candidate.id,
      jobId: candidate.job_id,
      jobTitle: candidate.job_title || 'Unknown Job',
      jobStatus: candidate.job_status || 'unknown',
      interviewToken: candidate.interview_token,
      email: candidate.email,
      firstName: candidate.first_name,
      lastName: candidate.last_name,
      fullName: candidate.full_name,
      currentStep: candidate.current_step,
      totalSteps: candidate.total_steps,
      isCompleted: candidate.is_completed,
      completionPercentage: candidate.progress_percentage || 0,
      responseCount: candidate.response_count || 0,
      submittedAt: candidate.submitted_at,
      createdAt: candidate.created_at,
      status: candidate.candidate_status || 'under_review',
      evaluation: candidate.evaluation_id ? {
        id: candidate.evaluation_id,
        score: candidate.score,
        recommendation: candidate.recommendation,
        summary: candidate.summary,
        strengths: candidate.strengths || [],
        redFlags: candidate.red_flags || [],
        createdAt: candidate.evaluation_created_at,
      } : null,
    })) || [];

    // Apply score and recommendation filters after formatting
    let filteredCandidates = formattedCandidates;
    
    if (minScore || maxScore || recommendation) {
      filteredCandidates = formattedCandidates.filter(candidate => {
        if (minScore && candidate.evaluation?.score < parseInt(minScore)) {
          return false;
        }
        if (maxScore && candidate.evaluation?.score > parseInt(maxScore)) {
          return false;
        }
        if (recommendation && recommendation !== 'all' && candidate.evaluation?.recommendation !== recommendation) {
          return false;
        }
        return true;
      });
    }

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      candidates: filteredCandidates,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasMore: page < totalPages,
      },
      stats: {
        total: count || 0,
        completed: formattedCandidates.filter(c => c.isCompleted).length,
        inProgress: formattedCandidates.filter(c => !c.isCompleted).length,
        averageScore: formattedCandidates
          .filter(c => c.evaluation?.score)
          .reduce((sum, c, _, arr) => sum + (c.evaluation?.score || 0) / arr.length, 0) || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch candidates' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { jobToken, email, firstName, lastName } = await request.json();

    if (!jobToken || !email || !firstName || !lastName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job token, email, first name, and last name are required' 
      }, { status: 400 });
    }

    // Get job data
    const job = await jobsService.getJobByInterviewToken(jobToken);
    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid interview link' 
      }, { status: 404 });
    }

    const supabase = await createClient();

    // Generate a unique interview token for this candidate
    const interviewToken = uuidv4();

    // Use the new function to create candidate info and record
    const { data: candidateResult, error: candidateError } = await supabase
      .rpc('create_candidate_info_and_record', {
        p_first_name: firstName,
        p_last_name: lastName, 
        p_email: email,
        p_job_id: job.id,
        p_interview_token: interviewToken
      });

    if (candidateError) {
      console.error('Error creating candidate:', candidateError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to create candidate account' 
      }, { status: 500 });
    }

    // Get the candidate details with candidate info
    const { data: candidateDetails, error: detailsError } = await supabase
      .rpc('get_candidate_with_info', {
        p_candidate_id: candidateResult.candidate_id
      });

    console.log('Candidate details', candidateDetails)

    if (detailsError || !candidateDetails.success) {
      console.error('Error getting candidate details:', detailsError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to get candidate details' 
      }, { status: 500 });
    }

    const candidate = candidateDetails.candidate;

    return NextResponse.json({
      success: true,
      data: {
        id: candidate.id,
        jobId: candidate.job_id,
        candidateInfoId: candidate.candidate_info_id,
        interviewToken: candidate.interview_token,
        email: candidate.email,
        firstName: candidate.first_name,
        full_name: candidate.full_name,
        lastName: candidate.last_name,
        currentStep: candidate.current_step,
        totalSteps: candidate.total_steps,
        isCompleted: candidate.is_completed,
        submittedAt: candidate.submitted_at,
        createdAt: candidate.created_at,
        updatedAt: candidate.updated_at
      }
    });

  } catch (error) {
    console.error('Error creating candidate:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create candidate account' 
    }, { status: 500 });
  }
} 
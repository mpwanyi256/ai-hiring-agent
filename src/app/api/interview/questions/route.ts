import { NextResponse } from 'next/server';
import { questionService } from '@/lib/services/questionService';
import { jobsService } from '@/lib/services/jobsService';

// GET /api/interview/questions - Get questions for an interview by job token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobToken = searchParams.get('jobToken');

    if (!jobToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Job token is required',
        },
        { status: 400 },
      );
    }

    // Get job by interview token
    const job = await jobsService.getJobByInterviewToken(jobToken);
    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid interview link',
        },
        { status: 404 },
      );
    }

    // Get questions for the job
    const questions = await questionService.getQuestionsForJob(job.id);

    if (!questions || questions.length === 0) {
      // For candidates accessing via interview token, don't auto-generate questions
      // Questions should be created by job creators in the dashboard first
      console.log(`No questions found for job ${job.id} - interview not ready for candidates`);

      return NextResponse.json(
        {
          success: false,
          error:
            'This interview is not ready yet. The employer needs to set up interview questions first.',
          code: 'INTERVIEW_NOT_READY',
        },
        { status: 404 },
      );
    }

    // Sort questions by order index
    const sortedQuestions = questions.sort((a, b) => a.orderIndex - b.orderIndex);

    return NextResponse.json({
      success: true,
      questions: sortedQuestions,
      job: {
        id: job.id,
        title: job.title,
        interviewFormat: job.interviewFormat,
      },
      generated: false,
    });
  } catch (error) {
    console.error('Error fetching interview questions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch interview questions',
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from 'next/server';
import { questionService } from '@/lib/services/questionService';
import { jobsService } from '@/lib/services/jobsService';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/jobs/[id]/questions - Get questions for a job
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    // Verify job exists and user has access
    const job = await jobsService.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job not found' 
      }, { status: 404 });
    }

    const questions = await questionService.getQuestionsForJob(jobId);
    const stats = await questionService.getQuestionStats(jobId);

    return NextResponse.json({
      success: true,
      questions,
      stats,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch questions' 
    }, { status: 500 });
  }
}

// POST /api/jobs/[id]/questions - Generate and save questions for a job OR add manual question
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;
    
    // Handle optional request body
    let requestData: any = { type: 'generate', questionCount: 8, includeCustom: true, replaceExisting: false };
    try {
      const body = await request.text();
      if (body.trim()) {
        requestData = { ...requestData, ...JSON.parse(body) };
      }
    } catch {
      // Use defaults if no body or invalid JSON
      console.log('Using default question generation parameters');
    }
    
    const { 
      type = 'generate',
      questionCount = 8, 
      includeCustom = true, 
      replaceExisting = false,
      // Manual question fields
      questionText,
      questionType,
      category,
      expectedDuration,
      isRequired
    } = requestData;

    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    // Verify job exists and user has access
    const job = await jobsService.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job not found' 
      }, { status: 404 });
    }

    // Check if job is in draft state for manual operations
    if (type === 'manual' && job.status !== 'draft') {
      return NextResponse.json({ 
        success: false, 
        error: 'Cannot add questions to a job that is not in draft state' 
      }, { status: 400 });
    }

    if (type === 'manual') {
      // Add manual question
      if (!questionText || !questionType) {
        return NextResponse.json({ 
          success: false, 
          error: 'Question text and type are required for manual questions' 
        }, { status: 400 });
      }

      const savedQuestion = await questionService.addManualQuestion(jobId, {
        questionText,
        questionType,
        category,
        expectedDuration,
        isRequired
      });

      return NextResponse.json({
        success: true,
        question: savedQuestion,
        type: 'manual'
      });
    } else {
      // Generate AI questions (existing logic)
      // If replacing existing questions, delete them first
      if (replaceExisting) {
        await questionService.deleteAllQuestionsForJob(jobId);
      }

      // Generate questions
      const generationResponse = await questionService.generateQuestionsForJob({
        jobId,
        jobTitle: job.title,
        jobDescription: job.fields?.jobDescription,
        skills: job.fields?.skills,
        experienceLevel: job.fields?.experienceLevel,
        traits: job.fields?.traits,
        customFields: job.fields?.customFields,
        questionCount,
        includeCustom,
      });

      // Save questions to database
      const savedQuestions = await questionService.saveQuestionsForJob(
        jobId, 
        generationResponse.questions
      );

      return NextResponse.json({
        success: true,
        questions: savedQuestions,
        generation: generationResponse,
        type: 'generate'
      });
    }
  } catch (error) {
    console.error('Error processing questions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process questions' 
    }, { status: 500 });
  }
}

// DELETE /api/jobs/[id]/questions - Delete all questions for a job
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id: jobId } = await params;

    if (!jobId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job ID is required' 
      }, { status: 400 });
    }

    // Verify job exists and user has access
    const job = await jobsService.getJobById(jobId);
    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job not found' 
      }, { status: 404 });
    }

    await questionService.deleteAllQuestionsForJob(jobId);

    return NextResponse.json({
      success: true,
      message: 'All questions deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting questions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to delete questions' 
    }, { status: 500 });
  }
} 
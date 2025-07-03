import { NextResponse } from 'next/server';
import { questionService } from '@/lib/services/questionService';
import { jobsService } from '@/lib/services/jobsService';

// GET /api/interview/questions - Get questions for an interview by job token
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobToken = searchParams.get('jobToken');

    if (!jobToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Job token is required' 
      }, { status: 400 });
    }

    // Get job by interview token
    const job = await jobsService.getJobByInterviewToken(jobToken);
    if (!job) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid interview link' 
      }, { status: 404 });
    }

    // Get questions for the job
    const questions = await questionService.getQuestionsForJob(job.id);
    
    if (!questions || questions.length === 0) {
      // If no questions exist, generate them automatically
      console.log(`No questions found for job ${job.id}, generating default questions...`);
      
      const generationResponse = await questionService.generateQuestionsForJob({
        jobId: job.id,
        jobTitle: job.title,
        jobDescription: job.fields?.jobDescription,
        skills: job.fields?.skills,
        experienceLevel: job.fields?.experienceLevel,
        traits: job.fields?.traits,
        customFields: job.fields?.customFields,
        questionCount: 6, // Default count for interviews
        includeCustom: true,
      });

      // Save generated questions
      const savedQuestions = await questionService.saveQuestionsForJob(
        job.id, 
        generationResponse.questions
      );

      return NextResponse.json({
        success: true,
        questions: savedQuestions,
        job: {
          id: job.id,
          title: job.title,
          interviewFormat: job.interviewFormat
        },
        generated: true
      });
    }

    // Sort questions by order index
    const sortedQuestions = questions.sort((a, b) => a.orderIndex - b.orderIndex);

    return NextResponse.json({
      success: true,
      questions: sortedQuestions,
      job: {
        id: job.id,
        title: job.title,
        interviewFormat: job.interviewFormat
      },
      generated: false
    });
  } catch (error) {
    console.error('Error fetching interview questions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch interview questions' 
    }, { status: 500 });
  }
} 
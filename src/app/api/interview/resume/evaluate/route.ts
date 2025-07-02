import { NextResponse } from 'next/server';
import { resumeService } from '@/lib/services/resumeService';
import { jobsService } from '@/lib/services/jobsService';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;
    const jobToken = formData.get('jobToken') as string;
    // Note: candidate info is extracted but not used in current implementation
    // These could be used for future enhancements like personalized evaluation
    // const candidateEmail = formData.get('email') as string;
    // const candidateFirstName = formData.get('firstName') as string;
    // const candidateLastName = formData.get('lastName') as string;

    if (!resumeFile || !jobToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume file and job token are required' 
      }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(resumeFile.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Please upload PDF, DOC, DOCX, or TXT files only.' 
      }, { status: 400 });
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (resumeFile.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File size too large. Please upload files smaller than 5MB.' 
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

    // Parse resume content
    const resumeContent = await resumeService.parseResumeFile(resumeFile);
    
    // Evaluate resume against job requirements
    const evaluation = await resumeService.evaluateResume(
      resumeContent,
      resumeFile.name,
      job
    );

    return NextResponse.json({
      success: true,
      evaluation,
      job: {
        id: job.id,
        title: job.title,
        interviewToken: job.interviewToken
      }
    });
  } catch (error) {
    console.error('Error evaluating resume:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to evaluate resume' 
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { resumeService } from '@/lib/services/resumeService';
import { jobsService } from '@/lib/services/jobsService';
import { v4 as uuidv4 } from 'uuid';
import { ai } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;
    const jobToken = formData.get('jobToken') as string;
    const candidateEmail = formData.get('email') as string;
    const candidateFirstName = formData.get('firstName') as string;
    const candidateLastName = formData.get('lastName') as string;

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

    // Generate candidate ID for file organization
    const candidateId = uuidv4();

    // Parse resume content
    const resumeContent = await resumeService.parseResumeFile(resumeFile);
    
    // Upload resume to Supabase storage
    let resumeStorageInfo = null;
    try {
      resumeStorageInfo = await resumeService.uploadResumeToStorage(
        resumeFile,
        candidateId,
        job.id
      );
      console.log('Resume uploaded to storage:', resumeStorageInfo.path);
    } catch (storageError) {
      console.warn('Failed to upload resume to storage:', storageError);
      // Continue with evaluation even if storage fails
    }

    // Try enhanced OpenAI evaluation first, fall back to rule-based
    let evaluation;
    try {
      if (ai.openaiApiKey) {
        console.log('Using OpenAI for resume evaluation');
        const openAIResult = await resumeService.evaluateWithOpenAI(
          resumeContent,
          job.fields?.jobDescription || job.title,
          Array.isArray(job.fields?.skills) ? job.fields.skills : [],
          job.fields?.experienceLevel
        );

        // Convert OpenAI result to our evaluation format
        const experienceMatch: 'under' | 'match' | 'over' = 
          openAIResult.score >= 80 ? 'match' : 
          openAIResult.score >= 60 ? 'match' : 'under';

        evaluation = {
          score: openAIResult.score,
          summary: openAIResult.analysis,
          matchingSkills: openAIResult.strengths,
          missingSkills: openAIResult.weaknesses,
          experienceMatch,
          recommendation: openAIResult.score >= 60 ? 'proceed' : 'reject' as 'proceed' | 'reject',
          feedback: `AI Analysis: ${openAIResult.analysis}\n\nStrengths:\n${openAIResult.strengths.map(s => `• ${s}`).join('\n')}\n\nAreas for improvement:\n${openAIResult.weaknesses.map(w => `• ${w}`).join('\n')}`,
          passesThreshold: openAIResult.score >= 60
        };
      } else {
        throw new Error('OpenAI not configured, using rule-based evaluation');
      }
    } catch (aiError) {
      const errorMessage = aiError instanceof Error ? aiError.message : 'Unknown error';
      console.log('Using rule-based evaluation:', errorMessage);
      // Fall back to rule-based evaluation
      evaluation = await resumeService.evaluateResume(
        resumeContent,
        resumeFile.name,
        job
      );
    }

    // Save evaluation to database if candidate info is provided
    let savedEvaluation = null;
    if (candidateEmail && candidateFirstName && candidateLastName) {
      try {
        // Create a temporary profile ID for the evaluation
        // In a real implementation, you might want to create a candidate record first
        const tempProfileId = candidateId;
        
        savedEvaluation = await resumeService.saveResumeEvaluation(
          tempProfileId,
          job.id,
          resumeContent,
          resumeFile.name,
          evaluation
        );
        console.log('Resume evaluation saved to database');
      } catch (saveError) {
        console.warn('Failed to save evaluation to database:', saveError);
        // Continue without saving - the evaluation can still be used
      }
    }

    return NextResponse.json({
      success: true,
      evaluation,
      savedEvaluation,
      resumeStorage: resumeStorageInfo,
      candidateId,
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
import { NextResponse } from 'next/server';
import { resumeService } from '@/lib/services/resumeService';
import { jobsService } from '@/lib/services/jobsService';
import { documentParsingService } from '@/lib/services/documentParsingService';
import { ai } from '@/lib/constants';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const resumeFile = formData.get('resume') as File;
    const jobToken = formData.get('jobToken') as string;
    const candidateEmail = formData.get('email') as string;
    const candidateFirstName = formData.get('firstName') as string;
    const candidateLastName = formData.get('lastName') as string;
    const candidateId = formData.get('candidateId') as string;

    if (!resumeFile || !jobToken) {
      return NextResponse.json({ 
        success: false, 
        error: 'Resume file and job token are required' 
      }, { status: 400 });
    }

    // Validate file using document parsing service
    const validation = documentParsingService.validateFile(resumeFile);
    if (!validation.isValid) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error 
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

    console.log('Starting resume evaluation process...');

    // Parse resume content using enhanced document parsing
    let resumeContent: string;
    let parsedDoc: { text: string; metadata: { wordCount: number; fileType: string; fileName: string; fileSize: number; pages?: number } };
    try {
      parsedDoc = await documentParsingService.parseDocument(resumeFile);
      resumeContent = parsedDoc.text;
      console.log(`Successfully parsed ${parsedDoc.metadata.fileType.toUpperCase()} resume:`, {
        wordCount: parsedDoc.metadata.wordCount,
        textLength: resumeContent.length
      });
    } catch (parseError) {
      console.error('Failed to parse resume:', parseError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to parse resume: ${parseError instanceof Error ? parseError.message : 'Unknown error'}` 
      }, { status: 400 });
    }
    
    // Upload resume to Supabase storage
    let resumeStorageInfo = null;
    let resumeRecordId = null;
    try {
      resumeStorageInfo = await resumeService.uploadResumeToStorage(
        resumeFile,
        candidateId,
        job.id
      );
      
      // Save resume record to database
      resumeRecordId = await resumeService.saveResumeRecord(
        job.id,
        resumeFile,
        resumeStorageInfo,
        {
          wordCount: parsedDoc.metadata.wordCount,
          fileType: parsedDoc.metadata.fileType
        },
        candidateId
      );
      
      console.log('Resume uploaded and saved:', {
        path: resumeStorageInfo.path,
        recordId: resumeRecordId
      });
    } catch (storageError) {
      console.warn('Failed to upload/save resume:', storageError);
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
    if (candidateId && candidateEmail && candidateFirstName && candidateLastName) {
      try {
        // Use the new save API that properly handles candidate_id
        const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/evaluation/resume/save`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            candidateId,
            jobId: job.id,
            resumeContent,
            resumeFilename: resumeFile.name,
            evaluation
          }),
        });

        if (saveResponse.ok) {
          const saveResult = await saveResponse.json();
          savedEvaluation = saveResult.evaluation;
          console.log('Resume evaluation saved to database');
        } else {
          throw new Error('Failed to save evaluation');
        }
      } catch (saveError) {
        console.error('Failed to save evaluation to database:', saveError);
        // Return error info so frontend can handle it properly
        return NextResponse.json({
          success: false,
          error: 'System error occurred while processing your resume. Please try again.',
          errorType: 'database_error',
          evaluation, // Still return the evaluation that was computed
          resumeStorage: resumeStorageInfo,
          resumeRecordId,
          candidateId,
          job: {
            id: job.id,
            title: job.title,
            interviewToken: job.interviewToken
          }
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      evaluation,
      savedEvaluation,
      resumeStorage: resumeStorageInfo,
      resumeRecordId,
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
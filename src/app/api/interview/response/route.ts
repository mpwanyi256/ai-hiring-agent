import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/notification';

export async function POST(request: Request) {
  try {
    const { candidateId, questionId, question, answer, responseTime } = await request.json();

    if (!candidateId || !questionId || !question || !answer) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const supabase = await createClient();

    // For now, we'll use candidateId as profile_id since we're creating temp candidate records
    // In a full implementation, you'd want to create proper candidate profiles
    
    // Get job ID from question
    const { data: questionData, error: questionError } = await supabase
      .from('job_questions')
      .select('job_id')
      .eq('id', questionId)
      .single();

    if (questionError || !questionData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid question ID' 
      }, { status: 400 });
    }

    // Save response to the responses table
    const responseData = {
      // id: uuidv4(),
      candidate_id: candidateId, // Using candidateId as profile_id for now
      job_id: questionData.job_id,
      job_question_id: questionId,
      question: question,
      answer: answer,
      response_time: responseTime || 0,
      created_at: new Date().toISOString()
    };

    const { data: savedResponse, error: saveError } = await supabase
      .from('responses')
      .insert(responseData)
      .select()
      .single();

    if (saveError) {
      console.error('Error saving response:', saveError);
      apiError(saveError.message);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to save response' 
      }, { status: 500 });
    }

    // Update candidate progress
    try {
      // Get total number of questions for this job
      const { data: questionsCount, error: countError } = await supabase
        .from('job_questions')
        .select('id', { count: 'exact' })
        .eq('job_id', questionData.job_id);

      if (countError) {
        console.warn('Failed to get questions count:', countError);
      }

      // Get total responses from this candidate for this job
      const { data: responsesCount, error: responsesError } = await supabase
        .from('responses')
        .select('id', { count: 'exact' })
        .eq('candidate_id', candidateId)
        .eq('job_id', questionData.job_id);

      if (responsesError) {
        console.warn('Failed to get responses count:', responsesError);
      }

      const totalQuestions = questionsCount?.length || 0;
      const totalResponses = responsesCount?.length || 0;
      const currentStep = Math.min(totalResponses, totalQuestions);

      // Update candidate progress in the candidates table
      const { error: updateError } = await supabase
        .from('candidates')
        .update({
          current_step: currentStep,
          total_steps: totalQuestions,
          updated_at: new Date().toISOString()
        })
        .eq('id', candidateId);

      if (updateError) {
        console.warn('Failed to update candidate progress:', updateError);
        // Don't fail the response save if progress update fails
      }
    } catch (progressError) {
      console.warn('Error updating candidate progress:', progressError);
    }

    return NextResponse.json({
      success: true,
      response: {
        id: savedResponse.id,
        candidateId: savedResponse.candidate_id,
        jobId: savedResponse.job_id,
        jobQuestionId: savedResponse.job_question_id,
        question: savedResponse.question,
        answer: savedResponse.answer,
        responseTime: savedResponse.response_time,
        createdAt: savedResponse.created_at
      }
    });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to submit response' 
    }, { status: 500 });
  }
} 
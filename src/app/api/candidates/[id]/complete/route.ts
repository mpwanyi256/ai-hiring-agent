import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
// import { edgeFunctionsService } from '@/lib/services/edgeFunctionsService';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();

    // Await params before accessing properties (Next.js 15 requirement)
    const { id: candidateId } = await params;

    const { isCompleted, currentStep, totalSteps } = await request.json();

    // Update candidate progress
    const { data: candidate, error: updateError } = await supabase
      .from('candidates')
      .update({
        is_completed: isCompleted,
        current_step: currentStep,
        total_steps: totalSteps,
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', candidateId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating candidate:', updateError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update candidate progress',
        },
        { status: 500 },
      );
    }

    // Trigger the ai-candidate-evaluation background function
    // const response = await edgeFunctionsService.triggerAiCandidateEvaluation({
    //   candidateId: candidateInfo.id,
    //   jobId: candidateInfo.jobId,
    // });

    // console.log('Ai evaluation response', response);

    return NextResponse.json({
      success: true,
      candidate,
      message: 'Candidate progress updated successfully',
    });
  } catch (error) {
    console.error('Error completing candidate:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete candidate',
      },
      { status: 500 },
    );
  }
}

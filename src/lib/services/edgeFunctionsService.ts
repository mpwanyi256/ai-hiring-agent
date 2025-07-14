import { app } from '@/lib/constants';
import { AiCandidateEvaluationPayload, AiCandidateEvaluationResponse } from '@/types/edgeFunctions';
import { createClient } from '@/lib/supabase/server';

class EdgeFunctionsService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${app.projectRef}/functions/v1`;
  }

  private async triggerFunction<T>(
    functionName: string,
    payload: Record<string, string>,
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${app.anonKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  }

  /**
   * Trigger the ai-candidate-evaluation background function
   * @param payload - The payload for the function
   * @returns AiCandidateEvaluationResponse - The response from the function
   */
  async triggerAiCandidateEvaluation({ candidateId, jobId }: AiCandidateEvaluationPayload) {
    if (!candidateId || !jobId) {
      throw new Error('Candidate ID and job ID are required');
    }

    const supabase = await createClient();

    // Check if evaluation exists for this candidate
    const { data: evaluation, error: evaluationError } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (evaluationError) {
      console.error('Error checking for existing evaluation:', evaluationError);
    }

    if (evaluation) {
      return {
        success: true,
        message: 'Candidate evaluation already exists',
      };
    }

    return this.triggerFunction<AiCandidateEvaluationResponse>('ai-candidate-evaluation', {
      candidateId,
      jobId,
    });
  }
}

export const edgeFunctionsService = new EdgeFunctionsService();

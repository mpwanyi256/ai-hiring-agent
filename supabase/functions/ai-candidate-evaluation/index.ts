import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.3"

// Type declaration for EdgeRuntime (Supabase Edge Functions)
declare const EdgeRuntime: {
  waitUntil(promise: Promise<any>): void;
}

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Evaluation schema interface (simplified without Zod)
interface EvaluationResult {
  overall_score: number;
  overall_status: 'excellent' | 'good' | 'average' | 'poor' | 'very_poor';
  recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
  evaluation_summary: string;
  evaluation_explanation: string;
  radar_metrics: {
    skills: number;
    growth_mindset: number;
    team_work: number;
    culture: number;
    communication: number;
  };
  category_scores: Record<string, {
    score: number;
    explanation: string;
    strengths: string[];
    areas_for_improvement: string[];
  }>;
  key_strengths: string[];
  areas_for_improvement: string[];
  red_flags: string[];
}

// Direct OpenAI API call
async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR professional and hiring manager. You evaluate candidates based on their resume, interview responses, and job requirements to provide comprehensive assessments.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

// Parse AI response (similar to aiQuestionService.ts)
function parseAIResponse(response: string): EvaluationResult {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and clean the response
    return {
      overall_score: Math.max(0, Math.min(100, parsed.overall_score || 0)),
      overall_status: parsed.overall_status || 'average',
      recommendation: parsed.recommendation || 'maybe',
      evaluation_summary: parsed.evaluation_summary || 'No summary provided',
      evaluation_explanation: parsed.evaluation_explanation || 'No explanation provided',
      radar_metrics: {
        skills: Math.max(0, Math.min(100, parsed.radar_metrics?.skills || 50)),
        growth_mindset: Math.max(0, Math.min(100, parsed.radar_metrics?.growth_mindset || 50)),
        team_work: Math.max(0, Math.min(100, parsed.radar_metrics?.team_work || 50)),
        culture: Math.max(0, Math.min(100, parsed.radar_metrics?.culture || 50)),
        communication: Math.max(0, Math.min(100, parsed.radar_metrics?.communication || 50)),
      },
      category_scores: parsed.category_scores || {},
      key_strengths: Array.isArray(parsed.key_strengths) ? parsed.key_strengths : [],
      areas_for_improvement: Array.isArray(parsed.areas_for_improvement) ? parsed.areas_for_improvement : [],
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : []
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Failed to parse AI evaluation response');
  }
}

// Create evaluation prompt (simplified)
function createEvaluationPrompt(params: {
  jobTitle: string;
  jobFields: any;
  experienceLevel: string;
  interviewResponses: string;
  resumeUrl?: string;
  previousEvaluation?: any;
}): string {

  const requiredSkills = params.jobFields?.skills ? params.jobFields.skills.value.join(', ') : 'Not specified';
  const requiredTraits = params.jobFields?.traits ? params.jobFields.traits.value.join(', ') : 'Not specified';
  
  return `
Evaluate this candidate for the ${params.jobTitle} position and provide a comprehensive assessment.

**Job Information:**
- Position: ${params.jobTitle}
- Experience Level: ${params.experienceLevel}
- Required Skills: ${requiredSkills}
- Required Traits: ${requiredTraits}

**Candidate Data:**
${params.resumeUrl ? `Resume URL: ${params.resumeUrl}` : 'No resume available'}

**Previous Evaluation (if any):**
${params.previousEvaluation ? `
- Previous Score: ${params.previousEvaluation.score || 'N/A'}
- Previous Recommendation: ${params.previousEvaluation.recommendation || 'N/A'}
- Previous Summary: ${params.previousEvaluation.summary || 'N/A'}
` : 'No previous evaluation'}

**Interview Responses:**
${params.interviewResponses}

**Instructions:**
1. Score each area from 0-100 based on job requirements
2. Be objective and evidence-based
3. Highlight specific strengths and areas for improvement
4. Note any red flags or concerning patterns
5. Consider previous evaluation if available

**Response Format:**
Return ONLY a valid JSON object with this exact structure:
{
  "overall_score": 75,
  "overall_status": "good",
  "recommendation": "yes",
  "evaluation_summary": "Brief summary of the candidate's evaluation",
  "evaluation_explanation": "Detailed explanation of the evaluation reasoning",
  "radar_metrics": {
    "skills": 80,
    "growth_mindset": 75,
    "team_work": 70,
    "culture": 85,
    "communication": 75
  },
  "category_scores": {
    "Technical Skills": {
      "score": 80,
      "explanation": "Strong technical foundation",
      "strengths": ["Good problem solving", "Relevant experience"],
      "areas_for_improvement": ["Could improve in advanced topics"]
    }
  },
  "key_strengths": ["Strong communication", "Good technical skills", "Cultural fit"],
  "areas_for_improvement": ["Could improve technical depth", "More leadership experience needed"],
  "red_flags": []
}

Evaluate this candidate thoroughly and provide the JSON response.
`;
}

/**
 * Get the resume URL for a candidate for a specific job
 * @param candidateId - The ID of the candidate
 * @param jobId - The ID of the job
 * @returns The resume URL or null if not found
 * @deprecated - This function is not used anymore
 */
async function getResumeUrl(candidateId: string, jobId: string): Promise<string | null> {
  try {
    const { data: resumeData } = await supabase
      .from('candidate_resumes')
      .select('public_url')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .single()

    return resumeData?.public_url || null;
  } catch (error) {
    console.error('Error fetching resume URL:', error)
    return null;
  }
}

async function gatherCandidateData(candidateId: string, jobId: string) {
  try {
    // Get candidate details from the view (includes job info and previous evaluation)
    const { data: candidateDetails, error: candidateError } = await supabase
      .from('candidate_details')
      .select('*')
      .eq('id', candidateId)
      .eq('job_id', jobId)
      .single()

    if (candidateError) throw candidateError
    if (!candidateDetails) throw new Error('Candidate not found')

    // Get interview responses for the specific job
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('question, answer') // We might need the response_time later
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (responsesError) throw new Error('Failed to fetch interview responses')
      
    console.log('Found candidate details', candidateDetails)

    // Get previous evaluation data (if exists)
    const previousEvaluation = candidateDetails.evaluation_id ? {
      score: candidateDetails.score,
      recommendation: candidateDetails.recommendation,
      summary: candidateDetails.summary,
      strengths: candidateDetails.strengths,
      red_flags: candidateDetails.red_flags,
      skills_assessment: candidateDetails.skills_assessment,
      traits_assessment: candidateDetails.traits_assessment
    } : null;

    return {
      candidate: candidateDetails,
      job: {
        id: candidateDetails.job_id,
        title: candidateDetails.job_title,
        fields: candidateDetails.job_fields
      },
      responses: responses || [],
      resumeUrl: candidateDetails.resume_public_url,
      previousEvaluation
    }
  } catch (error) {
    console.error('Error gathering candidate data:', error)
    throw error
  }
}

// Background task function that performs the actual evaluation
async function performEvaluationInBackground(candidateId: string, jobId: string) {
  const startTime = Date.now()
  
  try {
    console.log(`Starting background evaluation for candidate ${candidateId} and job ${jobId}`)
    
    // Update function logs to show processing started
    await supabase
      .from('function_logs')
      .insert({
        function_name: 'ai_evaluation_background',
        status: 'processing',
        message: 'AI evaluation processing started',
        candidate_id: candidateId,
        job_id: jobId
      })

    const { job, responses, resumeUrl, previousEvaluation } = await gatherCandidateData(candidateId, jobId)

    const formattedResponses = responses
      .map((r: any, index: number) => `Q${index + 1}: ${r.question}\nA${index + 1}: ${r.answer}`)
      .join('\n\n')

    const experienceLevel = job.fields?.experienceLevel || 'Not specified'

    const prompt = createEvaluationPrompt({
      jobTitle: job.title,
      jobFields: job.fields,
      experienceLevel,
      interviewResponses: formattedResponses || 'No interview responses available',
      resumeUrl: resumeUrl || undefined,
      previousEvaluation
    })

    console.log(`Calling OpenAI API for candidate ${candidateId}`)
    const aiResponse = await callOpenAI(prompt)
    const evaluationResult = parseAIResponse(aiResponse)
    const processingDuration = Date.now() - startTime

    const evaluationSources = {
      resume: !!resumeUrl,
      interview: responses.length > 0,
      previous_evaluations: !!previousEvaluation
    }

    const candidateEvaluation = {
      overall_score: evaluationResult.overall_score,
      overall_status: evaluationResult.overall_status,
      recommendation: evaluationResult.recommendation,  
      evaluation_summary: evaluationResult.evaluation_summary,
      evaluation_explanation: evaluationResult.evaluation_explanation,
      radar_metrics: evaluationResult.radar_metrics,
      category_scores: evaluationResult.category_scores,
      key_strengths: evaluationResult.key_strengths,
      areas_for_improvement: evaluationResult.areas_for_improvement,
      red_flags: evaluationResult.red_flags,
      evaluation_sources: evaluationSources,
      processing_duration_ms: processingDuration,
      ai_model_version: 'gpt-4',
      evaluation_version: '1.0'
    }

    // Check if the candidate has already been evaluated for this specific job
    const { data: existingEvaluation } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('candidate_id', candidateId)
      .eq('job_id', jobId)
      .maybeSingle()
      
    if (existingEvaluation) {
      // Update the existing evaluation
      const { error: updateError } = await supabase
        .from('ai_evaluations')
        .update({
          ...candidateEvaluation
        })
        .eq('id', existingEvaluation.id);

      if (updateError) throw updateError

      console.log(`Updated existing evaluation for candidate ${candidateId}`)
    } else {
      // Create new evaluation
      const { error: saveError } = await supabase
        .from('ai_evaluations')
        .insert({
          candidate_id: candidateId,
          job_id: jobId,
          ...candidateEvaluation
        })

      if (saveError) throw saveError

      console.log(`Created new evaluation for candidate ${candidateId}`)
    }

    // Update evaluations table for backwards compatibility
    await supabase
      .from('evaluations')
      .upsert({
        candidate_id: candidateId,
        score: evaluationResult.overall_score,
        recommendation: evaluationResult.recommendation,
        summary: evaluationResult.evaluation_summary,
        strengths: evaluationResult.key_strengths,
        red_flags: evaluationResult.red_flags,
        skills_assessment: evaluationResult.category_scores,
        traits_assessment: evaluationResult.radar_metrics,
        feedback: evaluationResult.evaluation_explanation,
        evaluation_type: 'combined'
      })

    // Update function logs to show success
    await supabase
      .from('function_logs')
      .insert({
        function_name: 'ai_evaluation_background',
        status: 'success',
        message: `AI evaluation completed successfully in ${processingDuration}ms`,
        candidate_id: candidateId,
        job_id: jobId,
        payload: { processingDurationMs: processingDuration }
      })

    console.log(`Background evaluation completed successfully for candidate ${candidateId} in ${processingDuration}ms`)

  } catch (error: any) {
    console.error(`Error in background evaluation for candidate ${candidateId}:`, error)
    
    // Update function logs to show error
    await supabase
      .from('function_logs')
      .insert({
        function_name: 'ai_evaluation_background',
        status: 'failed',
        message: `AI evaluation failed: ${error?.message || 'Unknown error'}`,
        candidate_id: candidateId,
        job_id: jobId,
        error_message: error?.message || 'Unknown error'
      })
    
    throw error
  }
}

// Listen for function shutdown to handle cleanup
addEventListener('beforeunload', (ev) => {
  console.log('Function will be shutdown')
  // Could add cleanup logic here if needed
})

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateId, jobId } = await req.json()

    if (!candidateId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required parameter: candidateId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!jobId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required parameter: jobId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: candidate } = await supabase
      .from('candidates')
      .select('is_completed, job_id')
      .eq('id', candidateId)
      .eq('job_id', jobId)
      .maybeSingle()

    if (!candidate) {
      return new Response(JSON.stringify({ success: false, error: 'Candidate not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!candidate.is_completed) {
      return new Response(JSON.stringify({ success: false, error: 'Candidate interview not completed yet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify that the provided jobId matches the candidate's job_id (for security)
    if (candidate.job_id !== jobId) {
      return new Response(JSON.stringify({ success: false, error: 'Job ID does not match candidate\'s assigned job' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Disable this to enable retry for now: Check if evaluation already exists for this specific candidate-job combination
    // const { data: existingEvaluation } = await supabase
    //   .from('ai_evaluations')
    //   .select('id')
    //   .eq('candidate_id', candidateId)
    //   .eq('job_id', jobId)
    //   .maybeSingle()

    // if (existingEvaluation) {
    //   return new Response(JSON.stringify({ success: false, error: 'AI evaluation already exists for this candidate-job combination' }), {
    //     status: 409,
    //     headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    //   })
    // }

    // Log the trigger execution
    await supabase
      .from('function_logs')
      .insert({
        function_name: 'ai_evaluation_trigger',
        status: 'triggered',
        message: 'AI evaluation request received, starting background processing',
        candidate_id: candidateId,
        job_id: jobId
      })

    // Start the background evaluation task
    // This will not block the response and will continue running after the response is sent
    EdgeRuntime.waitUntil(performEvaluationInBackground(candidateId, jobId))

    // Immediately return success response
    return new Response(JSON.stringify({
      success: true,
      message: 'AI evaluation started in background',
      candidateId,
      jobId,
      status: 'processing'
    }), {
      status: 202, // Accepted
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error('Edge Function error:', error)
    return new Response(JSON.stringify({ success: false, error: error?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

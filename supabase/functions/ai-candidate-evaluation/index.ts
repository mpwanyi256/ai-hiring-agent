import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "npm:@supabase/supabase-js@2.39.3"

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
  jobDescription: string;
  requiredSkills: string;
  requiredTraits: string;
  experienceLevel: string;
  interviewResponses: string;
  resumeContent: string;
}): string {
  return `
Evaluate this candidate for the ${params.jobTitle} position and provide a comprehensive assessment.

**Job Information:**
- Position: ${params.jobTitle}
- Experience Level: ${params.experienceLevel}
- Required Skills: ${params.requiredSkills}
- Required Traits: ${params.requiredTraits}
- Job Description: ${params.jobDescription}

**Candidate Data:**
Resume Summary: ${params.resumeContent}

**Interview Responses:**
${params.interviewResponses}

**Instructions:**
1. Score each area from 0-100 based on job requirements
2. Be objective and evidence-based
3. Highlight specific strengths and areas for improvement
4. Note any red flags or concerning patterns

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

async function getResumeContent(candidateId: string): Promise<string> {
  try {
    const { data: resumeData } = await supabase
      .from('candidate_resumes')
      .select('*')
      .eq('candidate_id', candidateId)
      .single()

    if (!resumeData) return "No resume available"

    return `
Resume: ${resumeData.original_filename}
File Type: ${resumeData.file_type}
Word Count: ${resumeData.word_count || 'N/A'}
Upload Date: ${resumeData.created_at}
Parsing Status: ${resumeData.parsing_status}
`
  } catch (error) {
    console.error('Error fetching resume:', error)
    return "Resume data unavailable"
  }
}

async function gatherCandidateData(candidateId: string) {
  try {
    const { data: candidate, error: candidateError } = await supabase
      .from('candidates')
      .select(`
        *,
        jobs!inner(
          id,
          title,
          description,
          fields,
          profile_id
        )
      `)
      .eq('id', candidateId)
      .single()

    if (candidateError) throw candidateError
    if (!candidate) throw new Error('Candidate not found')

    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true })

    if (responsesError) throw responsesError

    const resumeContent = await getResumeContent(candidateId)

    return {
      candidate,
      job: candidate.jobs,
      responses: responses || [],
      resumeContent
    }
  } catch (error) {
    console.error('Error gathering candidate data:', error)
    throw error
  }
}

async function evaluateCandidate(candidateId: string) {
  const startTime = Date.now()

  try {
    const { candidate, job, responses, resumeContent } = await gatherCandidateData(candidateId)

    const formattedResponses = responses
      .map((r: any, index: number) => `Q${index + 1}: ${r.question}\nA${index + 1}: ${r.answer}`)
      .join('\n\n')

    const jobFields = job.fields || {}
    const requiredSkills = jobFields.skills ? jobFields.skills.join(', ') : 'Not specified'
    const requiredTraits = jobFields.traits ? jobFields.traits.join(', ') : 'Not specified'
    const experienceLevel = jobFields.experienceLevel || 'Not specified'

    const prompt = createEvaluationPrompt({
      jobTitle: job.title,
      jobDescription: job.description || 'No description provided',
      requiredSkills,
      requiredTraits,
      experienceLevel,
      interviewResponses: formattedResponses || 'No interview responses available',
      resumeContent
    })

    const aiResponse = await callOpenAI(prompt)
    const evaluationResult = parseAIResponse(aiResponse)
    const processingDuration = Date.now() - startTime

    const evaluationSources = {
      resume: !!candidate.resume_id,
      interview: responses.length > 0,
      previous_evaluations: false
    }

    const { data: aiEvaluation, error: saveError } = await supabase
      .from('ai_evaluations')
      .insert({
        candidate_id: candidateId,
        job_id: job.id,
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
      })
      .select()
      .single()

    if (saveError) throw saveError

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

    return {
      success: true,
      evaluation: aiEvaluation,
      processingDurationMs: processingDuration
    }

  } catch (error) {
    console.error('Error in AI evaluation:', error)
    throw error
  }
}

serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateId } = await req.json()

    if (!candidateId) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required parameter: candidateId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: existingEvaluation } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('candidate_id', candidateId)
      .single()

    if (existingEvaluation) {
      return new Response(JSON.stringify({ success: false, error: 'AI evaluation already exists for this candidate' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: candidate } = await supabase
      .from('candidates')
      .select('is_completed')
      .eq('id', candidateId)
      .single()

    if (!candidate?.is_completed) {
      return new Response(JSON.stringify({ success: false, error: 'Candidate interview not completed yet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await evaluateCandidate(candidateId)

    return new Response(JSON.stringify(result), {
      status: 200,
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

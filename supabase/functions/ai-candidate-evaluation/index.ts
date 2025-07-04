import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'npm:@supabase/supabase-js@^2'
import { ChatOpenAI } from "npm:@langchain/openai@^0.0.14"
import { PromptTemplate } from "npm:@langchain/core@^0.1.17/prompts"
import { StructuredOutputParser } from "npm:langchain@^0.1.25/output_parsers"
import { z } from "npm:zod@^3.22.4"

// Environment variables
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const openaiApiKey = Deno.env.get('OPENAI_API_KEY')!

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseServiceKey)
const llm = new ChatOpenAI({
  openAIApiKey: openaiApiKey,
  modelName: "gpt-4",
  temperature: 0.3,
})

// Zod schema for structured AI evaluation output
const evaluationSchema = z.object({
  overall_score: z.number().min(0).max(100).describe("Overall candidate score from 0-100"),
  overall_status: z.enum(['excellent', 'good', 'average', 'poor', 'very_poor']).describe("Overall status based on score"),
  recommendation: z.enum(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']).describe("Hiring recommendation"),
  evaluation_summary: z.string().describe("Brief summary of the candidate's evaluation"),
  evaluation_explanation: z.string().describe("Detailed explanation of the evaluation reasoning"),
  radar_metrics: z.object({
    skills: z.number().min(0).max(100).describe("Technical and job-relevant skills score"),
    growth_mindset: z.number().min(0).max(100).describe("Learning ability and adaptability score"),
    team_work: z.number().min(0).max(100).describe("Collaboration and teamwork score"),
    culture: z.number().min(0).max(100).describe("Cultural fit and values alignment score"),
    communication: z.number().min(0).max(100).describe("Communication and interpersonal skills score")
  }).describe("Radar chart metrics for key competencies"),
  category_scores: z.record(z.object({
    score: z.number().min(0).max(100),
    explanation: z.string(),
    strengths: z.array(z.string()),
    areas_for_improvement: z.array(z.string())
  })).describe("Detailed category breakdowns"),
  key_strengths: z.array(z.string()).describe("Top 3-5 key strengths of the candidate"),
  areas_for_improvement: z.array(z.string()).describe("Top 3-5 areas where candidate could improve"),
  red_flags: z.array(z.string()).describe("Any concerning issues or red flags")
})

// Create structured output parser
const parser = StructuredOutputParser.fromZodSchema(evaluationSchema)

// AI Evaluation prompt template
const evaluationPrompt = PromptTemplate.fromTemplate(`
You are an expert HR professional and hiring manager. You will evaluate a candidate based on their resume, interview responses, and job requirements to provide a comprehensive assessment.

**Job Information:**
Position: {job_title}
Experience Level: {experience_level}
Required Skills: {required_skills}
Required Traits: {required_traits}
Job Description: {job_description}

**Candidate Data:**
Resume Summary: {resume_summary}
Resume Skills: {resume_skills}
Resume Experience: {resume_experience}

**Interview Responses:**
{interview_responses}

**Evaluation Guidelines:**
1. Score each area from 0-100 based on job requirements
2. Consider both technical competency and cultural fit
3. Be objective and evidence-based in your assessment
4. Highlight specific strengths and areas for improvement
5. Note any red flags or concerning patterns

**Radar Metrics Definitions:**
- Skills: Technical competencies and job-relevant expertise
- Growth Mindset: Learning ability, adaptability, and continuous improvement
- Team Work: Collaboration, interpersonal skills, and team contribution
- Culture: Values alignment, work style fit, and company culture match
- Communication: Verbal/written communication, clarity, and professionalism

Evaluate this candidate thoroughly and provide a structured assessment.

{format_instructions}
`)

// Helper function to extract resume content
async function getResumeContent(candidateId: string): Promise<string> {
  try {
    const { data: resumeData } = await supabase
      .from('candidate_resumes')
      .select('*')
      .eq('candidate_id', candidateId)
      .single()

    if (!resumeData) return "No resume available"

    // In a real implementation, you'd parse the resume file content
    // For now, we'll use available metadata
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

// Helper function to gather candidate data
async function gatherCandidateData(candidateId: string) {
  try {
    // Get candidate details with job information
    const { data: candidate, error: candidateError } = await supabase
      .rpc('get_job_candidate_details', {
        p_job_id: null, // We'll filter by candidate_id in the view
        p_profile_id: null,
        p_search: null,
        p_status: null,
        p_limit: 1,
        p_offset: 0
      })

    if (candidateError) throw candidateError

    const candidateData = candidate?.find((c: any) => c.id === candidateId)
    if (!candidateData) throw new Error('Candidate not found')

    // Get interview responses
    const { data: responses, error: responsesError } = await supabase
      .from('responses')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: true })

    if (responsesError) throw responsesError

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', candidateData.job_id)
      .single()

    if (jobError) throw jobError

    // Get resume content
    const resumeContent = await getResumeContent(candidateId)

    return {
      candidate: candidateData,
      job,
      responses: responses || [],
      resumeContent
    }
  } catch (error) {
    console.error('Error gathering candidate data:', error)
    throw error
  }
}

// Main evaluation function
async function evaluateCandidate(candidateId: string, jobId: string, profileId: string) {
  const startTime = Date.now()

  try {
    // Gather all candidate data
    const { candidate, job, responses, resumeContent } = await gatherCandidateData(candidateId)

    // Format interview responses
    const formattedResponses = responses
      .map((r: any, index: number) => `Q${index + 1}: ${r.question}\nA${index + 1}: ${r.answer}`)
      .join('\n\n')

    // Extract job requirements
    const jobFields = job.fields || {}
    const requiredSkills = jobFields.skills ? jobFields.skills.join(', ') : 'Not specified'
    const requiredTraits = jobFields.traits ? jobFields.traits.join(', ') : 'Not specified'
    const experienceLevel = jobFields.experienceLevel || 'Not specified'

    // Create the evaluation prompt
    const formattedPrompt = await evaluationPrompt.format({
      job_title: job.title,
      experience_level: experienceLevel,
      required_skills: requiredSkills,
      required_traits: requiredTraits,
      job_description: job.description || 'No description provided',
      resume_summary: resumeContent,
      resume_skills: 'Extract from resume content',
      resume_experience: 'Extract from resume content',
      interview_responses: formattedResponses || 'No interview responses available',
      format_instructions: parser.getFormatInstructions()
    })

    // Get AI evaluation
    console.log('Generating AI evaluation for candidate:', candidateId)
    const response = await llm.invoke(formattedPrompt)
    const evaluationResult = await parser.parse(response.content as string)

    const processingDuration = Date.now() - startTime

    // Determine evaluation sources
    const evaluationSources = {
      resume: !!candidate.resume_id,
      interview: responses.length > 0,
      previous_evaluations: false
    }

    // Save AI evaluation to database
    const { data: aiEvaluation, error: saveError } = await supabase
      .from('ai_evaluations')
      .insert({
        candidate_id: candidateId,
        job_id: jobId,
        profile_id: profileId,
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

    // Update the existing evaluations table for backwards compatibility
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

    console.log('AI evaluation completed successfully for candidate:', candidateId)
    
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

// Main Edge Function handler
serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { candidateId, jobId, profileId } = await req.json()

    if (!candidateId || !jobId || !profileId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: candidateId, jobId, profileId' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if evaluation already exists
    const { data: existingEvaluation } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('candidate_id', candidateId)
      .single()

    if (existingEvaluation) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'AI evaluation already exists for this candidate' 
        }),
        { 
          status: 409, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify candidate is completed
    const { data: candidate } = await supabase
      .from('candidates')
      .select('is_completed')
      .eq('id', candidateId)
      .single()

    if (!candidate?.is_completed) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Candidate interview not completed yet' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Perform AI evaluation
    const result = await evaluateCandidate(candidateId, jobId, profileId)

    return new Response(
      JSON.stringify(result),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 
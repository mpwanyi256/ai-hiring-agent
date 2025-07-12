import { createClient } from '@/lib/supabase/server';
import { JobData } from '@/lib/services/jobsService';
import { documentParsingService } from '@/lib/services/documentParsingService';
import { ResumeEvaluation, InterviewEvaluation } from '@/types/interview';
import { ai } from '../constants';

// Note: Enhanced with OpenAI integration, Supabase storage, and advanced document parsing
class ResumeService {
  private readonly MINIMUM_SCORE_THRESHOLD = 60; // Candidates need 60% to proceed

  // Parse resume content from file using advanced document parsing
  async parseResumeFile(file: File): Promise<string> {
    try {
      return await documentParsingService.parseResume(file);
    } catch (error) {
      console.error('Error parsing resume file:', error);
      throw new Error(
        `Failed to parse resume file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // Evaluate resume against job requirements
  async evaluateResume(
    resumeContent: string,
    resumeFilename: string,
    job: JobData,
  ): Promise<ResumeEvaluation> {
    try {
      const evaluation = await this.performResumeAnalysis(resumeContent, job);

      // Determine if candidate passes the threshold
      const passesThreshold = evaluation.score >= this.MINIMUM_SCORE_THRESHOLD;

      return {
        ...evaluation,
        passesThreshold,
      };
    } catch (error) {
      console.error('Error evaluating resume:', error);
      throw new Error('Failed to evaluate resume');
    }
  }

  private async performResumeAnalysis(
    resumeContent: string,
    job: JobData,
  ): Promise<Omit<ResumeEvaluation, 'passesThreshold'>> {
    const resumeLower = resumeContent.toLowerCase();

    // Ensure skills is always an array
    const skills = Array.isArray(job.fields?.skills) ? job.fields.skills : [];
    const traits = Array.isArray(job.fields?.traits) ? job.fields.traits : [];

    // 1. Skills Analysis
    const skillsAnalysis = this.analyzeSkills(resumeLower, skills);

    // 2. Experience Level Analysis
    const experienceAnalysis = this.analyzeExperienceLevel(
      resumeLower,
      job.fields?.experienceLevel,
    );

    // 3. Traits Analysis
    const traitsAnalysis = this.analyzeTraits(resumeLower, traits);

    // 4. Job Description Match
    const jobDescriptionMatch = this.analyzeJobDescriptionMatch(
      resumeLower,
      job.fields?.jobDescription || '',
    );

    // 5. Calculate overall score
    const overallScore = this.calculateOverallScore({
      skillsScore: skillsAnalysis.score,
      experienceScore: experienceAnalysis.score,
      traitsScore: traitsAnalysis.score,
      jobMatchScore: jobDescriptionMatch.score,
    });

    // 6. Generate recommendation
    const recommendation = this.generateRecommendation(
      overallScore,
      skillsAnalysis,
      experienceAnalysis,
    );

    // 7. Create feedback summary
    const feedback = this.generateFeedback({
      score: overallScore,
      skillsAnalysis,
      experienceAnalysis,
      traitsAnalysis,
      jobDescriptionMatch,
    });

    return {
      score: overallScore,
      summary: this.generateSummary(overallScore, skillsAnalysis, experienceAnalysis),
      matchingSkills: skillsAnalysis.matchingSkills,
      missingSkills: skillsAnalysis.missingSkills,
      experienceMatch: experienceAnalysis.match,
      recommendation,
      feedback,
    };
  }

  private analyzeSkills(
    resumeContent: string,
    requiredSkills: string[],
  ): {
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
  } {
    // Ensure requiredSkills is a valid array
    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      return { score: 80, matchingSkills: [], missingSkills: [] };
    }

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach((skill) => {
      // Ensure skill is a string
      if (typeof skill !== 'string') return;

      const skillVariations = this.getSkillVariations(skill);
      const hasSkill = skillVariations.some((variation) =>
        resumeContent.includes(variation.toLowerCase()),
      );

      if (hasSkill) {
        matchingSkills.push(skill);
      } else {
        missingSkills.push(skill);
      }
    });

    const matchRatio = matchingSkills.length / requiredSkills.length;
    const score = Math.round(matchRatio * 100);

    return { score, matchingSkills, missingSkills };
  }

  private getSkillVariations(skill: string): string[] {
    const variations = [skill];

    // Add common variations
    const skillLower = skill.toLowerCase();

    // Programming languages
    if (skillLower.includes('javascript')) variations.push('js', 'node.js', 'nodejs');
    if (skillLower.includes('typescript')) variations.push('ts');
    if (skillLower.includes('python')) variations.push('py');
    if (skillLower.includes('react')) variations.push('reactjs', 'react.js');
    if (skillLower.includes('angular')) variations.push('angularjs');
    if (skillLower.includes('vue')) variations.push('vuejs', 'vue.js');

    // Frameworks and technologies
    if (skillLower.includes('next.js')) variations.push('nextjs', 'next');
    if (skillLower.includes('express')) variations.push('expressjs', 'express.js');
    if (skillLower.includes('mongodb')) variations.push('mongo');
    if (skillLower.includes('postgresql')) variations.push('postgres', 'psql');
    if (skillLower.includes('mysql')) variations.push('sql');

    return variations;
  }

  private analyzeExperienceLevel(
    resumeContent: string,
    requiredLevel?: string,
  ): {
    score: number;
    match: 'under' | 'match' | 'over';
  } {
    // Handle undefined, null, or empty string
    if (!requiredLevel || typeof requiredLevel !== 'string' || requiredLevel.trim() === '') {
      return { score: 70, match: 'match' };
    }

    const experienceIndicators = this.extractExperienceIndicators(resumeContent);
    const estimatedYears = this.estimateYearsOfExperience(experienceIndicators);

    const levelMap: Record<string, { min: number; max: number }> = {
      entry: { min: 0, max: 2 },
      mid: { min: 2, max: 5 },
      senior: { min: 5, max: 15 },
      lead: { min: 7, max: 20 },
      principal: { min: 10, max: 25 },
    };

    const targetRange = levelMap[requiredLevel.toLowerCase()] || levelMap['mid'];

    let match: 'under' | 'match' | 'over';
    let score: number;

    if (estimatedYears < targetRange.min) {
      match = 'under';
      score = Math.max(30, (estimatedYears / targetRange.min) * 70);
    } else if (estimatedYears > targetRange.max) {
      match = 'over';
      score = Math.max(60, 100 - (estimatedYears - targetRange.max) * 5);
    } else {
      match = 'match';
      score = 90;
    }

    return { score: Math.round(score), match };
  }

  private extractExperienceIndicators(resumeContent: string): string[] {
    const indicators: string[] = [];

    // Look for years of experience mentions
    const yearPatterns = [
      /(\d+)\+?\s*years?\s*of\s*experience/gi,
      /(\d+)\+?\s*years?\s*experience/gi,
      /experience:\s*(\d+)\+?\s*years?/gi,
    ];

    yearPatterns.forEach((pattern) => {
      const matches = resumeContent.match(pattern);
      if (matches) {
        indicators.push(...matches);
      }
    });

    return indicators;
  }

  private estimateYearsOfExperience(indicators: string[]): number {
    if (indicators.length === 0) {
      // Estimate based on content complexity and keywords
      return 3; // Default assumption
    }

    const years = indicators.map((indicator) => {
      const match = indicator.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });

    return Math.max(...years, 0);
  }

  private analyzeTraits(
    resumeContent: string,
    requiredTraits: string[],
  ): {
    score: number;
    foundTraits: string[];
  } {
    // Ensure requiredTraits is a valid array
    if (!Array.isArray(requiredTraits) || requiredTraits.length === 0) {
      return { score: 75, foundTraits: [] };
    }

    const foundTraits: string[] = [];
    const traitKeywords: Record<string, string[]> = {
      leadership: ['led', 'lead', 'managed', 'supervised', 'coordinated', 'directed', 'mentored'],
      teamwork: ['team', 'collaborated', 'cooperation', 'worked with', 'cross-functional'],
      communication: ['presented', 'communicated', 'wrote', 'documented', 'explained', 'training'],
      'problem-solving': [
        'solved',
        'resolved',
        'troubleshooting',
        'debugging',
        'analyzed',
        'optimized',
      ],
      creativity: ['created', 'designed', 'innovative', 'developed', 'built', 'invented'],
      adaptability: ['adapted', 'flexible', 'changed', 'learned', 'transitioned', 'diverse'],
      'attention-to-detail': ['accurate', 'precise', 'thorough', 'detailed', 'quality', 'testing'],
      'time-management': [
        'deadline',
        'scheduled',
        'prioritized',
        'organized',
        'efficient',
        'timely',
      ],
    };

    requiredTraits.forEach((trait) => {
      // Ensure trait is a string
      if (typeof trait !== 'string') return;

      const keywords = traitKeywords[trait.toLowerCase()] || [trait.toLowerCase()];
      const hasEvidence = keywords.some((keyword) => resumeContent.toLowerCase().includes(keyword));

      if (hasEvidence) {
        foundTraits.push(trait);
      }
    });

    const matchRatio = foundTraits.length / requiredTraits.length;
    const score = Math.round(matchRatio * 100);

    return { score, foundTraits };
  }

  private analyzeJobDescriptionMatch(
    resumeContent: string,
    jobDescription: string,
  ): {
    score: number;
    relevantKeywords: string[];
  } {
    // Handle empty or invalid job description
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim() === '') {
      return { score: 70, relevantKeywords: [] };
    }

    // Extract key terms from job description
    const jobKeywords = this.extractKeywords(jobDescription);
    const relevantKeywords: string[] = [];

    jobKeywords.forEach((keyword) => {
      if (resumeContent.toLowerCase().includes(keyword.toLowerCase())) {
        relevantKeywords.push(keyword);
      }
    });

    const matchRatio = relevantKeywords.length / Math.max(jobKeywords.length, 1);
    const score = Math.round(matchRatio * 100);

    return { score, relevantKeywords };
  }

  private extractKeywords(text: string): string[] {
    // Handle invalid input
    if (!text || typeof text !== 'string' || text.trim() === '') {
      return [];
    }

    // Simple keyword extraction - in a real implementation, you'd use NLP
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 3)
      .filter((word) => !this.isCommonWord(word));

    // Get unique words with frequency > 1
    const wordCounts: Record<string, number> = {};
    words.forEach((word) => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .filter(([, count]) => count > 1)
      .map(([word]) => word)
      .slice(0, 20); // Top 20 keywords
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the',
      'and',
      'for',
      'are',
      'with',
      'will',
      'this',
      'that',
      'from',
      'they',
      'have',
      'been',
      'were',
      'said',
      'each',
      'which',
      'their',
      'time',
      'work',
      'team',
      'role',
      'position',
      'company',
      'experience',
    ]);
    return commonWords.has(word);
  }

  private calculateOverallScore(scores: {
    skillsScore: number;
    experienceScore: number;
    traitsScore: number;
    jobMatchScore: number;
  }): number {
    // Weighted scoring
    const weights = {
      skills: 0.4, // 40% - most important
      experience: 0.3, // 30% - very important
      traits: 0.2, // 20% - important
      jobMatch: 0.1, // 10% - nice to have
    };

    const weightedScore =
      scores.skillsScore * weights.skills +
      scores.experienceScore * weights.experience +
      scores.traitsScore * weights.traits +
      scores.jobMatchScore * weights.jobMatch;

    return Math.round(weightedScore);
  }

  private generateRecommendation(
    score: number,
    skillsAnalysis: { score: number; matchingSkills: string[]; missingSkills: string[] },
    experienceAnalysis: { score: number; match: 'under' | 'match' | 'over' },
  ): 'proceed' | 'reject' {
    // Strong rejection criteria
    if (score < 40) return 'reject';
    if (skillsAnalysis.score < 30) return 'reject';
    if (experienceAnalysis.match === 'under' && experienceAnalysis.score < 40) return 'reject';

    // Proceed criteria
    if (score >= this.MINIMUM_SCORE_THRESHOLD) return 'proceed';

    return 'reject';
  }

  private generateSummary(
    score: number,
    skillsAnalysis: { matchingSkills: string[]; missingSkills: string[] },
    experienceAnalysis: { match: 'under' | 'match' | 'over' },
  ): string {
    const skillsMatch = skillsAnalysis.matchingSkills.length;
    const totalSkills = skillsAnalysis.matchingSkills.length + skillsAnalysis.missingSkills.length;

    return (
      `Resume evaluation complete. Overall match: ${score}/100. ` +
      `Skills: ${skillsMatch}/${totalSkills} required skills found. ` +
      `Experience level: ${experienceAnalysis.match}. ` +
      `${score >= this.MINIMUM_SCORE_THRESHOLD ? 'Candidate qualifies for interview.' : 'Candidate does not meet minimum requirements.'}`
    );
  }

  private generateFeedback(analysisData: {
    score: number;
    skillsAnalysis: { score: number; matchingSkills: string[]; missingSkills: string[] };
    experienceAnalysis: { score: number; match: 'under' | 'match' | 'over' };
    traitsAnalysis: { score: number; foundTraits: string[] };
    jobDescriptionMatch: { score: number; relevantKeywords: string[] };
  }): string {
    const { score, skillsAnalysis, experienceAnalysis, traitsAnalysis, jobDescriptionMatch } =
      analysisData;

    let feedback = `Overall Score: ${score}/100\n\n`;

    // Skills feedback
    feedback += `Skills Assessment (${skillsAnalysis.score}/100):\n`;
    if (skillsAnalysis.matchingSkills.length > 0) {
      feedback += `✓ Found: ${skillsAnalysis.matchingSkills.join(', ')}\n`;
    }
    if (skillsAnalysis.missingSkills.length > 0) {
      feedback += `✗ Missing: ${skillsAnalysis.missingSkills.join(', ')}\n`;
    }
    feedback += '\n';

    // Experience feedback
    feedback += `Experience Assessment (${experienceAnalysis.score}/100):\n`;
    feedback += `Experience level appears to be ${experienceAnalysis.match} the requirements.\n\n`;

    // Traits feedback
    if (traitsAnalysis.foundTraits.length > 0) {
      feedback += `Demonstrated Qualities:\n`;
      feedback += `✓ ${traitsAnalysis.foundTraits.join(', ')}\n\n`;
    }

    // Job description match feedback
    if (jobDescriptionMatch?.relevantKeywords?.length > 0) {
      feedback += `Relevant Experience:\n`;
      feedback += `✓ Found keywords: ${jobDescriptionMatch.relevantKeywords.slice(0, 5).join(', ')}\n\n`;
    }

    // Overall recommendation
    feedback += `Recommendation: ${
      score >= this.MINIMUM_SCORE_THRESHOLD
        ? 'Proceed to interview - candidate meets basic requirements.'
        : 'Does not meet minimum threshold for interview.'
    }`;

    return feedback;
  }

  // Save resume evaluation to database
  async saveResumeEvaluation(
    profileId: string | null, // Allow null for anonymous candidates
    jobId: string,
    resumeContent: string,
    resumeFilename: string,
    evaluation: ResumeEvaluation,
  ): Promise<InterviewEvaluation> {
    try {
      const supabase = await createClient();

      const evaluationData = {
        profile_id: profileId, // Will be null for anonymous candidates
        job_id: jobId,
        evaluation_type: 'resume',
        summary: evaluation.summary,
        score: 0, // Interview score will be 0 for resume-only evaluations
        resume_score: evaluation.score,
        resume_summary: evaluation.summary,
        resume_filename: resumeFilename,
        strengths: evaluation.matchingSkills,
        red_flags: evaluation.missingSkills,
        skills_assessment: {},
        traits_assessment: {},
        recommendation: this.mapRecommendation(evaluation.recommendation),
        feedback: evaluation.feedback,
      };

      const { data: savedEvaluation, error } = await supabase
        .from('evaluations')
        .insert(evaluationData)
        .select()
        .single();

      if (error) {
        console.error('Database error saving evaluation:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      return {
        id: savedEvaluation.id,
        profileId: savedEvaluation.profile_id,
        jobId: savedEvaluation.job_id,
        evaluationType: savedEvaluation.evaluation_type,
        summary: savedEvaluation.summary,
        score: savedEvaluation.score,
        resumeScore: savedEvaluation.resume_score,
        resumeSummary: savedEvaluation.resume_summary,
        resumeFilename: savedEvaluation.resume_filename,
        strengths: savedEvaluation.strengths,
        redFlags: savedEvaluation.red_flags,
        skillsAssessment: savedEvaluation.skills_assessment,
        traitsAssessment: savedEvaluation.traits_assessment,
        recommendation: savedEvaluation.recommendation,
        feedback: savedEvaluation.feedback,
        createdAt: savedEvaluation.created_at,
        updatedAt: savedEvaluation.updated_at,
      };
    } catch (error) {
      console.error('Error saving resume evaluation:', error);
      // Distinguish between different error types
      if (error instanceof Error) {
        if (
          error.message.includes('foreign key constraint') ||
          error.message.includes('violates row-level security')
        ) {
          throw new Error('Database configuration error - unable to save evaluation');
        }
        throw error;
      }
      throw new Error('Unknown error occurred while saving evaluation');
    }
  }

  private mapRecommendation(
    recommendation: 'proceed' | 'reject',
  ): 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no' {
    return recommendation === 'proceed' ? 'yes' : 'no';
  }

  // Get resume evaluation by profile and job
  async getResumeEvaluation(profileId: string, jobId: string): Promise<InterviewEvaluation | null> {
    try {
      const supabase = await createClient();

      const { data: evaluation, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('profile_id', profileId)
        .eq('job_id', jobId)
        .eq('evaluation_type', 'resume')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No evaluation found
        }
        throw new Error(error.message);
      }

      return {
        id: evaluation.id,
        profileId: evaluation.profile_id,
        jobId: evaluation.job_id,
        evaluationType: evaluation.evaluation_type,
        summary: evaluation.summary,
        score: evaluation.score,
        resumeScore: evaluation.resume_score,
        resumeSummary: evaluation.resume_summary,
        resumeFilename: evaluation.resume_filename,
        strengths: evaluation.strengths,
        redFlags: evaluation.red_flags,
        skillsAssessment: evaluation.skills_assessment,
        traitsAssessment: evaluation.traits_assessment,
        recommendation: evaluation.recommendation,
        feedback: evaluation.feedback,
        createdAt: evaluation.created_at,
        updatedAt: evaluation.updated_at,
      };
    } catch (error) {
      console.error('Error fetching resume evaluation:', error);
      throw error;
    }
  }

  // Upload resume to Supabase storage
  async uploadResumeToStorage(
    file: File,
    candidateId: string,
    jobId: string,
  ): Promise<{ path: string; publicUrl: string }> {
    try {
      const supabase = await createClient();

      // Generate unique file path
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'pdf';
      const fileName = `${candidateId}_${jobId}_${Date.now()}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      // Upload file to storage
      const { data, error } = await supabase.storage
        .from('candidate-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload resume: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('candidate-files').getPublicUrl(filePath);

      return {
        path: data.path,
        publicUrl,
      };
    } catch (error) {
      console.error('Error uploading resume to storage:', error);
      throw error;
    }
  }

  // Save resume record to candidate_resumes table
  async saveResumeRecord(
    jobId: string,
    file: File,
    storageInfo: { path: string; publicUrl: string },
    parsedDoc?: { wordCount: number; fileType: string },
    candidateId?: string,
  ): Promise<string> {
    try {
      const supabase = await createClient();

      const resumeData = {
        job_id: jobId,
        candidate_id: candidateId,
        original_filename: file.name,
        file_path: storageInfo.path,
        public_url: storageInfo.publicUrl,
        file_size: file.size,
        file_type: parsedDoc?.fileType || file.type,
        word_count: parsedDoc?.wordCount || null,
        parsing_status: 'success',
      };

      const { data: savedResume, error } = await supabase
        .from('candidate_resumes')
        .insert(resumeData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return savedResume.id;
    } catch (error) {
      console.error('Error saving resume record:', error);
      throw error;
    }
  }

  // Update resume parsing status
  async updateResumeParsingStatus(
    resumeId: string,
    status: 'pending' | 'success' | 'failed',
    error?: string,
  ): Promise<void> {
    try {
      const supabase = await createClient();

      const updateData: {
        parsing_status: 'pending' | 'success' | 'failed';
        parsing_error?: string;
        updated_at: string;
      } = {
        parsing_status: status,
        updated_at: new Date().toISOString(),
      };

      if (error) {
        updateData.parsing_error = error;
      }

      const { error: updateError } = await supabase
        .from('candidate_resumes')
        .update(updateData)
        .eq('id', resumeId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } catch (error) {
      console.error('Error updating resume parsing status:', error);
      throw error;
    }
  }

  // Enhanced OpenAI evaluation (optional integration)
  async evaluateWithOpenAI(
    resumeContent: string,
    jobDescription: string,
    skills: string[],
    experienceLevel?: string,
  ): Promise<{
    score: number;
    analysis: string;
    strengths: string[];
    weaknesses: string[];
  }> {
    try {
      // Check if OpenAI API key is configured
      if (!ai.openaiApiKey) {
        throw new Error('OpenAI API key not configured');
      }

      //       const prompt = `
      // You are an expert HR professional evaluating a candidate's resume. Please analyze the following resume against the job requirements and provide a detailed assessment.

      // JOB REQUIREMENTS:
      // - Position: ${jobDescription}
      // - Required Skills: ${skills.join(', ')}
      // - Experience Level: ${experienceLevel || 'Not specified'}

      // RESUME CONTENT:
      // ${resumeContent}

      // Please provide your evaluation as a JSON object with the following structure (no markdown formatting):
      // {
      //   "score": [0-100 integer],
      //   "analysis": "[detailed analysis of fit]",
      //   "strengths": ["strength1", "strength2", "strength3"],
      //   "weaknesses": ["weakness1", "weakness2", "weakness3"]
      // }
      // `;

      const prompt = `
You are an expert HR professional and resume evaluator. Your task is to determine if the content provided is a valid resume, and if so, evaluate how well the candidate’s experience and skills align with the specific job requirements.

Step 1: Resume Validation  
- Confirm that the document is a resume. If it lacks sections like Work Experience, Skills, Education, or Projects, score it as 0 and explain why.

Step 2: Resume Evaluation (if valid)  
- Evaluate the candidate **strictly in relation to the job role and requirements provided below**.
- Score based on how well the resume demonstrates:
  - Relevant technologies or skills listed
  - Job-aligned experience and responsibilities
  - Evidence of scope, complexity, and impact aligned with the role

Avoid commenting on formatting, resume aesthetics, or generic writing quality. Focus solely on job fit.

JOB DESCRIPTION:
${jobDescription}

RESUME CONTENT:
${resumeContent}

SKILLS:
${skills.join(', ')}

EXPERIENCE LEVEL:
${experienceLevel}

Respond in the following JSON format (no markdown):

{
  "score": [0-100],
  "analysis": "[Explain how well the candidate fits the job based on their experience, skills, and accomplishments]",
  "strengths": ["Strengths specifically related to the job post"],
  "weaknesses": ["Job-specific gaps or areas where the candidate falls short"]
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${ai.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: ai.model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert HR professional who evaluates candidate resumes objectively and thoroughly. Always respond with valid JSON only, no markdown formatting.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: ai.temperature,
          max_tokens: ai.maxTokens,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OpenAI API error details:', errorData);
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from OpenAI API');
      }

      let responseContent = data.choices[0].message.content.trim();

      // Remove markdown code block formatting if present
      if (responseContent.startsWith('```json')) {
        responseContent = responseContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (responseContent.startsWith('```')) {
        responseContent = responseContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      let evaluation;
      try {
        evaluation = JSON.parse(responseContent);
      } catch {
        console.error('Failed to parse OpenAI response as JSON:', responseContent);
        throw new Error('Invalid JSON response from OpenAI');
      }

      // Validate the response structure
      if (
        typeof evaluation.score !== 'number' ||
        !evaluation.analysis ||
        !Array.isArray(evaluation.strengths) ||
        !Array.isArray(evaluation.weaknesses)
      ) {
        throw new Error('Invalid evaluation structure from OpenAI');
      }

      return {
        score: Math.min(100, Math.max(0, Math.round(evaluation.score))),
        analysis: evaluation.analysis,
        strengths: evaluation.strengths || [],
        weaknesses: evaluation.weaknesses || [],
      };
    } catch (error) {
      console.error('Error with OpenAI evaluation:', error);
      // Fall back to rule-based evaluation
      throw error;
    }
  }
}

export const resumeService = new ResumeService();

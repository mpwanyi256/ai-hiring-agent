import { createClient } from '@/lib/supabase/server';
import { JobData } from './jobsService';
import {
  ResumeUpload,
  ResumeEvaluation,
  InterviewEvaluation
} from '@/types/interview';

// Note: In a real implementation, you would use OpenAI API and LangChain
// For now, we'll implement a comprehensive rule-based evaluation system

class ResumeService {
  private readonly MINIMUM_SCORE_THRESHOLD = 60; // Candidates need 60% to proceed

  // Parse resume content from file
  async parseResumeFile(file: File): Promise<string> {
    try {
      // For now, we'll assume text files or PDFs converted to text
      // In a real implementation, you'd use libraries like pdf-parse for PDFs
      const content = await file.text();
      return this.cleanResumeText(content);
    } catch (error) {
      console.error('Error parsing resume file:', error);
      throw new Error('Failed to parse resume file');
    }
  }

  private cleanResumeText(content: string): string {
    // Clean and normalize resume text
    return content
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Evaluate resume against job requirements
  async evaluateResume(
    resumeContent: string,
    resumeFilename: string,
    job: JobData
  ): Promise<ResumeEvaluation> {
    try {
      const evaluation = await this.performResumeAnalysis(resumeContent, job);
      
      // Determine if candidate passes the threshold
      const passesThreshold = evaluation.score >= this.MINIMUM_SCORE_THRESHOLD;
      
      return {
        ...evaluation,
        passesThreshold
      };
    } catch (error) {
      console.error('Error evaluating resume:', error);
      throw new Error('Failed to evaluate resume');
    }
  }

  private async performResumeAnalysis(
    resumeContent: string,
    job: JobData
  ): Promise<Omit<ResumeEvaluation, 'passesThreshold'>> {
    const resumeLower = resumeContent.toLowerCase();
    
    // 1. Skills Analysis
    const skillsAnalysis = this.analyzeSkills(resumeLower, job.fields?.skills || []);
    
    // 2. Experience Level Analysis
    const experienceAnalysis = this.analyzeExperienceLevel(resumeLower, job.fields?.experienceLevel);
    
    // 3. Traits Analysis
    const traitsAnalysis = this.analyzeTraits(resumeLower, job.fields?.traits || []);
    
    // 4. Job Description Match
    const jobDescriptionMatch = this.analyzeJobDescriptionMatch(resumeLower, job.fields?.jobDescription || '');
    
    // 5. Calculate overall score
    const overallScore = this.calculateOverallScore({
      skillsScore: skillsAnalysis.score,
      experienceScore: experienceAnalysis.score,
      traitsScore: traitsAnalysis.score,
      jobMatchScore: jobDescriptionMatch.score
    });

    // 6. Generate recommendation
    const recommendation = this.generateRecommendation(overallScore, skillsAnalysis, experienceAnalysis);
    
    // 7. Create feedback summary
    const feedback = this.generateFeedback({
      score: overallScore,
      skillsAnalysis,
      experienceAnalysis,
      traitsAnalysis,
      jobDescriptionMatch
    });

    return {
      score: overallScore,
      summary: this.generateSummary(overallScore, skillsAnalysis, experienceAnalysis),
      matchingSkills: skillsAnalysis.matchingSkills,
      missingSkills: skillsAnalysis.missingSkills,
      experienceMatch: experienceAnalysis.match,
      recommendation,
      feedback
    };
  }

  private analyzeSkills(resumeContent: string, requiredSkills: string[]): {
    score: number;
    matchingSkills: string[];
    missingSkills: string[];
  } {
    if (requiredSkills.length === 0) {
      return { score: 80, matchingSkills: [], missingSkills: [] };
    }

    const matchingSkills: string[] = [];
    const missingSkills: string[] = [];

    requiredSkills.forEach(skill => {
      const skillVariations = this.getSkillVariations(skill);
      const hasSkill = skillVariations.some(variation => 
        resumeContent.includes(variation.toLowerCase())
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

  private analyzeExperienceLevel(resumeContent: string, requiredLevel?: string): {
    score: number;
    match: 'under' | 'match' | 'over';
  } {
    if (!requiredLevel) {
      return { score: 70, match: 'match' };
    }

    const experienceIndicators = this.extractExperienceIndicators(resumeContent);
    const estimatedYears = this.estimateYearsOfExperience(experienceIndicators);

    const levelMap: Record<string, { min: number; max: number }> = {
      'entry': { min: 0, max: 2 },
      'mid': { min: 2, max: 5 },
      'senior': { min: 5, max: 15 },
      'lead': { min: 7, max: 20 },
      'principal': { min: 10, max: 25 }
    };

    const targetRange = levelMap[requiredLevel.toLowerCase()] || levelMap['mid'];
    
    let match: 'under' | 'match' | 'over';
    let score: number;

    if (estimatedYears < targetRange.min) {
      match = 'under';
      score = Math.max(30, (estimatedYears / targetRange.min) * 70);
    } else if (estimatedYears > targetRange.max) {
      match = 'over';
      score = Math.max(60, 100 - ((estimatedYears - targetRange.max) * 5));
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
      /experience:\s*(\d+)\+?\s*years?/gi
    ];

    yearPatterns.forEach(pattern => {
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

    const years = indicators.map(indicator => {
      const match = indicator.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    });

    return Math.max(...years, 0);
  }

  private analyzeTraits(resumeContent: string, requiredTraits: string[]): {
    score: number;
    foundTraits: string[];
  } {
    if (requiredTraits.length === 0) {
      return { score: 75, foundTraits: [] };
    }

    const foundTraits: string[] = [];
    const traitKeywords: Record<string, string[]> = {
      'leadership': ['led', 'lead', 'managed', 'supervised', 'coordinated', 'directed', 'mentored'],
      'teamwork': ['team', 'collaborated', 'cooperation', 'worked with', 'cross-functional'],
      'communication': ['presented', 'communicated', 'wrote', 'documented', 'explained', 'training'],
      'problem-solving': ['solved', 'resolved', 'troubleshooting', 'debugging', 'analyzed', 'optimized'],
      'creativity': ['created', 'designed', 'innovative', 'developed', 'built', 'invented'],
      'adaptability': ['adapted', 'flexible', 'changed', 'learned', 'transitioned', 'diverse'],
      'attention-to-detail': ['accurate', 'precise', 'thorough', 'detailed', 'quality', 'testing'],
      'time-management': ['deadline', 'scheduled', 'prioritized', 'organized', 'efficient', 'timely']
    };

    requiredTraits.forEach(trait => {
      const keywords = traitKeywords[trait.toLowerCase()] || [trait.toLowerCase()];
      const hasEvidence = keywords.some(keyword => 
        resumeContent.toLowerCase().includes(keyword)
      );
      
      if (hasEvidence) {
        foundTraits.push(trait);
      }
    });

    const matchRatio = foundTraits.length / requiredTraits.length;
    const score = Math.round(matchRatio * 100);

    return { score, foundTraits };
  }

  private analyzeJobDescriptionMatch(resumeContent: string, jobDescription: string): {
    score: number;
    relevantKeywords: string[];
  } {
    if (!jobDescription) {
      return { score: 70, relevantKeywords: [] };
    }

    // Extract key terms from job description
    const jobKeywords = this.extractKeywords(jobDescription);
    const relevantKeywords: string[] = [];

    jobKeywords.forEach(keyword => {
      if (resumeContent.toLowerCase().includes(keyword.toLowerCase())) {
        relevantKeywords.push(keyword);
      }
    });

    const matchRatio = relevantKeywords.length / Math.max(jobKeywords.length, 1);
    const score = Math.round(matchRatio * 100);

    return { score, relevantKeywords };
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in a real implementation, you'd use NLP
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isCommonWord(word));

    // Get unique words with frequency > 1
    const wordCounts: Record<string, number> = {};
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });

    return Object.entries(wordCounts)
      .filter(([_, count]) => count > 1)
      .map(([word, _]) => word)
      .slice(0, 20); // Top 20 keywords
  }

  private isCommonWord(word: string): boolean {
    const commonWords = new Set([
      'the', 'and', 'for', 'are', 'with', 'will', 'this', 'that', 'from',
      'they', 'have', 'been', 'were', 'said', 'each', 'which', 'their',
      'time', 'work', 'team', 'role', 'position', 'company', 'experience'
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
      skills: 0.4,      // 40% - most important
      experience: 0.3,  // 30% - very important
      traits: 0.2,     // 20% - important
      jobMatch: 0.1     // 10% - nice to have
    };

    const weightedScore = (
      scores.skillsScore * weights.skills +
      scores.experienceScore * weights.experience +
      scores.traitsScore * weights.traits +
      scores.jobMatchScore * weights.jobMatch
    );

    return Math.round(weightedScore);
  }

  private generateRecommendation(
    score: number,
    skillsAnalysis: any,
    experienceAnalysis: any
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
    skillsAnalysis: any,
    experienceAnalysis: any
  ): string {
    const skillsMatch = skillsAnalysis.matchingSkills.length;
    const totalSkills = skillsAnalysis.matchingSkills.length + skillsAnalysis.missingSkills.length;
    
    return `Resume evaluation complete. Overall match: ${score}/100. ` +
           `Skills: ${skillsMatch}/${totalSkills} required skills found. ` +
           `Experience level: ${experienceAnalysis.match}. ` +
           `${score >= this.MINIMUM_SCORE_THRESHOLD ? 'Candidate qualifies for interview.' : 'Candidate does not meet minimum requirements.'}`;
  }

  private generateFeedback(analysisData: any): string {
    const { score, skillsAnalysis, experienceAnalysis, traitsAnalysis, jobDescriptionMatch } = analysisData;
    
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
    
    // Overall recommendation
    feedback += `Recommendation: ${score >= this.MINIMUM_SCORE_THRESHOLD ? 
      'Proceed to interview - candidate meets basic requirements.' :
      'Does not meet minimum threshold for interview.'}`;
    
    return feedback;
  }

  // Save resume evaluation to database
  async saveResumeEvaluation(
    profileId: string,
    jobId: string,
    resumeContent: string,
    resumeFilename: string,
    evaluation: ResumeEvaluation
  ): Promise<InterviewEvaluation> {
    try {
      const supabase = await createClient();
      
      const evaluationData = {
        profile_id: profileId,
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
        feedback: evaluation.feedback
      };

      const { data: savedEvaluation, error } = await supabase
        .from('evaluations')
        .insert(evaluationData)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
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
        updatedAt: savedEvaluation.updated_at
      };
    } catch (error) {
      console.error('Error saving resume evaluation:', error);
      throw error;
    }
  }

  private mapRecommendation(recommendation: 'proceed' | 'reject'): 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no' {
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
        updatedAt: evaluation.updated_at
      };
    } catch (error) {
      console.error('Error fetching resume evaluation:', error);
      throw error;
    }
  }
}

export const resumeService = new ResumeService(); 
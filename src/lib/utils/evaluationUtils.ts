import { 
  EvaluationStatus, 
  RecommendationType, 
  RadarMetrics, 
  AIEvaluation, 
  TeamAssessment, 
  CombinedEvaluation,
  RadarChartData
} from '@/types/evaluations';

// Status calculation utilities
export const evaluationUtils = {
  // Compute status from score (0-100)
  computeStatusFromScore: (score: number): EvaluationStatus => {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'average';
    if (score >= 40) return 'poor';
    return 'very_poor';
  },

  // Compute team rating status from 0-5 scale
  computeTeamRatingStatus: (rating: number): EvaluationStatus => {
    if (rating >= 4.5) return 'excellent';
    if (rating >= 3.5) return 'good';
    if (rating >= 2.5) return 'average';
    if (rating >= 1.5) return 'poor';
    return 'very_poor';
  },

  // Get status colors (using app theme colors)
  getStatusColor: (status: EvaluationStatus): string => {
    switch (status) {
      case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'good': return 'text-primary bg-primary/10 border-primary/20';
      case 'average': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'poor': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'very_poor': return 'text-red-600 bg-red-50 border-red-200';
    }
  },

  // Get status labels
  getStatusLabel: (status: EvaluationStatus): string => {
    switch (status) {
      case 'excellent': return 'Excellent';
      case 'good': return 'Good';
      case 'average': return 'Average';
      case 'poor': return 'Poor';
      case 'very_poor': return 'Very Poor';
    }
  },

  // Get recommendation colors
  getRecommendationColor: (recommendation: RecommendationType): string => {
    switch (recommendation) {
      case 'strong_yes': return 'text-emerald-700 bg-emerald-100 border-emerald-300';
      case 'yes': return 'text-primary bg-primary/15 border-primary/30';
      case 'maybe': return 'text-amber-700 bg-amber-100 border-amber-300';
      case 'no': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'strong_no': return 'text-red-700 bg-red-100 border-red-300';
    }
  },

  // Get recommendation labels
  getRecommendationLabel: (recommendation: RecommendationType): string => {
    switch (recommendation) {
      case 'strong_yes': return 'Strong Yes';
      case 'yes': return 'Yes';
      case 'maybe': return 'Maybe';
      case 'no': return 'No';
      case 'strong_no': return 'Strong No';
    }
  },

  // Format score as percentage
  formatScoreAsPercentage: (score: number): string => {
    return `${Math.round(score)}%`;
  },

  // Format team rating
  formatTeamRating: (rating: number): string => {
    return `${rating.toFixed(1)}/5`;
  },

  // Calculate consensus level between AI and team assessments
  calculateConsensusLevel: (aiScore: number, avgTeamRating: number): 'high' | 'medium' | 'low' => {
    // Convert team rating (0-5) to percentage (0-100) for comparison
    const teamScorePercentage = (avgTeamRating / 5) * 100;
    const difference = Math.abs(aiScore - teamScorePercentage);
    
    if (difference <= 10) return 'high';
    if (difference <= 25) return 'medium';
    return 'low';
  },

  // Get consensus color
  getConsensusColor: (level: 'high' | 'medium' | 'low'): string => {
    switch (level) {
      case 'high': return 'text-emerald-600 bg-emerald-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-red-600 bg-red-50';
    }
  },

  // Calculate final recommendation based on AI and team input
  calculateFinalRecommendation: (
    aiRecommendation: RecommendationType,
    avgTeamRating: number
  ): RecommendationType => {
    // Weight: 60% AI, 40% Team
    const aiWeight = 0.6;
    const teamWeight = 0.4;
    
    // Convert recommendations to numeric values
    const recommendationValues = {
      strong_no: 0,
      no: 25,
      maybe: 50,
      yes: 75,
      strong_yes: 100
    };
    
    const aiValue = recommendationValues[aiRecommendation];
    const teamValue = (avgTeamRating / 5) * 100;
    
    const finalValue = (aiValue * aiWeight) + (teamValue * teamWeight);
    
    // Convert back to recommendation
    if (finalValue >= 90) return 'strong_yes';
    if (finalValue >= 70) return 'yes';
    if (finalValue >= 40) return 'maybe';
    if (finalValue >= 20) return 'no';
    return 'strong_no';
  },

  // Get status text based on evaluation status
  getStatusText: (status: EvaluationStatus): string => {
    const statusTextMap: Record<EvaluationStatus, string> = {
      excellent: 'Excellent',
      good: 'Good',
      average: 'Average',
      poor: 'Poor',
      very_poor: 'Very Poor'
    };
    return statusTextMap[status] || 'Unknown';
  }
};

// Radar chart utilities
export const radarChartUtils = {
  // Convert radar metrics to chart data (matching the image format)
  createRadarChartData: (radarMetrics: RadarMetrics, label: string = 'Candidate'): RadarChartData => {
    return {
      labels: [
        'Skills',
        'Growth Mindset', 
        'Team Work',
        'Culture',
        'Communication'
      ],
      datasets: [{
        label,
        data: [
          radarMetrics.skills,
          radarMetrics.growth_mindset,
          radarMetrics.team_work,
          radarMetrics.culture,
          radarMetrics.communication
        ],
        backgroundColor: 'rgba(56, 107, 67, 0.1)', // primary color with opacity
        borderColor: '#386B43', // primary color
        pointBackgroundColor: '#386B43'
      }]
    };
  },

  // Get radar metric color based on score
  getRadarMetricColor: (score: number): string => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 65) return 'text-primary';
    if (score >= 50) return 'text-amber-600';
    return 'text-red-600';
  },

  // Format radar metric labels
  formatRadarLabel: (key: keyof RadarMetrics): string => {
    switch (key) {
      case 'skills': return 'Skills';
      case 'growth_mindset': return 'Growth Mindset';
      case 'team_work': return 'Team Work';
      case 'culture': return 'Culture';
      case 'communication': return 'Communication';
    }
  }
};

// Combined evaluation utilities
export const combinedEvaluationUtils = {
  // Create combined evaluation with computed values
  createCombinedEvaluation: (
    aiEvaluation: AIEvaluation,
    teamAssessments: TeamAssessment[]
  ): CombinedEvaluation => {
    const averageTeamRating = teamAssessments.length > 0
      ? teamAssessments.reduce((sum, assessment) => sum + assessment.overallRating, 0) / teamAssessments.length
      : 0;

    const teamAssessmentStatus = evaluationUtils.computeTeamRatingStatus(averageTeamRating);
    const consensusLevel = evaluationUtils.calculateConsensusLevel(aiEvaluation.overallScore, averageTeamRating);
    const finalRecommendation = evaluationUtils.calculateFinalRecommendation(aiEvaluation.recommendation, averageTeamRating);

    return {
      aiEvaluation,
      teamAssessments,
      computedValues: {
        averageTeamRating,
        teamAssessmentStatus,
        totalAssessors: teamAssessments.length,
        consensusLevel,
        finalRecommendation
      }
    };
  },

  // Get summary stats for display (matching the image format)
  getSummaryStats: (combinedEvaluation: CombinedEvaluation) => {
    const { aiEvaluation, computedValues } = combinedEvaluation;
    
    return {
      overallScore: {
        value: aiEvaluation.overallScore,
        percentage: evaluationUtils.formatScoreAsPercentage(aiEvaluation.overallScore),
        status: aiEvaluation.overallStatus,
        label: evaluationUtils.getStatusLabel(aiEvaluation.overallStatus)
      },
      teamAssessment: {
        value: computedValues.averageTeamRating,
        formatted: evaluationUtils.formatTeamRating(computedValues.averageTeamRating),
        status: computedValues.teamAssessmentStatus,
        label: evaluationUtils.getStatusLabel(computedValues.teamAssessmentStatus),
        totalAssessors: computedValues.totalAssessors
      },
      consensus: {
        level: computedValues.consensusLevel,
        color: evaluationUtils.getConsensusColor(computedValues.consensusLevel)
      },
      finalRecommendation: {
        value: computedValues.finalRecommendation,
        label: evaluationUtils.getRecommendationLabel(computedValues.finalRecommendation),
        color: evaluationUtils.getRecommendationColor(computedValues.finalRecommendation)
      }
    };
  }
};

// Category breakdown utilities
export const categoryUtils = {
  // Get category colors based on score
  getCategoryColor: (score: number): string => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 65) return 'bg-primary';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  },

  // Format category names for display
  formatCategoryName: (category: string): string => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
};

// Export utilities as a combined object for easy importing
export const evaluationUtilities = {
  ...evaluationUtils,
  radar: radarChartUtils,
  combined: combinedEvaluationUtils,
  category: categoryUtils
}; 
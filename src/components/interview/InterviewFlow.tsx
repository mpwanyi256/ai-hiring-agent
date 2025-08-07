'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store';
import { setInterviewStep } from '@/store/interview/interviewSlice';
import { JobData } from '@/lib/services/jobsService';
import { ResumeEvaluation } from '@/types/interview';
import { Button } from '@/components/ui/button';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  selectCandidate,
  selectInterviewQuestionResponses,
  selectInterviewQuestions,
  selectIsQuestionsLoading,
} from '@/store/interview/interviewSelectors';
import Image from 'next/image';
import { fetchInterviewQuestions, saveInterviewResponse } from '@/store/interview/interviewThunks';
import { apiError } from '@/lib/notification';

interface InterviewFlowProps {
  jobToken: string;
  job: JobData;
  resumeEvaluation?: ResumeEvaluation | null;
  resumeContent: string;
  onComplete: () => void;
}

interface Response {
  questionId: string;
  answer: string;
  timeSpent: number; // in seconds
}

export default function InterviewFlow({
  jobToken,
  job,
  resumeEvaluation,
  resumeContent,
  onComplete,
}: InterviewFlowProps) {
  const questions = useAppSelector(selectInterviewQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const responses = useAppSelector(selectInterviewQuestionResponses);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const isLoading = useAppSelector(selectIsQuestionsLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const candidate = useAppSelector(selectCandidate);

  const dispatch = useAppDispatch();

  // Fetch questions from the API
  useEffect(() => {
    dispatch(fetchInterviewQuestions(jobToken));
  }, [jobToken, dispatch]);

  // Don't return null immediately if there's no candidate - give it time to load
  if (!isLoading && !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-text mb-2">Loading Candidate Information</h2>
          <p className="text-muted-text">Please wait while we load your information...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleAnswerSubmit = async () => {
    if (!candidate) {
      return;
    }

    if (!currentAnswer.trim()) {
      setError('Please provide an answer before continuing.');
      return;
    }

    if (currentAnswer.trim().length < 10) {
      setError('Please provide a more detailed answer (at least 10 characters).');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      // Calculate time spent on this question
      const timeSpent = Math.round((new Date().getTime() - questionStartTime.getTime()) / 1000);

      // Save response to database
      const responseData = {
        candidateId: candidate.id,
        questionId: currentQuestion.id,
        question: currentQuestion.questionText,
        answer: currentAnswer.trim(),
        responseTime: timeSpent,
        jobId: currentQuestion.jobId,
      };

      await dispatch(saveInterviewResponse(responseData));

      // Save response locally
      if (isLastQuestion) {
        await handleInterviewComplete();
      } else {
        // Move to next question
        setCurrentQuestionIndex((prev) => prev + 1);
        setCurrentAnswer('');
        setQuestionStartTime(new Date());
      }
    } catch (err) {
      apiError(
        err instanceof Error ? err.message : 'Failed to save your answer. Please try again.',
      );
      console.error('Error submitting answer:', err);
      setError('Failed to save your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);

      // Load previous answer
      const previousResponse = responses.find(
        (r) => r.jobQuestionId === questions[currentQuestionIndex - 1].id,
      );
      setCurrentAnswer(previousResponse?.answer || '');
      setQuestionStartTime(new Date());
    }
  };

  const handleInterviewComplete = async () => {
    try {
      if (!candidate) {
        return;
      }

      // Complete the interview session
      const completeResponse = await fetch('/api/interview/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId: candidate.id,
          jobToken,
          candidateInfo: {
            id: candidate.candidateInfoId,
            jobId: candidate.jobId,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
          },
          resumeEvaluation: resumeEvaluation || null,
          resumeContent,
          totalTimeSpent: Math.round((new Date().getTime() - (startTime?.getTime() || 0)) / 1000),
        }),
      });

      const completeData = await completeResponse.json();
      if (!completeData.success) {
        console.warn('Failed to complete interview:', completeData.error);
      }

      // Navigate to completion step
      dispatch(setInterviewStep(5));
      onComplete();
    } catch (err) {
      console.error('Error completing interview:', err);
      // Still proceed to completion even if there's an error
      dispatch(setInterviewStep(5));
      onComplete();
    }
  };

  // Format question duration for display
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    return `~${minutes} min`;
  };

  // Get category color
  const getCategoryColor = (type: string): string => {
    switch (type) {
      case 'general':
        return 'bg-blue-100 text-blue-800';
      case 'technical':
        return 'bg-green-100 text-green-800';
      case 'behavioral':
        return 'bg-purple-100 text-purple-800';
      case 'experience':
        return 'bg-orange-100 text-orange-800';
      case 'custom':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-text mb-2">Loading Interview Questions</h2>
          <p className="text-muted-text">Fetching your personalized interview questions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isInterviewNotReady = error === 'INTERVIEW_NOT_READY';

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div
            className={`w-12 h-12 ${isInterviewNotReady ? 'bg-yellow-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-4`}
          >
            {isInterviewNotReady ? (
              <ClockIcon className="w-6 h-6 text-yellow-600" />
            ) : (
              <Image src="/illustrations/file_not_found.svg" alt="Error" width={48} height={48} />
            )}
          </div>
          <h2 className="text-xl font-bold text-text mb-2">
            {isInterviewNotReady ? 'Interview Not Ready' : 'Interview Error'}
          </h2>
          <p className={`${isInterviewNotReady ? 'text-yellow-600' : 'text-red-600'} mb-4`}>
            {isInterviewNotReady
              ? 'This interview is not ready yet. The employer needs to set up interview questions first. Please check back later or contact the employer.'
              : error.includes('invalid') || error.includes('expired')
                ? 'The interview link is invalid or has expired.'
                : error}
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <p className="text-red-600">No questions available for this interview</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-text">{job.title}</h1>
                <p className="text-sm text-muted-text">
                  Hi {candidate?.firstName}, let&apos;s get to know you better
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-text">
              <div className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                <span>{formatDuration(currentQuestion.expectedDuration)}</span>
              </div>
              <div className="flex items-center">
                <DocumentTextIcon className="w-4 h-4 mr-1" />
                <span>
                  {currentQuestionIndex + 1}/{questions.length}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-text mb-1">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Question */}
          <div className="mb-8">
            <div className="flex items-start space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                <span className="text-primary font-semibold text-sm">
                  {currentQuestionIndex + 1}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-medium ${getCategoryColor(currentQuestion.questionType)}`}
                  >
                    {currentQuestion.category}
                  </span>
                  <span className="text-xs text-muted-text">
                    Expected: {formatDuration(currentQuestion.expectedDuration)}
                  </span>
                  {currentQuestion.isRequired && (
                    <span className="text-xs text-red-600 font-medium">Required</span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-text leading-relaxed">
                  {currentQuestion.questionText}
                </h2>
              </div>
            </div>
          </div>

          {/* Answer Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-text mb-3">Your Answer</label>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Take your time to provide a thoughtful, detailed response..."
              className="w-full h-40 px-4 py-3 border border-gray-300 rounded-lg text-text placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-muted-text">
                Tip: Be specific and provide examples when possible
              </p>
              <span
                className={`text-xs ${
                  currentAnswer.length < 10
                    ? 'text-red-500'
                    : currentAnswer.length < 50
                      ? 'text-yellow-600'
                      : 'text-green-600'
                }`}
              >
                {currentAnswer.length} characters
              </span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {currentQuestionIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePreviousQuestion}
                  disabled={isSubmitting}
                  className="flex items-center"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-muted-text">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <Button
                onClick={handleAnswerSubmit}
                disabled={isSubmitting || !currentAnswer.trim()}
                className="flex items-center px-6"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Submitting...
                  </>
                ) : isLastQuestion ? (
                  <>
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Complete Interview
                  </>
                ) : (
                  <>
                    Next Question
                    <ChevronRightIcon className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Interview Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 text-blue-600 mt-0.5">💡</div>
            <div className="text-blue-800 text-sm">
              <p className="font-medium mb-1">Interview Tips:</p>
              <ul className="text-xs space-y-1">
                <li>• Be honest and authentic in your responses</li>
                <li>• Use specific examples from your experience</li>
                <li>• You can go back to edit previous answers</li>
                <li>• Take your time - there&apos;s no rush</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

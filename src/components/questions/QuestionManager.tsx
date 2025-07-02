'use client';

import { useState, useEffect } from 'react';
import { JobQuestion } from '@/types/interview';
import Button from '@/components/ui/Button';
import {
  SparklesIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface QuestionManagerProps {
  jobId: string;
  jobTitle: string;
  onQuestionsChange?: (questions: JobQuestion[]) => void;
}

interface QuestionStats {
  total: number;
  required: number;
  optional: number;
  aiGenerated: number;
  custom: number;
  estimatedDuration: number;
}

export default function QuestionManager({ jobId, jobTitle, onQuestionsChange }: QuestionManagerProps) {
  const [questions, setQuestions] = useState<JobQuestion[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Fetch questions and stats
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/jobs/${jobId}/questions`);
        const data = await response.json();

        if (data.success) {
          setQuestions(data.questions || []);
          setStats(data.stats || null);
          onQuestionsChange?.(data.questions || []);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [jobId, onQuestionsChange]);

  const refreshQuestions = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/questions`);
      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions || []);
        setStats(data.stats || null);
        onQuestionsChange?.(data.questions || []);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const generateQuestions = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch(`/api/jobs/${jobId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionCount: 8,
          includeCustom: true,
          replaceExisting: true
        })
      });

      const data = await response.json();
      if (data.success) {
        setQuestions(data.questions);
        await refreshQuestions(); // Refresh stats
        alert(`✨ Generated ${data.questions.length} AI questions successfully!`);
      } else {
        throw new Error(data.error || 'Failed to generate questions');
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Failed to generate questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startEditing = (question: JobQuestion) => {
    setEditingId(question.id);
    setEditingText(question.questionText);
  };

  const saveEdit = async () => {
    if (!editingId || !editingText.trim()) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}/questions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionText: editingText.trim() })
      });

      if (response.ok) {
        await refreshQuestions();
        setEditingId(null);
        setEditingText('');
      }
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      const response = await fetch(`/api/jobs/${jobId}/questions/${questionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await refreshQuestions();
      }
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const moveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    const reorderedQuestions = [...questions];
    [reorderedQuestions[currentIndex], reorderedQuestions[newIndex]] = 
    [reorderedQuestions[newIndex], reorderedQuestions[currentIndex]];

    const newOrder = reorderedQuestions.map(q => q.id);
    
    try {
      const response = await fetch(`/api/jobs/${jobId}/questions/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIds: newOrder })
      });

      if (response.ok) {
        await refreshQuestions();
      }
    } catch (error) {
      console.error('Error reordering questions:', error);
    }
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'technical': return 'bg-blue-100 text-blue-700';
      case 'behavioral': return 'bg-green-100 text-green-700';
      case 'experience': return 'bg-purple-100 text-purple-700';
      case 'general': return 'bg-gray-100 text-gray-700';
      default: return 'bg-orange-100 text-orange-700';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-3 text-muted-text">Loading questions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="bg-white rounded-lg border border-gray-light p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text">Interview Questions</h2>
            <p className="text-muted-text text-sm">
              AI-generated questions for <span className="font-medium">{jobTitle}</span>
            </p>
          </div>
          
          <div className="flex gap-3">
            {questions.length > 0 && (
              <Button variant="outline" size="sm" className="flex items-center">
                <EyeIcon className="w-4 h-4 mr-1" />
                Preview Interview
              </Button>
            )}
            
            <Button 
              onClick={generateQuestions}
              disabled={isGenerating}
              className="flex items-center"
            >
              <SparklesIcon className="w-4 h-4 mr-2" />
              {isGenerating ? 'Generating...' : questions.length > 0 ? 'Regenerate' : 'Generate Questions'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-text">{stats.total}</div>
              <div className="text-xs text-muted-text">Total Questions</div>
            </div>
            <div className="bg-primary/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">{stats.aiGenerated}</div>
              <div className="text-xs text-muted-text">AI Generated</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-600">{stats.required}</div>
              <div className="text-xs text-muted-text">Required</div>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">{stats.optional}</div>
              <div className="text-xs text-muted-text">Optional</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">{formatDuration(stats.estimatedDuration)}</div>
              <div className="text-xs text-muted-text">Est. Duration</div>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      {questions.length > 0 ? (
        <div className="bg-white rounded-lg border border-gray-light">
          <div className="p-4 border-b border-gray-light">
            <h3 className="font-medium text-text">Questions ({questions.length})</h3>
          </div>
          
          <div className="divide-y divide-gray-light">
            {questions.map((question, index) => (
              <div key={question.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Question Number */}
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                    {index + 1}
                  </div>

                  {/* Question Content */}
                  <div className="flex-1 min-w-0">
                    {editingId === question.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-3 border border-gray-light rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          rows={3}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={saveEdit}>
                            <CheckIcon className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={cancelEdit}>
                            <XMarkIcon className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-text font-medium mb-2">{question.questionText}</p>
                        
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQuestionTypeColor(question.questionType)}`}>
                            {question.questionType}
                          </span>
                          
                          <span className="text-muted-text">{question.category}</span>
                          
                          <div className="flex items-center text-muted-text">
                            <ClockIcon className="w-3 h-3 mr-1" />
                            {formatDuration(question.expectedDuration)}
                          </div>
                          
                          {question.isRequired && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Required</span>
                          )}
                          
                          {question.isAiGenerated && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full flex items-center">
                              <SparklesIcon className="w-3 h-3 mr-1" />
                              AI
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {editingId !== question.id && (
                    <div className="flex-shrink-0 flex items-center gap-1">
                      <button
                        onClick={() => moveQuestion(question.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-muted-text hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowUpIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => moveQuestion(question.id, 'down')}
                        disabled={index === questions.length - 1}
                        className="p-1 text-muted-text hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowDownIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => startEditing(question)}
                        className="p-1 text-muted-text hover:text-text"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => deleteQuestion(question.id)}
                        className="p-1 text-muted-text hover:text-red-600"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-light p-8 text-center">
          <SparklesIcon className="w-12 h-12 text-muted-text mx-auto mb-4" />
          <h3 className="text-lg font-medium text-text mb-2">No Questions Generated Yet</h3>
          <p className="text-muted-text mb-6">
            Generate AI-powered interview questions tailored to this job position.
          </p>
          <Button onClick={generateQuestions} disabled={isGenerating}>
            <SparklesIcon className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating Questions...' : 'Generate Questions'}
          </Button>
        </div>
      )}
    </div>
  );
} 
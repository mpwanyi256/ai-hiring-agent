import { formatDuration, getQuestionTypeColor } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon, ClockIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { JobQuestion } from "@/types/interview";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { EditQuestion } from "./EditQuestion";

interface JobQuestionWrapperProps {
    question: JobQuestion;
    questionsCount: number;
    onDeleteQuestion: (questionId: string) => void;
    onMoveQuestion: (questionId: string, direction: 'up' | 'down') => void;
}   

export const JobQuestionWrapper = ({ question, onMoveQuestion, questionsCount, onDeleteQuestion }: JobQuestionWrapperProps) => {
    const [isEditing, setIsEditing] = useState(false);

    const startEditing = () => {
        setIsEditing(true);
    }
    
    return (
        <div className="p-4 hover:bg-gray-50">
            <div className="flex items-start gap-4">
                {/* Question Number */}
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                    {question.orderIndex}
                </div>
                
                {/* Question content */}
                {isEditing ? <EditQuestion question={question} onCancel={() => setIsEditing(false)} /> : <div className="flex-1 min-w-0">
                    <p className="text-md font-medium mb-2">{question.questionText}</p>
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
                        <span className="text-muted-text">
                            {question.metadata.reasoning}
                        </span>
                    </div>
                </div>}

                {/* Actions */}
                <div className="flex-shrink-0 flex items-center gap-1">
                    <button
                    onClick={() => onMoveQuestion(question.id, 'up')}
                    disabled={question.orderIndex === 0}
                    className="p-1 text-muted-text hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                    <ArrowUpIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                    onClick={() => onMoveQuestion(question.id, 'down')}
                    disabled={question.orderIndex === questionsCount - 1}
                    className="p-1 text-muted-text hover:text-text disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                    <ArrowDownIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                    onClick={() => startEditing()}
                    className="p-1 text-muted-text hover:text-text"
                    >
                    <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                    onClick={() => onDeleteQuestion(question.id)}
                    className="p-1 text-muted-text hover:text-red-600"
                    >
                    <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
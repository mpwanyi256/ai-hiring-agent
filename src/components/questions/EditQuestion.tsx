import { JobQuestion } from "@/types/interview";
import Button from "../ui/Button";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { updateJobQuestion } from "@/store/jobs/jobsThunks";
import { apiError, apiSuccess } from "@/lib/notification";
import { useAppDispatch } from "@/store";

interface EditQuestionProps {
    question: JobQuestion;
    onCancel: () => void;
}

export const EditQuestion = ({ question, onCancel }: EditQuestionProps) => {
    const [editingText, setEditingText] = useState(question.questionText);
    const [isSaving, setIsSaving] = useState(false);
    const dispatch = useAppDispatch();

    const handleSaveUpdate = async () => {
        try {
            if (!editingText.trim()) {
                apiError('Question text cannot be empty');
                return;
            }

            setIsSaving(true);
            await dispatch(updateJobQuestion({ questionId: question.id, questionText: editingText })).unwrap();
            apiSuccess('Question updated successfully');
            onCancel();
        } catch (error) {
            apiError('Failed to update question. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }

        return (
        <div className="flex-1 min-w-0">
            <div className="space-y-3">
                <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="w-full p-3 border border-gray-light rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows={3}
                    autoFocus
                    disabled={isSaving}
                />
                <div className="flex gap-2">
                    <Button isLoading={isSaving} size="sm" onClick={handleSaveUpdate} disabled={isSaving}>
                    <CheckIcon className="w-4 h-4 mr-1" />
                        Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={onCancel}>
                    <XMarkIcon className="w-4 h-4 mr-1" />
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    )
}
import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useAppDispatch } from '@/store';
import { updateJob } from '@/store/jobs/jobsThunks';
import { apiError, apiSuccess } from '@/lib/notification';
import { CurrentJob } from '@/types/jobs';

interface EditJobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: CurrentJob;
}

export default function EditJobDetailsModal({ isOpen, onClose, job }: EditJobDetailsModalProps) {
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState({
    jobDescription: job.fields?.jobDescription || '',
    skills: job.fields?.skills || [],
    traits: job.fields?.traits || [],
    customFields: job.fields?.customFields || {},
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...formData.skills];
    newSkills[index] = value;
    setFormData(prev => ({ ...prev, skills: newSkills }));
  };

  const handleTraitChange = (index: number, value: string) => {
    const newTraits = [...formData.traits];
    newTraits[index] = value;
    setFormData(prev => ({ ...prev, traits: newTraits }));
  };

  const addSkill = () => setFormData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  const removeSkill = (index: number) => setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }));
  const addTrait = () => setFormData(prev => ({ ...prev, traits: [...prev.traits, ''] }));
  const removeTrait = (index: number) => setFormData(prev => ({ ...prev, traits: prev.traits.filter((_, i) => i !== index) }));

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dispatch(updateJob({
        id: job.id,
        fields: {
          ...job.fields,
          jobDescription: formData.jobDescription,
          skills: formData.skills.filter(s => s.trim()),
          traits: formData.traits.filter(t => t.trim()),
          customFields: formData.customFields,
        },
      })).unwrap();
      apiSuccess('Job details updated');
      onClose();
    } catch (error) {
      apiError('Failed to update job details');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-primary/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Job Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form className="p-6 space-y-6" onSubmit={e => { e.preventDefault(); handleSave(); }}>
          {/* Job Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
            <textarea
              value={formData.jobDescription}
              onChange={e => handleChange('jobDescription', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              rows={4}
              required
            />
          </div>
          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
            <div className="space-y-2">
              {formData.skills.map((skill, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={skill}
                    onChange={e => handleSkillChange(idx, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button type="button" onClick={() => removeSkill(idx)} className="text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addSkill} className="mt-2">Add Skill</Button>
            </div>
          </div>
          {/* Traits */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Traits</label>
            <div className="space-y-2">
              {formData.traits.map((trait, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={trait}
                    onChange={e => handleTraitChange(idx, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button type="button" onClick={() => removeTrait(idx)} className="text-red-500 hover:text-red-700">Remove</button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={addTrait} className="mt-2">Add Trait</Button>
            </div>
          </div>
          {/* Additional Info (Custom Fields) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Information</label>
            <div className="space-y-2">
              {Object.entries(formData.customFields).map(([key, field]: any, idx) => (
                <div key={key} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={field.value}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      customFields: {
                        ...prev.customFields,
                        [key]: { ...field, value: e.target.value }
                      }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <span className="text-xs text-gray-500">{key}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" isLoading={isSaving} disabled={isSaving}>Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 
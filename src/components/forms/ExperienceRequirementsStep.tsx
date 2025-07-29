import React, { useState, useRef, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { JobFormData, Skill, Trait } from '@/types/jobs';
import { Button } from '@/components/ui/button';

interface ExperienceRequirementsStepProps {
  form: UseFormReturn<JobFormData>;
  allSkills: Skill[];
  allTraits: Trait[];
  experienceLevels: { value: string; label: string }[];
  onPrev: () => void;
  onNext: () => void;
}

const ExperienceRequirementsStep: React.FC<ExperienceRequirementsStepProps> = ({
  form,
  allSkills,
  allTraits,
  experienceLevels,
  onPrev,
  onNext,
}) => {
  // Skills dropdown
  const [skillSearch, setSkillSearch] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const skillDropdownRef = useRef<HTMLDivElement>(null);
  const selectedSkills = form.watch('skills') || [];
  const filteredSkills = allSkills.filter(
    (skill) =>
      !selectedSkills.includes(skill.name) &&
      skill.name.toLowerCase().includes(skillSearch.toLowerCase()),
  );

  // Traits dropdown
  const [traitSearch, setTraitSearch] = useState('');
  const [traitDropdownOpen, setTraitDropdownOpen] = useState(false);
  const traitDropdownRef = useRef<HTMLDivElement>(null);
  const selectedTraits = form.watch('traits') || [];
  const filteredTraits = allTraits.filter(
    (trait) =>
      !selectedTraits.includes(trait.name) &&
      trait.name.toLowerCase().includes(traitSearch.toLowerCase()),
  );

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        skillDropdownOpen &&
        skillDropdownRef.current &&
        !skillDropdownRef.current.contains(event.target as Node)
      ) {
        setSkillDropdownOpen(false);
      }
      if (
        traitDropdownOpen &&
        traitDropdownRef.current &&
        !traitDropdownRef.current.contains(event.target as Node)
      ) {
        setTraitDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [skillDropdownOpen, traitDropdownOpen]);

  return (
    <div className="bg-white rounded-lg border border-gray-light p-6 text-[15px]">
      <h2 className="text-lg font-semibold text-text mb-6">Experience & Requirements</h2>
      {/* Experience Level */}
      <div className="mb-6">
        <label htmlFor="experienceLevel" className="block text-sm font-medium text-text mb-2">
          Experience Level
        </label>
        <select
          id="experienceLevel"
          {...form.register('experienceLevel')}
          className="w-full px-4 py-2 border border-gray-light rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-[15px]"
        >
          <option value="">Select experience level (optional)</option>
          {experienceLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>
      {/* Required Skills (dropdown/autocomplete) */}
      <div className="mb-6" ref={skillDropdownRef}>
        <label className="block text-sm font-medium text-text mb-2">Required Skills</label>
        <input
          type="text"
          placeholder="Search and select skills..."
          value={skillSearch}
          onChange={(e) => setSkillSearch(e.target.value)}
          onFocus={() => setSkillDropdownOpen(true)}
          className="w-full px-4 py-2 border border-gray-light rounded-lg mb-2"
        />
        {skillDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredSkills.length > 0 ? (
              filteredSkills.map((skill) => (
                <button
                  key={skill.name}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-primary/10 text-text"
                  onClick={() => {
                    form.setValue('skills', [...selectedSkills, skill.name]);
                    setSkillSearch('');
                    setSkillDropdownOpen(false);
                  }}
                >
                  <div className="font-medium">{skill.name}</div>
                  <div className="text-xs text-muted-text">{skill.description}</div>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-muted-text text-sm text-center">No skills found</div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedSkills.map((skill) => (
            <span
              key={skill}
              className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1"
            >
              {skill}
              <button
                type="button"
                onClick={() =>
                  form.setValue(
                    'skills',
                    selectedSkills.filter((s) => s !== skill),
                  )
                }
                className="ml-1 text-primary"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>
      {/* Desired Traits (dropdown/autocomplete) */}
      <div className="mb-6" ref={traitDropdownRef}>
        <label className="block text-sm font-medium text-text mb-2">Desired Traits</label>
        <input
          type="text"
          placeholder="Search and select traits..."
          value={traitSearch}
          onChange={(e) => setTraitSearch(e.target.value)}
          onFocus={() => setTraitDropdownOpen(true)}
          className="w-full px-4 py-2 border border-gray-light rounded-lg mb-2"
        />
        {traitDropdownOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-light rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {filteredTraits.length > 0 ? (
              filteredTraits.map((trait) => (
                <button
                  key={trait.name}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-primary/10 text-text"
                  onClick={() => {
                    form.setValue('traits', [...selectedTraits, trait.name]);
                    setTraitSearch('');
                    setTraitDropdownOpen(false);
                  }}
                >
                  <div className="font-medium">{trait.name}</div>
                  <div className="text-xs text-muted-text">{trait.description}</div>
                </button>
              ))
            ) : (
              <div className="px-4 py-4 text-muted-text text-sm text-center">No traits found</div>
            )}
          </div>
        )}
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedTraits.map((trait) => (
            <span
              key={trait}
              className="bg-primary/10 text-primary px-2 py-1 rounded text-xs flex items-center gap-1"
            >
              {trait}
              <button
                type="button"
                onClick={() =>
                  form.setValue(
                    'traits',
                    selectedTraits.filter((t) => t !== trait),
                  )
                }
                className="ml-1 text-primary"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-between mt-8">
        <Button type="button" onClick={onPrev} className="min-w-[120px]">
          Back
        </Button>
        <Button type="button" onClick={onNext} className="min-w-[120px]">
          Next
        </Button>
      </div>
    </div>
  );
};

export default ExperienceRequirementsStep;

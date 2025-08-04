import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { JobFormData, Skill, Trait } from '@/types/jobs';
import { Button } from '@/components/ui/button';
import MultiSelectWithCreate from '@/components/ui/MultiSelectWithCreate';

interface ExperienceRequirementsStepProps {
  form: UseFormReturn<JobFormData>;
  allSkills: Skill[];
  allTraits: Trait[];
  experienceLevels: { value: string; label: string }[];
  onPrev: () => void;
  onNext: () => void;
  onCreateSkill: (name: string) => Promise<void>;
  onCreateTrait: (name: string) => Promise<void>;
}

const ExperienceRequirementsStep: React.FC<ExperienceRequirementsStepProps> = ({
  form,
  allSkills,
  allTraits,
  experienceLevels,
  onPrev,
  onNext,
  onCreateSkill,
  onCreateTrait,
}) => {
  // Skills dropdown state
  const [skillSearch, setSkillSearch] = useState('');
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);

  // Traits dropdown state
  const [traitSearch, setTraitSearch] = useState('');
  const [traitDropdownOpen, setTraitDropdownOpen] = useState(false);

  const selectedSkills = form.watch('skills') || [];
  const selectedTraits = form.watch('traits') || [];

  // Transform skills/traits to match MultiSelectWithCreate interface
  const skillOptions = allSkills.map((skill) => ({
    id: skill.name, // Using name as ID since form expects string array
    name: skill.name,
    category: skill.category,
  }));

  const traitOptions = allTraits.map((trait) => ({
    id: trait.name, // Using name as ID since form expects string array
    name: trait.name,
    category: trait.category,
  }));

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

      {/* Required Skills */}
      <div className="mb-6">
        <MultiSelectWithCreate
          options={skillOptions}
          selectedValues={selectedSkills}
          onChange={(values) => form.setValue('skills', values)}
          onCreateNew={onCreateSkill}
          placeholder="Search and select skills..."
          label="Required Skills"
          searchValue={skillSearch}
          onSearchChange={setSkillSearch}
          dropdownOpen={skillDropdownOpen}
          onDropdownToggle={setSkillDropdownOpen}
          dataDropdown="skills"
          createLabel="Add skill"
        />
      </div>

      {/* Desired Traits */}
      <div className="mb-6">
        <MultiSelectWithCreate
          options={traitOptions}
          selectedValues={selectedTraits}
          onChange={(values) => form.setValue('traits', values)}
          onCreateNew={onCreateTrait}
          placeholder="Search and select traits..."
          label="Desired Traits"
          searchValue={traitSearch}
          onSearchChange={setTraitSearch}
          dropdownOpen={traitDropdownOpen}
          onDropdownToggle={setTraitDropdownOpen}
          dataDropdown="traits"
          createLabel="Add trait"
        />
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <Button type="button" onClick={onPrev} variant="outline" className="min-w-[120px]">
          Previous
        </Button>
        <Button type="button" onClick={onNext} className="min-w-[120px]">
          Next
        </Button>
      </div>
    </div>
  );
};

export default ExperienceRequirementsStep;

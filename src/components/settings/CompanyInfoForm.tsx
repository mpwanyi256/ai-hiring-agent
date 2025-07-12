'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const companyInfoSchema = z.object({
  name: z.string().min(1, 'Company name is required').max(255, 'Company name is too long'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  about: z.string().max(2000, 'About section must be less than 2000 characters').optional(),
});

export type CompanyInfoFormData = z.infer<typeof companyInfoSchema>;

interface CompanyInfoFormProps {
  initialData?: Partial<CompanyInfoFormData>;
  onSubmit: (data: CompanyInfoFormData) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function CompanyInfoForm({
  initialData = {},
  onSubmit,
  isLoading = false,
  disabled = false,
}: CompanyInfoFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<CompanyInfoFormData>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      name: initialData.name || '',
      bio: initialData.bio || '',
      about: initialData.about || '',
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Company Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Company Name *
        </label>
        <input
          type="text"
          id="name"
          {...register('name')}
          disabled={disabled}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
      </div>

      {/* Short Bio */}
      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Short Bio
        </label>
        <textarea
          id="bio"
          rows={3}
          {...register('bio')}
          disabled={disabled}
          placeholder="A brief description of your company (max 500 characters)"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
        />
        {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>}
      </div>

      {/* About Company */}
      <div>
        <label htmlFor="about" className="block text-sm font-medium text-gray-700">
          About Company
        </label>
        <textarea
          id="about"
          rows={6}
          {...register('about')}
          disabled={disabled}
          placeholder="Tell us more about your company, mission, and values"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
        />
        {errors.about && <p className="mt-1 text-sm text-red-600">{errors.about.message}</p>}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={disabled || isLoading || !isDirty}
          className="inline-flex justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}

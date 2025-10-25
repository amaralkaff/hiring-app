'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GestureCapture } from '@/components/features/gesture-capture';
import { cn } from '@/lib/utils';
import type { Job, ApplicationFormData } from '@/lib/types';

interface DynamicApplicationFormProps {
  job: Job;
}

export function DynamicApplicationForm({ job }: DynamicApplicationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fields = job.application_form?.sections[0].fields || [];

  // Build validation rules dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validationRules: Record<string, any> = {};
  fields.forEach((field) => {
    if (field.validation.required) {
      validationRules[field.key] = {
        required: `${field.key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} is required`,
      };

      // Add specific validations
      if (field.key === 'email') {
        validationRules[field.key].pattern = {
          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
          message: 'Invalid email address',
        };
      }

      if (field.key === 'linkedin_link') {
        validationRules[field.key].pattern = {
          value: /^https?:\/\/(www\.)?linkedin\.com\/.+$/i,
          message: 'Please enter a valid LinkedIn URL',
        };
      }

      if (field.key === 'phone_number') {
        validationRules[field.key].pattern = {
          value: /^[+]?[1-9]\d{1,14}$/,
          message: 'Please enter a valid phone number (e.g., +628123456789)',
        };
      }
    }
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormData>();

  // Use useWatch instead of watch for React 19.2 compatibility
  const photoProfile = useWatch({ control, name: 'photo_profile' });

  // Watch all fields that might need conditional rendering
  // This ensures hooks are always called in the same order
  const domicileValue = useWatch({ control, name: 'domicile' });
  
  const getFieldLabel = (key: string) => {
    return key.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  
  const onSubmit = async (data: ApplicationFormData) => {
    setIsSubmitting(true);
    try {
      // Submit to API
      const response = await fetch(`/api/candidates/${job.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();

        // Also save to localStorage for persistence
        const existingApps = localStorage.getItem(`applications_${job.id}`);
        const apps = existingApps ? JSON.parse(existingApps) : [];
        apps.push(result.data);
        localStorage.setItem(`applications_${job.id}`, JSON.stringify(apps));

        setTimeout(() => {
          router.push('/success');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove the success state handling from here since we now redirect to a separate page

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Required Fields Notice */}
      <div className="text-start">
        <p className="text-s-regular text-danger-main">* Required fields</p>
      </div>

      <div className="space-y-4">
        {fields.map((field) => {
        const fieldKey = field.key as keyof ApplicationFormData;
        const isRequired = field.validation.required;
        const label = getFieldLabel(field.key);

        // Photo Profile with Gesture Capture (1st)
        if (field.key === 'photo_profile') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                {label} {isRequired && <span className="text-danger-main ml-1">*</span>}
              </label>
              <div className="flex justify-start">
                <div className="relative">
                  <GestureCapture
                    onCapture={(imageData) => setValue('photo_profile', imageData)}
                    currentImage={photoProfile}
                  />
                </div>
              </div>
              {errors[fieldKey] && (
                <p className="text-s-regular text-danger-main mt-2 text-center">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Full Name (2nd)
        if (field.key === 'full_name') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                Full name{isRequired && <span className="text-danger-main ml-1">*</span>}
              </label>
              <input
                id={field.key}
                type="text"
                {...register(fieldKey, validationRules[field.key])}
                placeholder="Enter your full name"
                className={cn(
                  "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                  errors[fieldKey]
                    ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                    : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                )}
              />
              {errors[fieldKey] && (
                <p className="text-s-regular text-danger-main mt-2">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Date of Birth (3rd)
        if (field.key === 'date_of_birth') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                Date of birth{isRequired && <span className="text-danger-main">*</span>}
              </label>
              <input
                id={field.key}
                type="date"
                {...register(fieldKey, validationRules[field.key])}
                className={cn(
                  "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                  errors[fieldKey]
                    ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                    : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                )}
              />
              {errors[fieldKey] && (
                <p className="text-s-regular text-danger-main mt-2">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Gender (4th)
        if (field.key === 'gender') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                Pronoun (gender){isRequired && <span className="text-danger-main">*</span>}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="Female"
                    {...register(fieldKey, validationRules[field.key])}
                    className="w-5 h-5 text-primary-main accent-primary-main"
                  />
                  <span className="text-m-regular text-neutral-100">She/her (Female)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    value="Male"
                    {...register(fieldKey, validationRules[field.key])}
                    className="w-5 h-5 text-primary-main accent-primary-main"
                  />
                  <span className="text-m-regular text-neutral-100">He/him (Male)</span>
                </label>
              </div>
              {errors[fieldKey] && (
                <p className="text-s-regular text-danger-main mt-2">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Domicile (5th)
        if (field.key === 'domicile') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                Domicile{isRequired && <span className="text-danger-main">*</span>}
              </label>
              <Select
                value={domicileValue}
                onValueChange={(value) => setValue(fieldKey, value)}
              >
                <SelectTrigger className={cn(
                  "h-12 border-2",
                  errors[fieldKey] ? "border-danger-main focus:border-danger-main focus:ring-danger-focus" : "border-neutral-40 focus:border-primary-main focus:ring-primary-focus"
                )}>
                  <SelectValue placeholder="Choose your domicile" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jakarta">Jakarta</SelectItem>
                  <SelectItem value="Bandung">Bandung</SelectItem>
                  <SelectItem value="Surabaya">Surabaya</SelectItem>
                  <SelectItem value="Yogyakarta">Yogyakarta</SelectItem>
                  <SelectItem value="Bali">Bali</SelectItem>
                  <SelectItem value="Medan">Medan</SelectItem>
                </SelectContent>
              </Select>
              {/* Hidden input for react-hook-form validation */}
              <input
                type="hidden"
                {...register(fieldKey, validationRules[field.key])}
              />
              {errors[fieldKey] && (
                <p className="text-s-regular text-danger-main mt-2">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Phone Number (6th)
        if (field.key === 'phone_number') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                Phone number{isRequired && <span className="text-danger-main ml-1">*</span>}
              </label>
              <input
                id={field.key}
                type="tel"
                {...register(fieldKey, validationRules[field.key])}
                placeholder="+6281XXXXXXXXX"
                className={cn(
                  "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                  errors[fieldKey]
                    ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                    : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                )}
              />
              {errors[fieldKey] && (
                <p className="text-s-regular text-danger-main mt-2">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Email (7th)
        if (field.key === 'email') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                Email{isRequired && <span className="text-danger-main ml-1">*</span>}
              </label>
              <input
                id={field.key}
                type="email"
                {...register(fieldKey, validationRules[field.key])}
                placeholder="Enter your email address"
                className={cn(
                  "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                  errors[fieldKey]
                    ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                    : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                )}
              />
              {errors[fieldKey] && (
                <p className="text-s-regular text-danger-main mt-2">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // LinkedIn Link (8th)
        if (field.key === 'linkedin_link') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                Link Linkedin{isRequired && <span className="text-danger-main">*</span>}
              </label>
              <input
                id={field.key}
                type="url"
                {...register(fieldKey, validationRules[field.key])}
                placeholder="https://linkedin.com/in/username"
                className={cn(
                  "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                  errors[fieldKey]
                    ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                    : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                )}
              />
              {errors[fieldKey] && (
                <p className="text-s-regular text-danger-main mt-2">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Default (other text fields)
        return (
          <div key={field.key} className="space-y-2">
            <label className="text-s-regular text-neutral-100 block">
              {label} {isRequired && <span className="text-danger-main">*</span>}
            </label>
            <input
              id={field.key}
              type="text"
              {...register(fieldKey, validationRules[field.key])}
              placeholder={`Enter your ${label.toLowerCase()}`}
              className={cn(
                "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                errors[fieldKey]
                  ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                  : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
              )}
            />
            {errors[fieldKey] && (
              <p className="text-s-regular text-danger-main mt-2">{errors[fieldKey]?.message}</p>
            )}
          </div>
        );
        })}
      </div>

      <div className="pt-6">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 bg-[#01959F] hover:bg-[#017a84] text-white font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}

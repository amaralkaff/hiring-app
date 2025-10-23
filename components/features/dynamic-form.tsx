'use client';

import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GestureCapture } from '@/components/features/gesture-capture';
import type { Job, ApplicationFormData } from '@/lib/types';

interface DynamicApplicationFormProps {
  job: Job;
}

export function DynamicApplicationForm({ job }: DynamicApplicationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fields = job.application_form?.sections[0].fields || [];

  // Build validation rules dynamically
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
          value: /^[+]?[\d\s-()]+$/,
          message: 'Please enter a valid phone number',
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

  const getFieldLabel = (key: string) => {
    return key.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const isFieldRequired = (key: string) => {
    const field = fields.find(f => f.key === key);
    return field?.validation.required || false;
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

        setShowSuccess(true);
        setTimeout(() => {
          router.push('/jobs');
        }, 2000);
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Application Submitted Successfully!
        </h2>
        <p className="text-gray-600 mb-4">
          Thank you for applying. We'll review your application and get back to you soon.
        </p>
        <p className="text-sm text-gray-500">Redirecting to job listings...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {fields.map((field) => {
        const fieldKey = field.key as keyof ApplicationFormData;
        const isRequired = field.validation.required;
        const label = getFieldLabel(field.key);

        // Full Name
        if (field.key === 'full_name') {
          return (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {label} {isRequired && <span className="text-red-600">*</span>}
              </Label>
              <Input
                id={field.key}
                {...register(fieldKey, validationRules[field.key])}
                placeholder="Enter your full name"
              />
              {errors[fieldKey] && (
                <p className="text-sm text-red-600 mt-1">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Photo Profile with Gesture Capture
        if (field.key === 'photo_profile') {
          return (
            <div key={field.key}>
              <Label>
                {label} {isRequired && <span className="text-red-600">*</span>}
              </Label>
              <GestureCapture
                onCapture={(imageData) => setValue('photo_profile', imageData)}
                currentImage={photoProfile}
              />
              {errors[fieldKey] && (
                <p className="text-sm text-red-600 mt-1">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Gender
        if (field.key === 'gender') {
          return (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {label} {isRequired && <span className="text-red-600">*</span>}
              </Label>
              <select
                id={field.key}
                {...register(fieldKey, validationRules[field.key])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              {errors[fieldKey] && (
                <p className="text-sm text-red-600 mt-1">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Email
        if (field.key === 'email') {
          return (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {label} {isRequired && <span className="text-red-600">*</span>}
              </Label>
              <Input
                id={field.key}
                type="email"
                {...register(fieldKey, validationRules[field.key])}
                placeholder="your.email@example.com"
              />
              {errors[fieldKey] && (
                <p className="text-sm text-red-600 mt-1">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Phone Number
        if (field.key === 'phone_number') {
          return (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {label} {isRequired && <span className="text-red-600">*</span>}
              </Label>
              <Input
                id={field.key}
                type="tel"
                {...register(fieldKey, validationRules[field.key])}
                placeholder="+62 812-1234-5678"
              />
              {errors[fieldKey] && (
                <p className="text-sm text-red-600 mt-1">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // LinkedIn Link
        if (field.key === 'linkedin_link') {
          return (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {label} {isRequired && <span className="text-red-600">*</span>}
              </Label>
              <Input
                id={field.key}
                type="url"
                {...register(fieldKey, validationRules[field.key])}
                placeholder="https://linkedin.com/in/yourprofile"
              />
              {errors[fieldKey] && (
                <p className="text-sm text-red-600 mt-1">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Date of Birth
        if (field.key === 'date_of_birth') {
          return (
            <div key={field.key}>
              <Label htmlFor={field.key}>
                {label} {isRequired && <span className="text-red-600">*</span>}
              </Label>
              <Input
                id={field.key}
                type="date"
                {...register(fieldKey, validationRules[field.key])}
              />
              {errors[fieldKey] && (
                <p className="text-sm text-red-600 mt-1">{errors[fieldKey]?.message}</p>
              )}
            </div>
          );
        }

        // Default (Domicile and other text fields)
        return (
          <div key={field.key}>
            <Label htmlFor={field.key}>
              {label} {isRequired && <span className="text-red-600">*</span>}
            </Label>
            <Input
              id={field.key}
              {...register(fieldKey, validationRules[field.key])}
              placeholder={`Enter your ${label.toLowerCase()}`}
            />
            {errors[fieldKey] && (
              <p className="text-sm text-red-600 mt-1">{errors[fieldKey]?.message}</p>
            )}
          </div>
        );
      })}

      <div className="pt-6 border-t">
        <Button 
          type="submit" 
          size="lg" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Application'}
        </Button>
      </div>
    </form>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { createClient } from '@/utils/supabase/client';
import { regionalAPI, type Province } from '@/lib/regional-api';
import type { Job, ApplicationFormData } from '@/lib/types';
import DatePicker from '@/components/ui/date-picker';
import { CountryPhoneInput } from '@/components/ui/country-phone-input';

interface DynamicApplicationFormProps {
  job: Job;
}

export function DynamicApplicationForm({ job }: DynamicApplicationFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [phoneValid, setPhoneValid] = useState(true);

  const fields = job.application_form?.sections[0].fields || [];

  // Load provinces from API
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const provincesData = await regionalAPI.getProvinces()
        setProvinces(provincesData)
      } catch (error) {
        console.error('Error loading provinces:', error)
      } finally {
        setLoadingProvinces(false)
      }
    }

    loadProvinces()
  }, [])

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
        validationRules[field.key].validate = (value: string) => {
          if (!value && field.validation.required) {
            return 'Phone number is required';
          }
          // Basic validation - check if it starts with + and contains digits
          if (value && !(/^\+\d+/.test(value))) {
            return 'Please enter a valid phone number';
          }
          return true;
        };
      }
    }
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ApplicationFormData>();

  // Use useWatch instead of watch for React 19.2 compatibility
  const photoProfile = useWatch({ control, name: 'photo_profile' });

  // Memoized phone number change handler
  const handlePhoneChange = useCallback((value: string) => {
    setValue('phone_number', value, { shouldValidate: false });
  }, [setValue]);

  // Watch all fields that might need conditional rendering
  // This ensures hooks are always called in the same order
  const domicileValue = useWatch({ control, name: 'domicile' });
  const dateOfBirthValue = useWatch({ control, name: 'date_of_birth' });

  // Load user profile and pre-populate form
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoadingProfile(false);
          return;
        }

        // Get user profile data
        const { data: profileData } = await supabase
          .from('users')
          .select('full_name, profile_photo_url, profile_photo_name, domicile, phone_number, linkedin_link, date_of_birth, gender')
          .eq('id', user.id)
          .single();

        if (profileData) {
          // Pre-populate form fields with existing profile data
          const defaultValues: ApplicationFormData = {};

          // Map all profile fields to form fields
          if (profileData.full_name) {
            setValue('full_name', profileData.full_name);
          }

          if (profileData.domicile) {
            setValue('domicile', profileData.domicile);
          }

          if (profileData.phone_number) {
            setValue('phone_number', profileData.phone_number);
          }

          if (profileData.linkedin_link) {
            setValue('linkedin_link', profileData.linkedin_link);
          }

          if (profileData.date_of_birth) {
            // Format date for input field (YYYY-MM-DD)
            const dateObj = new Date(profileData.date_of_birth);
            const formattedDate = dateObj.toISOString().split('T')[0];
            setValue('date_of_birth', formattedDate);
          }

          if (profileData.gender) {
            setValue('gender', profileData.gender);
          }

          // Set email from auth user
          if (user.email) {
            setValue('email', user.email);
          }

              // Profile photo URL - convert to base64 for the form
          if (profileData.profile_photo_url) {
            try {
              const base64Photo = await convertImageUrlToBase64(profileData.profile_photo_url);
              if (base64Photo) {
                setValue('photo_profile', base64Photo);
                console.log('Profile photo converted and pre-filled');
              }
            } catch (error) {
              console.error('Error converting profile photo:', error);
            }
          }

          console.log('Form pre-populated with profile data');
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadProfileData();
  }, [setValue]);
  
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

        // Auto-populate user profile from application data
        await autoPopulateUserProfile(data);

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

  // Helper function to convert image URL to base64
  const convertImageUrlToBase64 = async (imageUrl: string): Promise<string | null> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image URL to base64:', error);
      return null;
    }
  };

  // Function to auto-populate user profile from application data
  const autoPopulateUserProfile = async (applicationData: ApplicationFormData) => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Prepare profile update data from application
      const profileUpdates: Record<string, unknown> = {};

      // Map application fields to profile fields
      if (applicationData.full_name) {
        profileUpdates.full_name = applicationData.full_name;
      }

      if (applicationData.photo_profile) {
        // For profile photo, we'd need to handle base64 to Supabase Storage
        // For now, we'll skip photo auto-population as it needs special handling
        console.log('Profile photo update skipped - needs storage handling');
      }

      // Check if user profile exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('full_name, profile_photo_url, profile_photo_name, domicile, phone_number, linkedin_link, date_of_birth, gender')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        // Only update fields that are currently empty/null
        const updatesToApply: Record<string, unknown> = {};

        // Auto-populate fields from application data
        if (!existingProfile.full_name && applicationData.full_name) {
          updatesToApply.full_name = applicationData.full_name;
        }

        if (!existingProfile.domicile && applicationData.domicile) {
          updatesToApply.domicile = applicationData.domicile;
        }

        if (!existingProfile.phone_number && applicationData.phone_number) {
          updatesToApply.phone_number = applicationData.phone_number;
        }

        if (!existingProfile.linkedin_link && applicationData.linkedin_link) {
          updatesToApply.linkedin_link = applicationData.linkedin_link;
        }

        if (!existingProfile.date_of_birth && applicationData.date_of_birth) {
          updatesToApply.date_of_birth = applicationData.date_of_birth;
        }

        if (!existingProfile.gender && applicationData.gender) {
          updatesToApply.gender = applicationData.gender;
        }

        // Only update if there are changes to apply
        if (Object.keys(updatesToApply).length > 0) {
          await supabase
            .from('users')
            .update(updatesToApply)
            .eq('id', user.id);

          // Also update user metadata for consistency
          if (updatesToApply.full_name) {
            await supabase.auth.updateUser({
              data: { full_name: updatesToApply.full_name }
            });
          }

          console.log('Profile auto-populated with application data:', Object.keys(updatesToApply));
        }
      }
    } catch (error) {
      console.error('Error auto-populating profile:', error);
      // Don't show error to user as this is a background operation
    }
  };

  // Remove the success state handling from here since we now redirect to a separate page

  // Show loading state while profile data is being loaded
  if (loadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-600">Loading profile data...</span>
      </div>
    );
  }

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
              <DatePicker
                value={dateOfBirthValue || ''}
                onChange={(value) => setValue(fieldKey, value)}
                placeholder="Select your date of birth"
                className={cn(
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

        // Domicile (5th) - Indonesian Provinces from API
        if (field.key === 'domicile') {
          return (
            <div key={field.key} className="space-y-2">
              <label className="text-s-regular text-neutral-100 block">
                Domicile (Province){isRequired && <span className="text-danger-main">*</span>}
              </label>
              <Select
                value={domicileValue}
                onValueChange={(value) => setValue(fieldKey, value)}
                disabled={loadingProvinces}
              >
                <SelectTrigger className={cn(
                  "h-12 border-2 bg-neutral-10",
                  errors[fieldKey] ? "border-danger-main focus:border-danger-main focus:ring-2 focus:ring-danger-focus" : "border-neutral-40 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                )}>
                  <SelectValue placeholder={loadingProvinces ? "Loading provinces..." : "Choose your province"} />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.name}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingProvinces && (
                <p className="text-xs text-neutral-60 mt-1">Loading Indonesian provinces...</p>
              )}
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
              <CountryPhoneInput
                value={watch('phone_number') || ''}
                onChange={handlePhoneChange}
                placeholder="Enter phone number"
                error={errors[fieldKey]?.message}
                className={cn(
                  errors[fieldKey]
                    ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                    : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                )}
              />
              {/* Hidden input for react-hook-form validation */}
              <input
                type="hidden"
                {...register(fieldKey, validationRules[field.key])}
              />
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

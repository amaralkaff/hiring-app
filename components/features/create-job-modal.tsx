'use client';

import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from '@/components/ui/sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useController } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface CreateJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated: () => void;
}

interface JobFormData {
  title: string;
  department: string;
  description: string;
  salary_min: string;
  salary_max: string;
  status: 'active' | 'draft' | 'inactive';
}

type FieldRequirement = 'mandatory' | 'optional' | 'off';

const PROFILE_FIELDS = [
  { key: 'full_name', label: 'Full Name', mandatoryOnly: true },
  { key: 'photo_profile', label: 'Photo Profile', mandatoryOnly: true },
  { key: 'gender', label: 'Gender', mandatoryOnly: false },
  { key: 'domicile', label: 'Domicile', mandatoryOnly: false },
  { key: 'email', label: 'Email', mandatoryOnly: true },
  { key: 'phone_number', label: 'Phone Number', mandatoryOnly: false },
  { key: 'linkedin_link', label: 'LinkedIn Link', mandatoryOnly: false },
  { key: 'date_of_birth', label: 'Date of Birth', mandatoryOnly: false },
];

export function CreateJobModal({ open, onOpenChange, onJobCreated }: CreateJobModalProps) {
  const { register, handleSubmit, reset, watch, formState: { errors }, control } = useForm<JobFormData>({
    mode: 'onChange'
  });
  const [fieldRequirements, setFieldRequirements] = useState<Record<string, FieldRequirement>>({
    full_name: 'mandatory',
    photo_profile: 'mandatory',
    gender: 'mandatory',
    domicile: 'optional',
    email: 'mandatory',
    phone_number: 'mandatory',
    linkedin_link: 'mandatory',
    date_of_birth: 'off',
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Controller for the status field
  const { field: statusField } = useController({
    name: 'status',
    control,
    defaultValue: undefined,
    rules: { required: 'Job status is required' }
  });
  
  const formatSalary = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    // Add dots every 3 digits from right
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };


  
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const handleDescriptionInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const value = textarea.value;
    
    // Add bullet to first character if empty and user starts typing
    if (value.length === 1 && !value.startsWith('•')) {
      textarea.value = '• ' + value;
      textarea.selectionStart = textarea.selectionEnd = 3;
      return;
    }
    
    // Remove bullet point if only "• " remains (user deleted all text after bullet)
    if (value === '• ' || value === '•') {
      textarea.value = '';
      return;
    }
    
    adjustTextareaHeight();
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      // Add new line with bullet point
      const newValue = value.substring(0, start) + '\n• ' + value.substring(end);
      textarea.value = newValue;
      
      // Set cursor position after the bullet
      textarea.selectionStart = textarea.selectionEnd = start + 3;
      
      // Trigger change event for react-hook-form
      const event = new Event('input', { bubbles: true });
      textarea.dispatchEvent(event);
      
      // Adjust height
      adjustTextareaHeight();
    }
  };
  
  // Watch all required fields
  const watchAllFields = watch();
  const statusValue = watch('status');
  
  const isFormValid = !!(
    watchAllFields.title &&
    watchAllFields.department &&
    statusValue &&
    watchAllFields.description &&
    watchAllFields.salary_min &&
    watchAllFields.salary_max &&
    typeof watchAllFields.description === 'string' && watchAllFields.description.trim().length > 0 &&
    typeof watchAllFields.salary_min === 'string' && watchAllFields.salary_min.replace(/\D/g, '').length > 0 &&
    typeof watchAllFields.salary_max === 'string' && watchAllFields.salary_max.replace(/\D/g, '').length > 0
  );

  const handleFieldRequirementChange = (field: string, value: FieldRequirement) => {
    setFieldRequirements(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const onSubmit = async (data: JobFormData) => {
    // Generate job ID and slug
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const slug = data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    // Build application form config based on field requirements
    const fields = PROFILE_FIELDS
      .filter(field => fieldRequirements[field.key] !== 'off')
      .map(field => ({
        key: field.key,
        validation: {
          required: fieldRequirements[field.key] === 'mandatory',
        },
      }));

    // Parse salary values to numbers
    const salaryMin = parseInt(data.salary_min.toString().replace(/\D/g, ''));
    const salaryMax = parseInt(data.salary_max.toString().replace(/\D/g, ''));

    const newJob = {
      id: jobId,
      slug,
      title: data.title,
      department: data.department,
      description: data.description,
      status: data.status,
      salary_range: {
        min: salaryMin,
        max: salaryMax,
        currency: 'IDR',
        display_text: `Rp${salaryMin.toLocaleString()} - Rp${salaryMax.toLocaleString()}`,
      },
      list_card: {
        badge: data.status.charAt(0).toUpperCase() + data.status.slice(1),
        started_on_text: `started on ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`,
        cta: 'Manage Job',
      },
      application_form: {
        sections: [
          {
            title: 'Minimum Profile Information Required',
            fields,
          },
        ],
      },
    };

    try {
      // Save to Supabase database
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newJob),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      // Show success toast
      toast.success('Job vacancy successfully created');

      // Reset form
      reset();
      onJobCreated();
    } catch (error) {
      console.error('Error creating job:', error);
      toast.error('Failed to create job. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-8 pt-6 pb-6 border-b border-neutral-40 flex-shrink-0 flex flex-row items-center justify-between">
          <DialogTitle className="heading-m-bold text-neutral-100">Job Opening</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-4">
          {/* Job Name */}
          <div className="space-y-2">
            <label className="text-s-regular text-neutral-100 block">
              Job Name<span className="text-danger-main">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex. Front End Engineer"
              {...register('title', { required: 'Job name is required' })}
              className={cn(
                "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                errors.title
                  ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                  : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
              )}
            />
            {errors.title && <p className="text-s-regular text-danger-main mt-2">{errors.title.message}</p>}
          </div>

          {/* Department */}
          <div className="space-y-2">
            <label className="text-s-regular text-neutral-100 block">
              Department<span className="text-danger-main">*</span>
            </label>
            <input
              type="text"
              placeholder="Ex. Engineering"
              {...register('department', { required: 'Department is required' })}
              className={cn(
                "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                errors.department
                  ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                  : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
              )}
            />
            {errors.department && <p className="text-s-regular text-danger-main mt-2">{errors.department.message}</p>}
          </div>

          {/* Job Status */}
          <div className="space-y-2">
            <label className="text-s-regular text-neutral-100 block">
              Job Status<span className="text-danger-main">*</span>
            </label>
            <Select
              value={statusField.value}
              onValueChange={statusField.onChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select job status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && <p className="text-s-regular text-danger-main mt-2">{errors.status.message}</p>}
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <label className="text-s-regular text-neutral-100 block">
              Job Description<span className="text-danger-main">*</span>
            </label>
            <textarea
              {...register('description', { 
                required: 'Job description is required',
                onChange: () => {
                  adjustTextareaHeight();
                }
              })}
              ref={(e) => {
                register('description').ref(e);
                textareaRef.current = e;
              }}
              placeholder="Ex."
              rows={4}
              onInput={handleDescriptionInput}
              onKeyDown={handleDescriptionKeyDown}
              className={`w-full px-4 py-3 text-m-regular rounded-lg border-2 transition-all outline-none resize-none overflow-hidden ${
                errors.description
                  ? 'border-danger-main'
                  : 'border-neutral-40 focus:border-primary-main focus:ring-2 focus:ring-primary-focus'
              }`}
            />
            {errors.description && <p className="text-s-regular text-danger-main">{errors.description.message}</p>}
          </div>

          {/* Job Salary */}
          <div className="space-y-4">
            <h3 className="text-m-bold text-neutral-100">Job Salary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-s-regular text-neutral-100 block">Minimum Estimated Salary<span className="text-danger-main">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-m-regular text-neutral-80">
                    Rp
                  </span>
                  <input
                    type="text"
                    {...register('salary_min', {
                      required: 'Minimum salary is required',
                      validate: (value) => {
                        const numericValue = value.replace(/\D/g, '');
                        return numericValue.length > 0 || 'Minimum salary is required';
                      },
                      onChange: (e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        if (rawValue) {
                          const formatted = formatSalary(rawValue);
                          e.target.value = formatted;
                          return formatted;
                        }
                        return '';
                      }
                    })}
                    placeholder="7.000.000"
                    className="w-full h-12 pl-12 pr-4 text-m-regular rounded-lg border-2 border-neutral-40 focus:border-primary-main focus:ring-2 focus:ring-primary-focus outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-s-regular text-neutral-100 block">Maximum Estimated Salary<span className="text-danger-main">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-m-regular text-neutral-80">
                    Rp
                  </span>
                  <input
                    type="text"
                    {...register('salary_max', {
                      required: 'Maximum salary is required',
                      validate: (value) => {
                        const numericValue = value.replace(/\D/g, '');
                        return numericValue.length > 0 || 'Maximum salary is required';
                      },
                      onChange: (e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        if (rawValue) {
                          const formatted = formatSalary(rawValue);
                          e.target.value = formatted;
                          return formatted;
                        }
                        return '';
                      }
                    })}
                    placeholder="8.000.000"
                    className="w-full h-12 pl-12 pr-4 text-m-regular rounded-lg border-2 border-neutral-40 focus:border-primary-main focus:ring-2 focus:ring-primary-focus outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Minimum Profile Information Required */}
          <div className="space-y-4">
            <h3 className="text-l-bold text-neutral-100">Minimum Profile Information Required</h3>

            <div className="bg-neutral-0 rounded-xl p-6 space-y-3">
              {PROFILE_FIELDS.map((field, index) => (
                <div 
                  key={field.key} 
                  className={cn(
                    "flex items-center justify-between py-3",
                    index !== PROFILE_FIELDS.length - 1 && "border-b border-neutral-40"
                  )}
                >
                  <span className="text-m-regular text-neutral-100">{field.label}</span>
                  <div className="flex gap-2">
                    <Chip
                      variant="rest"
                      active={fieldRequirements[field.key] === 'mandatory'}
                      disabled={field.mandatoryOnly}
                      onClick={() => handleFieldRequirementChange(field.key, 'mandatory')}
                      className={field.mandatoryOnly ? "" : "cursor-pointer"}
                      hideIcon
                    >
                      Mandatory
                    </Chip>
                    <Chip
                      variant="rest"
                      active={fieldRequirements[field.key] === 'optional'}
                      disabled={field.mandatoryOnly}
                      onClick={() => !field.mandatoryOnly && handleFieldRequirementChange(field.key, 'optional')}
                      className={field.mandatoryOnly ? "" : "cursor-pointer"}
                      hideIcon
                    >
                      Optional
                    </Chip>
                    <Chip
                      variant="rest"
                      active={fieldRequirements[field.key] === 'off'}
                      disabled={field.mandatoryOnly}
                      onClick={() => !field.mandatoryOnly && handleFieldRequirementChange(field.key, 'off')}
                      className={field.mandatoryOnly ? "" : "cursor-pointer"}
                      hideIcon
                    >
                      Off
                    </Chip>
                  </div>
                </div>
              ))}
            </div>
          </div>

          </div>
        </div>

        {/* Fixed Footer with Publish Button */}
        <div className="flex-shrink-0 px-8 py-4 border-t border-neutral-40 bg-neutral-10">
          <div className="flex justify-end">
            <Button 
              onClick={handleSubmit(onSubmit)}
              disabled={!isFormValid}
              className="bg-primary-main hover:bg-primary-hover active:bg-primary-pressed disabled:bg-neutral-40 disabled:text-neutral-60 disabled:cursor-not-allowed text-m-bold text-neutral-10 px-8 h-12 rounded-lg transition-all"
            >
              Publish Job
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

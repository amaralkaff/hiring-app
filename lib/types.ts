// Core types based on the case study requirements

export interface Job {
  id: string;
  slug: string;
  title: string;
  description?: string;
  department?: string;
  status: "active" | "inactive" | "draft" | "full-time" | "part-time" | "contract" | "internship" | "freelance";
  salary_range: {
    min: number;
    max: number;
    currency: string;
    display_text: string;
  };
  list_card: {
    badge: string;
    started_on_text: string;
    cta: string;
  };
  application_form?: ApplicationFormConfig;
}

export interface ApplicationFormConfig {
  sections: FormSection[];
}

export interface FormSection {
  title: string;
  fields: FieldConfig[];
}

export interface FieldConfig {
  key: string;
  validation: {
    required: boolean;
  };
}

export interface Candidate {
  id: string;
  job_id: string;
  attributes: CandidateAttribute[];
  created_at?: string;
  users?: {
    id: string;
    email: string;
    full_name: string;
    role: UserRole;
  };
}

export interface CandidateAttribute {
  key: string;
  label: string;
  value: string | null;
  order: number;
}

// Form data types
export interface ApplicationFormData {
  full_name?: string;
  photo_profile?: string; // Base64 image
  gender?: string;
  domicile?: string;
  email?: string;
  phone_number?: string;
  linkedin_link?: string;
  date_of_birth?: string;
}

// User role type
export type UserRole = "admin" | "applicant" | null;

// User types
export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  session: UserSession;
  error?: string;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
}

// Table column type for TanStack Table
export interface TableColumn {
  id: string;
  label: string;
  order: number;
  width?: number;
}

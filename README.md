# Hiring Management Web App

A modern, enterprise-grade hiring management application built with **Next.js 16**, **React 19.2**, and **TypeScript**. Features dynamic form validation, resizable/reorderable tables, and AI-powered hand gesture photo capture.

## Tech Stack

### Core
- **Next.js 16.0.0** (App Router, Turbopack stable)
- **React 19.2.0** + **TypeScript 5.x**
- **TailwindCSS v4** + **shadcn/ui**

### State & Forms
- **Zustand** - Global state management
- **React Hook Form** - Dynamic form validation
- **Zod** - Schema validation

### Advanced Features
- **TanStack Table v8** - Resizable/reorderable columns
- **react-webcam** - Camera access
- **@mediapipe/tasks-vision** - Hand gesture detection (1-2-3 fingers)

## Features

### Admin (Recruiter)
- Job list with filtering/sorting by status
- Create job modal with configurable application fields
- Candidate management with resizable & reorderable table
- Dynamic field configuration (mandatory/optional/off)

### Applicant (Job Seeker)
- Browse active job postings
- View job details (salary, department, description)
- Dynamic application form based on job configuration
- Profile photo via hand gesture capture (1→2→3 fingers)
- Form validation with real-time feedback

## Project Structure

```
hiring-app/
├── app/
│   ├── (admin)/              # Admin routes (protected)
│   │   ├── dashboard/        # Job list + Create modal
│   │   └── candidates/[jobId]/ # Candidate table
│   ├── (applicant)/          # Applicant routes (public)
│   │   └── jobs/[slug]/apply/  # Dynamic form + gesture
│   ├── api/                  # Mock API routes
│   └── layout.tsx
├── components/
│   ├── features/             # Complex components
│   ├── shared/               # Reusable components
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── types.ts              # TypeScript interfaces
│   └── utils.ts              # Utilities
├── store/
│   └── app-store.ts          # Zustand store
└── data/
```

## Implementation Status

### ✅ Completed Features

**🧑‍💼 Admin (Recruiter)**
- [x] Job list with sorting and filtering
- [x] Create job modal with field configuration
- [x] Candidate management with resizable/reorderable tables
- [x] Dynamic field settings (mandatory/optional/off)

**👩‍💻 Applicant (Job Seeker)**
- [x] Job browsing and search
- [x] Dynamic application forms
- [x] Hand gesture photo capture (1-2-3 fingers)
- [x] Real-time form validation

**🔧 Technical**
- [x] Authentication (magic link + password + Google OAuth)
- [x] Supabase database integration
- [x] Responsive design with TailwindCSS
- [x] TypeScript throughout

### MediaPipe Model
Download the hand landmark model:
```bash
# Place in public/models/hand_landmarker.task
curl -o public/models/hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
```

## Documentation

- [Next.js 16 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [shadcn/ui Components](https://ui.shadcn.com)
- [TanStack Table](https://tanstack.com/table/latest)
- [MediaPipe Tasks Vision](https://developers.google.com/mediapipe/solutions/vision/hand_landmarker)


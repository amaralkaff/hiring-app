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
    ├── mock-jobs.json        # Sample job data
    └── mock-candidates.json  # Sample candidate data
```

## Implementation Status

### Completed
- [x] Next.js 16 project initialization
- [x] TailwindCSS & shadcn/ui setup
- [x] TypeScript types & interfaces
- [x] Zustand store configuration
- [x] Mock data files (jobs & candidates)
- [x] Project structure with route groups
- [x] All required dependencies installed

### In Progress (Next Steps)
- [ ] Home page with role selector
- [ ] Admin dashboard (job list)
- [ ] Create job modal with field configuration
- [ ] Applicant job browsing
- [ ] Dynamic application form
- [ ] Hand gesture photo capture
- [ ] Resizable/reorderable candidate table
- [ ] API routes (mock backend)
- [ ] Error handling & success states
- [ ] Responsive design

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


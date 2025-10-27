# Hiring Management Web App

Modern hiring platform built with **Next.js 16**, **React 19.2**, and **TypeScript**. Features dynamic forms, resizable tables, and AI-powered hand gesture photo capture.

## Tech Stack

- **Next.js 16** + **React 19.2** + **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **Supabase** for database & auth
- **MediaPipe** for hand gesture detection
- **TanStack Table** for advanced tables

## Features

### Admin (Recruiter)
- ✅ Job list with sorting & filtering
- ✅ Create jobs with dynamic field configuration
- ✅ Resizable & reorderable candidate tables
- ✅ Real-time validation

### Applicant (Job Seeker)
- ✅ Browse active jobs
- ✅ Dynamic application forms
- ✅ Hand gesture photo capture (1→2→3 fingers)
- ✅ Success/error feedback

## How to Run

```bash
# Install
npm install

# Setup environment
cp .env.example .env.local
# Add your Supabase credentials

# Download MediaPipe model
mkdir -p public/models
curl -o public/models/hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
hiring-app/
├── app/
│   ├── (admin)/dashboard/          # Admin dashboard
│   ├── (applicant)/jobs/           # Job listings & applications
│   ├── api/                        # API routes
│   └── auth/                       # Authentication
├── components/
│   ├── features/                   # Complex components
│   └── ui/                        # shadcn/ui components
├── lib/types.ts                   # TypeScript types
└── utils/supabase/               # Database setup
```

## Key Components

- **Dynamic Forms** - Fields generated from job configuration
- **Hand Gesture Capture** - MediaPipe integration for photo capture
- **Advanced Tables** - Resizable, sortable, searchable data tables
- **Authentication** - Multiple auth methods via Supabase



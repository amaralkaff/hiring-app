'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { cn } from '@/lib/utils';
import type { Job } from '@/lib/types';
import { CreateJobModal } from '@/components/features/create-job-modal';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchQuery]);

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs');
      const data = await response.json();
      setJobs(data.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.department?.toLowerCase().includes(query)
      );
    }

    setFilteredJobs(filtered);
  };

  const handleJobCreated = () => {
    fetchJobs();
    setIsCreateModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-20">
        <p className="text-neutral-80">Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-20">
      {/* Header */}
      <div className="bg-neutral-10 border-b border-neutral-40">
        <div className="max-w-[1400px] mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="heading-s-bold text-neutral-100">Job List</h1>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-300 flex items-center justify-center">
            <UserIcon className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search Bar */}
            <div className="mb-8">
              <TextField
                type="text"
                placeholder="Search by job details"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                suffix={<MagnifyingGlassIcon className="w-5 h-5 text-primary-main" />}
              />
            </div>

            {/* Job List or Empty State */}
            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                {/* Empty State Illustration */}
                <div className="mb-8">
                  <img 
                    src="/artwork-no-job.png" 
                    alt="No job openings" 
                    className="w-64 h-auto"
                  />
                </div>

                <h2 className="heading-m-bold text-neutral-100 mb-2">No job openings available</h2>
                <p className="text-m-regular text-neutral-80 mb-6">Create a job opening now and start the candidate process.</p>
                
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-secondary-main hover:bg-secondary-hover active:bg-secondary-pressed text-m-bold text-black px-8 h-11 rounded-lg"
                >
                  Create a new job
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredJobs.map((job) => {
                  // Determine badge color based on status
                  const getBadgeStyles = (status: string) => {
                    switch (status.toLowerCase()) {
                      case 'active':
                      case 'full-time':
                      case 'part-time':
                      case 'contract':
                        return 'bg-success-main text-white border-success-main';
                      case 'inactive':
                        return 'bg-danger-main text-white border-danger-main';
                      case 'draft':
                      case 'freelance':
                      case 'internship':
                        return 'bg-warning-main text-white border-warning-main';
                      default:
                        return 'bg-neutral-60 text-white border-neutral-60';
                    }
                  };

                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl shadow-[0px_4px_8px_0px_rgba(0,0,0,0.1)] p-6 flex flex-col gap-3"
                    >
                      {/* Top row - badges only */}
                      <div className="flex items-center gap-3">
                        {/* Status Badge */}
                        <span
                          className={cn(
                            'inline-flex items-center px-4 py-2 rounded-lg text-s-bold border-2',
                            getBadgeStyles(job.status)
                          )}
                        >
                          {job.list_card.badge}
                        </span>
                        
                        {/* Date */}
                        <span className="text-m-regular text-neutral-60 bg-neutral-20 px-4 py-2 rounded-lg border border-neutral-40">
                          {job.list_card.started_on_text}
                        </span>
                      </div>

                      {/* Bottom row - Job info and button */}
                      <div className="flex items-end justify-between gap-4">
                        {/* Left - Job title and salary */}
                        <div className="flex flex-col gap-1 flex-1">
                          {/* Job Title */}
                          <h3 className="heading-m-bold text-neutral-100">
                            {job.title}
                          </h3>

                          {/* Salary */}
                          <p className="text-l-regular text-neutral-70">
                            {job.salary_range.display_text}
                          </p>
                        </div>

                        {/* Right - Action button */}
                        <Link href={`/candidates/${job.id}`}>
                          <Button
                            className="bg-primary-main hover:bg-primary-hover active:bg-primary-pressed !text-white text-s-bold px-6 py-2 h-7 rounded-lg whitespace-nowrap"
                          >
                            {job.list_card.cta}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar - Recruitment Card */}
          <div className="w-80 flex-shrink-0">
            <div 
              className="relative rounded-2xl p-6 text-white sticky top-8 overflow-hidden shadow-lg"
              style={{
                backgroundImage: 'url(/bg-recruiter-new.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Dark overlay */}
              <div className="absolute inset-0 bg-black/65 rounded-2xl"></div>
              
              <div className="relative z-10">
                <h3 className="heading-s-bold mb-2">Recruit the best candidates</h3>
                <p className="text-m-regular text-neutral-30 mb-6">Create jobs, invite, and hire with ease</p>
                <Button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="w-full bg-primary-main hover:bg-primary-hover active:bg-primary-pressed text-m-bold text-neutral-10 h-11 rounded-lg"
                >
                  Create a new job
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Job Modal */}
      <CreateJobModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onJobCreated={handleJobCreated}
      />
    </div>
  );
}

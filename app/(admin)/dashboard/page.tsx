'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MagnifyingGlassIcon, FunnelIcon, ArrowsUpDownIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Job } from '@/lib/types';
import { CreateJobModal } from '@/components/features/create-job-modal';

type StatusFilter = 'all' | 'active' | 'inactive' | 'draft';
type SortOption = 'date-desc' | 'date-asc' | 'title-asc' | 'title-desc' | 'status';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const filterAndSortJobs = useCallback(() => {
    let filtered = [...jobs];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(query) ||
        job.department?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'date-desc':
          // Newest first (assuming higher IDs are newer)
          return b.id.localeCompare(a.id);
        case 'date-asc':
          // Oldest first
          return a.id.localeCompare(b.id);
        case 'title-asc':
          return a.title.localeCompare(b.title);
        case 'title-desc':
          return b.title.localeCompare(a.title);
        case 'status':
          // Order: active, draft, inactive
          const statusOrder = { active: 0, draft: 1, inactive: 2 };
          return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  }, [jobs, searchQuery, statusFilter, sortOption]);

  // Apply filtering and sorting whenever dependencies change
  useEffect(() => {
    filterAndSortJobs();
  }, [filterAndSortJobs]);

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs();
  }, []);

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
      <div className="mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Search Bar and Filters */}
            <div className="mb-6 space-y-4">
              <TextField
                type="text"
                placeholder="Search by job details"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                suffix={<MagnifyingGlassIcon className="w-5 h-5 text-primary-main" />}
              />
              
              {/* Filter and Sort Controls */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <FunnelIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-main pointer-events-none z-10" />
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                    <SelectTrigger className="w-full pl-12">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 relative">
                  <ArrowsUpDownIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-main pointer-events-none z-10" />
                  <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                    <SelectTrigger className="w-full pl-12">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest First</SelectItem>
                      <SelectItem value="date-asc">Oldest First</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Job List or Empty State */}
            {filteredJobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                {/* Empty State Illustration */}
                <div className="mb-8">
                  <Image
                    src="/artwork-no-job.png"
                    alt="No job openings"
                    width={256}
                    height={192}
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
                  // Determine badge color and style based on status
                  const getBadgeStyles = (status: string) => {
                    switch (status.toLowerCase()) {
                      case 'active':
                        return { 
                          textColor: 'text-success-main',
                          bgColor: '#B8DBCA',
                          borderColor: '#B8DBCA'
                        };
                      case 'inactive':
                        return { 
                          textColor: 'text-danger-main',
                          bgColor: '#F5B1B7',
                          borderColor: '#F5B1B7'
                        };
                      case 'draft':
                        return { 
                          textColor: 'text-warning-main',
                          bgColor: '#FEEABC',
                          borderColor: '#FEEABC'
                        };
                      default:
                        return { 
                          textColor: 'text-neutral-60',
                          bgColor: '#737373',
                          borderColor: '#737373'
                        };
                    }
                  };

                  return (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl shadow-[0px_4px_8px_0px_rgba(0,0,0,0.1)] p-6"
                    >
                      {/* Top row - badges and date */}
                      <div className="flex items-center gap-3 mb-4">
                        {/* Status Badge */}
                        <span
                          className={cn(
                            'inline-flex items-center px-4 py-2 rounded-lg text-s-bold relative',
                            getBadgeStyles(job.status).textColor
                          )}
                          style={{ 
                            border: `1px solid ${getBadgeStyles(job.status).borderColor}`,
                            backgroundColor: `${getBadgeStyles(job.status).bgColor}80`
                          }}
                        >
                          {job.list_card.badge}
                        </span>
                        
                        {/* Date */}
                        <span className="text-m-regular text-neutral-60 bg-neutral-20 px-4 py-2 rounded-lg border border-neutral-40">
                          {job.list_card.started_on_text}
                        </span>
                      </div>

                      {/* Middle & Bottom row - Job info and button */}
                      <div className="flex items-end justify-between gap-4">
                        {/* Left - Job title, department, and salary */}
                        <div className="flex flex-col gap-2 flex-1">
                          {/* Job Title */}
                          <h3 className="heading-m-bold text-neutral-100">
                            {job.title}
                          </h3>

                          {/* Department */}
                          {job.department && (
                            <p className="text-m-regular text-neutral-80">
                              {job.department}
                            </p>
                          )}

                          {/* Salary */}
                          <p className="text-l-regular text-neutral-70">
                            {job.salary_range.display_text}
                          </p>
                        </div>

                        {/* Right - Action button */}
                        <Link href={`/dashboard/candidates/${job.id}`}>
                          <Button
                            className="bg-primary-main hover:bg-primary-hover active:bg-primary-pressed !text-white text-m-bold px-6 py-3 rounded-lg whitespace-nowrap"
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

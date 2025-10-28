'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut as serverSignOut } from '@/app/auth/actions';
import { createClient } from '@/utils/supabase/client';

interface UserDropdownProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
    };
  };
  userRole: string;
}

export function UserDropdown({ user, userRole }: UserDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
  const [profileData, setProfileData] = useState<{
    profile_photo_url: string | null;
    profile_photo_name: string | null;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const getDisplayName = () => {
    return user.user_metadata?.full_name || user.email || '';
  };

  const getProfilePhotoUrl = () => {
    if (profileData?.profile_photo_url) {
      return profileData.profile_photo_url;
    }

    // Fallback to UI avatar (will be handled by onError)
    const fullName = user.user_metadata?.full_name || user.email || '';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=01959F&color=fff&size=32`;
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('profile_photo_url, profile_photo_name')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows

        if (error) {
          console.error('Error loading profile data:', error);
          setProfileData(null);
        } else {
          setProfileData(data);
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
        setProfileData(null);
      }
    };

    fetchProfileData();
  }, [user, supabase]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-sm rounded-lg hover:bg-gray-100 p-2 transition-colors"
        data-testid="user-avatar"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getProfilePhotoUrl()}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to UI avatar if image fails to load
              const target = e.target as HTMLImageElement;
              const fullName = user.user_metadata?.full_name || user.email || '';
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=01959F&color=fff&size=32`;
            }}
          />
        </div>
        <span className="text-gray-700 font-medium hidden sm:block">
          {getDisplayName()}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{getDisplayName()}</p>
            <p className="text-xs text-gray-500 capitalize">{userRole}</p>
          </div>
          <form action={serverSignOut}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Logout
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
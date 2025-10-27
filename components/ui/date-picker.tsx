'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DatePicker({ value, onChange, placeholder = "Select date", className }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2001, 0, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const prevMonthDays = getDaysInMonth(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        isNextMonth: false
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        isNextMonth: false
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        isNextMonth: true
      });
    }

    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  
  const handleDateClick = (day: number, isCurrentMonth: boolean, isNextMonth: boolean) => {
    const newDate = new Date(currentDate);

    if (!isCurrentMonth) {
      if (isNextMonth) {
        newDate.setMonth(currentDate.getMonth() + 1);
      } else {
        newDate.setMonth(currentDate.getMonth() - 1);
      }
    }

    newDate.setDate(day);
    setSelectedDate(newDate);

    // Format date as YYYY-MM-DD for the input
    const formattedDate = newDate.toISOString().split('T')[0];
    onChange(formattedDate);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return placeholder;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return placeholder;

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return placeholder;
    }
  };

  const isPlaceholder = !value || (value && new Date(value).toString() === 'Invalid Date');

  const days = generateCalendar();
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div ref={dropdownRef} className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        tabIndex={0}
        className={`flex h-12 w-full items-center justify-between rounded-lg border-2 border-neutral-40 px-3 py-2 text-m-regular transition-all outline-none bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus ${isFocused || isOpen ? 'border-primary-main ring-2 ring-primary-focus' : ''} ${className}`}
      >
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span className={`text-m-regular select-none ${isPlaceholder ? 'text-neutral-60' : ''}`}>{formatDisplayDate(value)}</span>
        </div>
        <ChevronDownIcon className="size-5 text-neutral-80" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50" style={{ width: '376px', padding: '24px', gap: '24px' }}>
          <div className="flex flex-col gap-6">
            {/* Header with navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="text-sm font-semibold text-gray-800 text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>

              <button
                onClick={() => navigateMonth(1)}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Week day headers */}
              {weekDays.map((day, index) => (
                <div
                  key={index}
                  className="text-center font-semibold text-gray-700 text-xs py-2"
                >
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {days.map((dayObj, index) => (
                <button
                  key={index}
                  onClick={() => handleDateClick(dayObj.day, dayObj.isCurrentMonth, dayObj.isNextMonth)}
                  className={`
                    aspect-square flex items-center justify-center rounded text-sm
                    transition-all duration-200
                    ${!dayObj.isCurrentMonth
                      ? 'text-gray-300 hover:bg-gray-50'
                      : 'text-gray-800 hover:bg-blue-50'
                    }
                    ${selectedDate &&
                      selectedDate.getDate() === dayObj.day &&
                      selectedDate.getMonth() === currentDate.getMonth() &&
                      selectedDate.getFullYear() === currentDate.getFullYear() &&
                      dayObj.isCurrentMonth
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : ''
                    }
                  `}
                >
                  {dayObj.day}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
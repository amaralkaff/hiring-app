'use client';

import { useState, useEffect, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface Country {
  code: string;
  name: string;
  dialCode: string;
}

const countries: Country[] = [
  { code: 'ID', name: 'Indonesia', dialCode: '+62' },
  { code: 'US', name: 'United States', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44' },
  { code: 'SG', name: 'Singapore', dialCode: '+65' },
  { code: 'MY', name: 'Malaysia', dialCode: '+60' },
  { code: 'TH', name: 'Thailand', dialCode: '+66' },
  { code: 'PH', name: 'Philippines', dialCode: '+63' },
  { code: 'VN', name: 'Vietnam', dialCode: '+84' },
  { code: 'AU', name: 'Australia', dialCode: '+61' },
  { code: 'IN', name: 'India', dialCode: '+91' },
  { code: 'CN', name: 'China', dialCode: '+86' },
  { code: 'JP', name: 'Japan', dialCode: '+81' },
  { code: 'KR', name: 'South Korea', dialCode: '+82' },
  { code: 'DE', name: 'Germany', dialCode: '+49' },
  { code: 'FR', name: 'France', dialCode: '+33' },
  { code: 'IT', name: 'Italy', dialCode: '+39' },
  { code: 'ES', name: 'Spain', dialCode: '+34' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31' },
  { code: 'CA', name: 'Canada', dialCode: '+1' },
  { code: 'BR', name: 'Brazil', dialCode: '+55' },
];

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export function CountryPhoneInput({
  value,
  onChange,
  placeholder = "Enter phone number",
  className,
  error
}: CountryPhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default to Indonesia
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Initialize with existing value
  useEffect(() => {
    if (value) {
      // Extract the dial code from the value
      for (const country of countries) {
        if (value.startsWith(country.dialCode)) {
          setSelectedCountry(country);
          setPhoneNumber(value.replace(country.dialCode, ''));
          return;
        }
      }
      // If no matching country found, just set the phone number
      setPhoneNumber(value);
    }
  }, [value]);

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);

    // Update the full number
    const fullNumber = `${country.dialCode}${phoneNumber}`;
    onChange(fullNumber);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    // Only allow numbers, spaces, dashes, and parentheses
    const cleanPhone = newPhone.replace(/[^\d\s\-\(\)]/g, '');
    setPhoneNumber(cleanPhone);

    // Update the full number
    const fullNumber = `${selectedCountry.dialCode}${cleanPhone}`;
    onChange(fullNumber);
  };

  return (
    <div className="relative">
      <div className="flex">
        {/* Country Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex items-center gap-2 px-3 py-3 border-2 rounded-l-lg transition-all outline-none",
              error
                ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus"
            )}
          >
            <ReactCountryFlag
              countryCode={selectedCountry.code}
              svg
              style={{
                width: '1.25rem',
                height: '1.25rem',
              }}
              className="rounded-full"
            />
            <span className="text-sm text-neutral-100">{selectedCountry.dialCode}</span>
            <ChevronDownIcon className="w-4 h-4 text-neutral-60" />
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-neutral-20 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
              <div className="p-2">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-neutral-10 transition-colors",
                      selectedCountry.code === country.code && "bg-primary-10"
                    )}
                  >
                    <ReactCountryFlag
                      countryCode={country.code}
                      svg
                      style={{
                        width: '1.25rem',
                        height: '1.25rem',
                      }}
                      className="rounded-full"
                    />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-neutral-100">
                        {country.name}
                      </div>
                      <div className="text-xs text-neutral-60">
                        {country.dialCode}
                      </div>
                    </div>
                    {selectedCountry.code === country.code && (
                      <div className="w-2 h-2 bg-primary-main rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneNumberChange}
          placeholder={placeholder}
          className={cn(
            "flex-1 h-12 px-4 text-m-regular border-2 border-l-0 rounded-r-lg transition-all outline-none",
            error
              ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
              : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
          )}
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-s-regular text-danger-main mt-2">
          {error}
        </p>
      )}

      {/* Example format hint */}
      {phoneNumber.length === 0 && (
        <p className="text-xs text-neutral-60 mt-1">
          Example: {selectedCountry.code === 'ID' ? '81234567890' :
                   selectedCountry.code === 'US' || selectedCountry.code === 'CA' ? '5551234567' :
                   selectedCountry.code === 'GB' ? '7911123456' :
                   selectedCountry.code === 'SG' || selectedCountry.code === 'MY' ? '91234567' :
                   '1234567890'}
        </p>
      )}
    </div>
  );
}
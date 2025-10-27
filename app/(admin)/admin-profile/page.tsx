'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { createClient } from '@/utils/supabase/client'
import { GestureCapture } from '@/components/features/gesture-capture'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { regionalAPI, type Province } from '@/lib/regional-api';
import { User } from '@supabase/supabase-js'
import DatePicker from '@/components/ui/date-picker'
import { CountryPhoneInput } from '@/components/ui/country-phone-input'

interface AdminProfile {
  id: string
  email: string
  full_name: string | null
  profile_photo_url: string | null
  profile_photo_name: string | null
  domicile: string | null
  phone_number: string | null
  linkedin_link: string | null
  date_of_birth: string | null
  gender: string | null
  role: string | null
}

export default function AdminProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [provinces, setProvinces] = useState<Province[]>([])
  const [loadingProvinces, setLoadingProvinces] = useState(false)

  // Form state
  const [fullName, setFullName] = useState('')
  const [domicile, setDomicile] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [linkedinLink, setLinkedinLink] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [role, setRole] = useState('admin')

  // Photo capture state
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const supabase = createClient()

  // Load provinces from API
  useEffect(() => {
    const loadProvinces = async () => {
      setLoadingProvinces(true)
      try {
        const provincesData = await regionalAPI.getProvinces()
        setProvinces(provincesData)
      } catch (error) {
        console.error('Error loading provinces:', error)
      } finally {
        setLoadingProvinces(false)
      }
    }

    loadProvinces()
  }, [])

  // Validation rules (same as dynamic form)
  const validateField = (key: string, value: string): string | null => {
    if (!value || value.trim() === '') {
      return `${key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} is required`
    }

    if (key === 'email') {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(value)) {
        return 'Invalid email address'
      }
    }

    if (key === 'linkedin_link') {
      const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/.+$/i;
      if (!linkedinRegex.test(value)) {
        return 'Please enter a valid LinkedIn URL'
      }
    }

    if (key === 'phone_number') {
      // Basic validation - check if it starts with + and contains digits
      if (!(/^\+\d+/.test(value))) {
        return 'Please enter a valid phone number'
      }
    }

    return null
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Make all fields optional - only validate format if provided
    if (fullName) {
      const error = validateField('full_name', fullName)
      if (error) newErrors.full_name = error
    }

    if (dateOfBirth) {
      const error = validateField('date_of_birth', dateOfBirth)
      if (error) newErrors.date_of_birth = error
    }

    if (domicile) {
      const error = validateField('domicile', domicile)
      if (error) newErrors.domicile = error
    }

    if (phoneNumber) {
      const error = validateField('phone_number', phoneNumber)
      if (error) newErrors.phone_number = error
    }

    if (user?.email) {
      const error = validateField('email', user.email)
      if (error) newErrors.email = error
    }

    if (linkedinLink) {
      const error = validateField('linkedin_link', linkedinLink)
      if (error) newErrors.linkedin_link = error
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const loadProfile = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
        setFullName(profileData.full_name || '')
        setDomicile(profileData.domicile || '')
        setPhoneNumber(profileData.phone_number || '')
        setLinkedinLink(profileData.linkedin_link || '')
        setDateOfBirth(profileData.date_of_birth || '')
        setGender(profileData.gender || '')
        setRole(profileData.role || 'admin')
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, router]);

  useEffect(() => {
    loadProfile()
  }, [loadProfile]);

  const handleProfilePhotoUpdate = async (photoUrl: string | null) => {
    if (!user) return

    try {
      const fileName = photoUrl ? photoUrl.split('/').pop() : null

      await supabase
        .from('users')
        .update({
          profile_photo_url: photoUrl,
          profile_photo_name: fileName
        })
        .eq('id', user.id)

      setProfile(prev => prev ? {
        ...prev,
        profile_photo_url: photoUrl,
        profile_photo_name: fileName || null
      } : null)

      console.log('Profile photo updated successfully - will be used in job applications')
    } catch (error) {
      console.error('Error updating profile photo:', error)
      alert('Failed to update profile photo')
    }
  }

  const handleGestureCapture = async (imageData: string) => {
    if (!user) return

    setUploadingPhoto(true)
    setCapturedPhoto(imageData) // Show captured photo immediately

    try {
      // Convert base64 to blob for Supabase Storage
      const response = await fetch(imageData)
      const blob = await response.blob()

      // Create file object
      const file = new File([blob], `profile_${user.id}.jpg`, { type: 'image/jpeg' })

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(`${user.id}/profile_${user.id}.jpg`, file, {
          upsert: true,
          contentType: 'image/jpeg'
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert('Failed to upload photo. Please try again.')
        setCapturedPhoto(null) // Clear captured photo on error
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(`${user.id}/profile_${user.id}.jpg`)

      // Update user profile with new photo URL
      await handleProfilePhotoUpdate(publicUrl)
      setCapturedPhoto(null) // Clear captured photo after successful upload

      alert('Profile photo captured! It will be automatically used in your job applications.')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
      setCapturedPhoto(null) // Clear captured photo on error
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    // Validate form first
    if (!validateForm()) {
      return
    }

    setSaving(true)

    try {
      const updateData: Record<string, unknown> = {
        full_name: fullName || null,
        domicile: domicile || null,
        phone_number: phoneNumber || null,
        linkedin_link: linkedinLink || null,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        role: role || 'admin',
      }

      await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)

      setProfile(prev => prev ? { ...prev, ...updateData } : null)

      // Also update user metadata for consistency
      await supabase.auth.updateUser({
        data: { full_name: fullName || null }
      })

      alert('Profile updated successfully!')
      setErrors({}) // Clear errors on success
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-20 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Combined Card with Header, Info Banner and Form */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-40">
          {/* Header with Back Button */}
          <div className="p-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-10 h-10 rounded-full bg-white border border-neutral-40 flex items-center justify-center hover:bg-neutral-10 transition-colors"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-neutral-80" />
                </button>
                <h1 className="text-lg font-bold text-neutral-100">
                  Admin Profile Settings
                </h1>
              </div>

              {/* Info Banner - Top Right */}
              <div className="rounded-lg p-3 flex items-start gap-2 max-w-xs">
                <p className="text-xs text-neutral-60">ℹ️ Manage your admin profile</p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-8 pt-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }} className="space-y-6">
              <div className="space-y-4">
                {/* Photo Profile with Gesture Capture - Optional */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Photo profile
                  </label>
                  <div className="flex justify-start">
                    <div className="relative">
                      <GestureCapture
                        onCapture={handleGestureCapture}
                        currentImage={capturedPhoto || profile?.profile_photo_url || undefined}
                      />
                    </div>
                  </div>
                  {errors.photo_profile && (
                    <p className="text-s-regular text-danger-main mt-2 text-center">{errors.photo_profile}</p>
                  )}
                </div>

                {/* Full Name - Optional */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value)
                      if (errors.full_name) {
                        setErrors(prev => ({ ...prev, full_name: '' }))
                      }
                    }}
                    placeholder="Enter your full name"
                    className={cn(
                      "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                      errors.full_name
                        ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                        : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                    )}
                  />
                  {errors.full_name && (
                    <p className="text-s-regular text-danger-main mt-2">{errors.full_name}</p>
                  )}
                </div>

                {/* Role - Fixed for admin */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Role
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-neutral-10 rounded-lg border-2 border-neutral-40">
                    <span className="text-m-regular text-neutral-100 font-medium">Administrator</span>
                    <span className="text-xs text-neutral-60">(System Role)</span>
                  </div>
                </div>

                {/* Date of Birth - Optional */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Date of birth
                  </label>
                  <DatePicker
                    value={dateOfBirth}
                    onChange={(value) => {
                      setDateOfBirth(value)
                      if (errors.date_of_birth) {
                        setErrors(prev => ({ ...prev, date_of_birth: '' }))
                      }
                    }}
                    placeholder="Select your date of birth"
                    className={cn(
                      errors.date_of_birth
                        ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                        : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                    )}
                  />
                  {errors.date_of_birth && (
                    <p className="text-s-regular text-danger-main mt-2">{errors.date_of_birth}</p>
                  )}
                </div>

                {/* Gender - Optional */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Pronoun (gender)
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Female"
                        checked={gender === 'Female'}
                        onChange={(e) => {
                          setGender(e.target.value)
                          if (errors.gender) {
                            setErrors(prev => ({ ...prev, gender: '' }))
                          }
                        }}
                        className="w-5 h-5 text-primary-main accent-primary-main"
                      />
                      <span className="text-m-regular text-neutral-100">She/her (Female)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value="Male"
                        checked={gender === 'Male'}
                        onChange={(e) => {
                          setGender(e.target.value)
                          if (errors.gender) {
                            setErrors(prev => ({ ...prev, gender: '' }))
                          }
                        }}
                        className="w-5 h-5 text-primary-main accent-primary-main"
                      />
                      <span className="text-m-regular text-neutral-100">He/him (Male)</span>
                    </label>
                  </div>
                  {errors.gender && (
                    <p className="text-s-regular text-danger-main mt-2">{errors.gender}</p>
                  )}
                </div>

                {/* Domicile - Indonesian Provinces from API */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Domicile (Province)
                  </label>
                  <Select
                    value={domicile}
                    onValueChange={(value) => {
                      setDomicile(value)
                      if (errors.domicile) {
                        setErrors(prev => ({ ...prev, domicile: '' }))
                      }
                    }}
                    disabled={loadingProvinces}
                  >
                    <SelectTrigger className={cn(
                      "h-12 border-2",
                      errors.domicile ? "border-danger-main focus:border-danger-main focus:ring-danger-focus" : "border-neutral-40 focus:border-primary-main focus:ring-primary-focus"
                    )}>
                      <SelectValue placeholder={loadingProvinces ? "Loading provinces..." : "Choose your province"} />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.name}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {loadingProvinces && (
                    <p className="text-xs text-neutral-60 mt-1">Loading Indonesian provinces...</p>
                  )}
                  {errors.domicile && (
                    <p className="text-s-regular text-danger-main mt-2">{errors.domicile}</p>
                  )}
                </div>

                {/* Phone Number - Optional */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Phone number
                  </label>
                  <CountryPhoneInput
                    value={phoneNumber}
                    onChange={(value) => {
                      setPhoneNumber(value)
                      if (errors.phone_number) {
                        setErrors(prev => ({ ...prev, phone_number: '' }))
                      }
                    }}
                    placeholder="Enter phone number"
                    error={errors.phone_number}
                  />
                </div>

                {/* Email - Optional (Disabled) */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className={cn(
                      "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                      errors.email
                        ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                        : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                    )}
                  />
                  <p className="text-xs text-neutral-60">Email cannot be changed</p>
                  {errors.email && (
                    <p className="text-s-regular text-danger-main mt-2">{errors.email}</p>
                  )}
                </div>

                {/* LinkedIn Link - Optional */}
                <div className="space-y-2">
                  <label className="text-s-regular text-neutral-100 block">
                    Link Linkedin
                  </label>
                  <input
                    id="linkedinLink"
                    type="url"
                    value={linkedinLink}
                    onChange={(e) => {
                      setLinkedinLink(e.target.value)
                      if (errors.linkedin_link) {
                        setErrors(prev => ({ ...prev, linkedin_link: '' }))
                      }
                    }}
                    placeholder="https://linkedin.com/in/username"
                    className={cn(
                      "w-full h-12 px-4 text-m-regular rounded-lg border-2 transition-all outline-none",
                      errors.linkedin_link
                        ? "border-danger-main bg-neutral-10 focus:border-danger-main focus:ring-2 focus:ring-danger-focus"
                        : "border-neutral-40 bg-neutral-10 hover:border-neutral-50 focus:border-primary-main focus:ring-2 focus:ring-primary-focus placeholder:text-neutral-60"
                    )}
                  />
                  {errors.linkedin_link && (
                    <p className="text-s-regular text-danger-main mt-2">{errors.linkedin_link}</p>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <Button
                  type="submit"
                  disabled={saving || uploadingPhoto}
                  className="w-full h-10 bg-primary-main hover:bg-primary-hover active:bg-primary-pressed text-white font-semibold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : uploadingPhoto ? 'Uploading Photo...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Upload Loading Overlay */}
      {uploadingPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main mx-auto mb-4"></div>
            <p className="text-lg font-medium text-neutral-100">Uploading photo...</p>
            <p className="text-sm text-neutral-60 mt-2">This will only take a moment</p>
          </div>
        </div>
      )}
    </div>
  )
}
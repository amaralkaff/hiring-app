import { createClient } from '@/utils/supabase/client'

export async function uploadProfilePhoto(userId: string, file: File): Promise<{ data?: string; error?: string }> {
  const supabase = createClient()

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.' }
  }

  // Validate file size (5MB)
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: 'File size too large. Maximum size is 5MB.' }
  }

  try {
    // Create unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file to Supabase Storage
    const { error } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, {
        upsert: true, // Overwrite existing file
        contentType: file.type
      })

    if (error) {
      console.error('Upload error:', error)
      return { error: error.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    return { data: publicUrl }
  } catch (error) {
    console.error('Unexpected upload error:', error)
    return { error: 'Failed to upload photo. Please try again.' }
  }
}

export async function deleteProfilePhoto(userId: string, fileName: string): Promise<{ error?: string }> {
  const supabase = createClient()

  try {
    const filePath = `${userId}/${fileName}`

    const { error } = await supabase.storage
      .from('profile-photos')
      .remove([filePath])

    if (error) {
      console.error('Delete error:', error)
      return { error: error.message }
    }

    return {}
  } catch (error) {
    console.error('Unexpected delete error:', error)
    return { error: 'Failed to delete photo. Please try again.' }
  }
}

export function getProfilePhotoUrl(userId: string, fileName?: string): string {
  if (!fileName) {
    // Return default avatar URL or placeholder
    return `https://ui-avatars.com/api/?name=${userId}&background=01959F&color=fff`
  }

  const filePath = `${userId}/${fileName}`
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://khzrfwyofxqrqvelydkn.supabase.co'

  return `${supabaseUrl}/storage/v1/object/public/profile-photos/${filePath}`
}
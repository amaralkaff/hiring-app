/**
 * Photo upload utility for handling profile photos
 * Converts base64 data to file and uploads to Supabase Storage
 */

export interface PhotoUploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export async function uploadPhotoFromBase64(
  base64Data: string,
  fileName: string = 'profile-photo.jpg'
): Promise<PhotoUploadResult> {
  try {
    // Extract the base64 part (remove data:image/jpeg;base64, prefix)
    const base64Content = base64Data.split(',')[1];
    if (!base64Content) {
      return { success: false, error: 'Invalid base64 data' };
    }

    // Convert base64 to Blob
    const byteCharacters = atob(base64Content);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, fileName);

    // Upload to API
    const response = await fetch('/api/upload/photo', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || 'Upload failed'
      };
    }

    const result = await response.json();
    return {
      success: true,
      url: result.url,
      path: result.path,
    };

  } catch (error) {
    console.error('Photo upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    };
  }
}

export async function deletePhotoByPath(path: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/upload/photo?path=${encodeURIComponent(path)}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      console.error('Failed to delete photo:', response.statusText);
      return false;
    }

    const result = await response.json();
    return result.success;

  } catch (error) {
    console.error('Photo deletion error:', error);
    return false;
  }
}

/**
 * Convert a data URL to a File object
 */
export function dataUrlToFile(dataUrl: string, fileName: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], fileName, { type: mime });
}

/**
 * Check if a string is a base64 data URL
 */
export function isBase64DataURL(str: string): boolean {
  return str.startsWith('data:image/') && str.includes('base64,');
}
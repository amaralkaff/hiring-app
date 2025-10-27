'use client';

interface AuthLoadingProps {
  message?: string;
  minimal?: boolean;
}

export function AuthLoading({ message = 'Loading...', minimal = false }: AuthLoadingProps) {
  if (minimal) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mr-2"></div>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
      <p className="text-gray-600 text-sm">{message}</p>
    </div>
  );
}
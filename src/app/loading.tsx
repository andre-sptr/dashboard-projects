// Full-screen loading fallback for navigation


export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-800"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300">Memuat Data...</h2>
        <p className="text-sm text-gray-500 dark:text-gray-500">Harap tunggu sebentar</p>
      </div>
    </div>
  );
}

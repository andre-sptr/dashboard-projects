// Full-screen loading fallback for navigation.
// Inline styles guarantee the loader is centered and blue from the first paint,
// even before Tailwind CSS is applied (prevents the unstyled black top-left flash).
export default function Loading() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900"
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="flex flex-col items-center gap-4"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}
      >
        <div
          className="w-16 h-16 relative"
          style={{ width: '4rem', height: '4rem', position: 'relative' }}
        >
          <div
            className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-800"
            style={{ position: 'absolute', inset: 0, borderRadius: '9999px', border: '4px solid #e5e7eb' }}
          ></div>
          <div
            className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '9999px',
              border: '4px solid #2563eb',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          ></div>
        </div>
        <h2
          className="text-xl font-medium text-gray-700 dark:text-gray-300"
          style={{ fontSize: '1.25rem', fontWeight: 500, color: '#374151', margin: 0 }}
        >
          Memuat Data...
        </h2>
        <p
          className="text-sm text-gray-500 dark:text-gray-500"
          style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}
        >
          Harap tunggu sebentar
        </p>
      </div>
    </div>
  );
}

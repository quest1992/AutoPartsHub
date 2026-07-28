'use client';

export function Notice({
  children,
  tone = 'success',
}: {
  children: React.ReactNode;
  tone?: 'success' | 'error';
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mt-4 rounded p-3 ${
        tone === 'success'
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-red-50 text-red-700'
      }`}
    >
      {children}
    </p>
  );
}

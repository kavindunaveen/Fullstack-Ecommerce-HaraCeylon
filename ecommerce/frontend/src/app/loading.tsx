// Global loading skeleton — shown while any page segment is loading
export default function Loading() {
  return (
    <div className="min-h-screen bg-brand-light flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="spinner" />
        <p className="text-sm text-gray-400 font-light tracking-widest uppercase">Loading…</p>
      </div>
    </div>
  );
}

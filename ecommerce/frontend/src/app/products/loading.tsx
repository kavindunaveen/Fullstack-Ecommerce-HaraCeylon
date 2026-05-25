// Products page loading skeleton
export default function ProductsLoading() {
  return (
    <div className="bg-brand-light min-h-screen">
      {/* Header skeleton */}
      <div className="relative pt-32 pb-20 px-6 bg-brand-dark">
        <div className="max-w-5xl mx-auto text-center mt-12 space-y-4">
          <div className="h-3 w-24 bg-white/20 rounded-full mx-auto animate-pulse" />
          <div className="h-12 w-80 bg-white/20 rounded-xl mx-auto animate-pulse" />
          <div className="h-4 w-64 bg-white/10 rounded-lg mx-auto animate-pulse" />
        </div>
      </div>

      <div className="py-20">
        <div className="container max-w-7xl mx-auto px-6">
          {/* Filter tabs skeleton */}
          <div className="flex justify-center mb-16">
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 w-24 bg-white rounded-full animate-pulse" />
              ))}
            </div>
          </div>

          {/* Product grid skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-3xl aspect-[4/5] mb-6" />
                <div className="h-5 bg-gray-200 rounded-lg mb-2 w-3/4" />
                <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

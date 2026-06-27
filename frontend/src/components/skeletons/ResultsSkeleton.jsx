import Skeleton, { SkeletonCard } from './Skeleton'

export function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8 space-y-3">
          <Skeleton className="h-9 w-72 mx-auto" />
          <Skeleton className="h-5 w-96 max-w-full mx-auto" />
        </div>

        <SkeletonCard className="mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <Skeleton className="w-48 h-48 rounded-full flex-shrink-0" />
            <div className="flex-1 w-full space-y-4">
              <Skeleton className="h-12 w-48 mx-auto md:mx-0 rounded-full" />
              <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        </SkeletonCard>

        <SkeletonCard className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-3 w-full rounded-full mb-2" />
          <Skeleton className="h-4 w-48" />
        </SkeletonCard>

        {[1, 2].map((i) => (
          <SkeletonCard key={i} className="mb-8">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </SkeletonCard>
        ))}

        <SkeletonCard className="mb-8">
          <Skeleton className="h-6 w-52 mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        </SkeletonCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-14 rounded-xl" />
          <Skeleton className="h-14 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export default ResultsSkeleton

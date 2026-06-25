import Skeleton, { SkeletonCard, SkeletonStatCard } from './Skeleton'

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-9 w-80" />
          <Skeleton className="h-5 w-56" />
        </div>

        <Skeleton className="h-44 w-full rounded-2xl mb-8" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>

        <SkeletonCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="w-5 h-5 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </SkeletonCard>

        <SkeletonCard className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="w-5 h-5 rounded" />
          </div>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-52 w-full rounded-xl" />
        </SkeletonCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[1, 2].map((i) => (
            <SkeletonCard key={i}>
              <Skeleton className="h-5 w-48 mb-3" />
              <Skeleton className="h-2 w-full rounded-full" />
            </SkeletonCard>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton

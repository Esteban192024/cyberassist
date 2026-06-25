import Skeleton, { SkeletonCard, SkeletonStatCard } from './Skeleton'

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 pt-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 space-y-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <SkeletonCard>
              <div className="text-center mb-6">
                <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
                <Skeleton className="h-6 w-40 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
                <div className="flex space-x-3 pt-4">
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                  <Skeleton className="h-10 flex-1 rounded-xl" />
                </div>
              </div>
            </SkeletonCard>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonStatCard key={i} />
              ))}
            </div>

            <SkeletonCard>
              <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </SkeletonCard>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSkeleton

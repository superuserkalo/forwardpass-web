import { BrandLockup } from "@/components/brand-lockup";
import { Skeleton } from "@/components/ui/skeleton";

function MetaSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <Skeleton className="h-3 w-24" />
      <span className="size-0.5 bg-border" />
      <Skeleton className="h-3 w-14" />
    </div>
  );
}

export function NewsFeedSkeleton() {
  return (
    <div role="status" aria-label="Loading stories">
      <div className="flex items-end justify-between gap-6">
        <Skeleton className="h-12 w-72 md:h-14 md:w-96" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="mt-10 grid gap-10 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-12">
        <div className="hidden space-y-3 lg:block">
          <Skeleton className="mb-5 ml-4 h-2.5 w-12" />
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
        <div>
          <div className="flex gap-9 border-b border-border pb-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-16" />
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-x-4 border-b border-border py-7 sm:grid-cols-[4.5rem_minmax(0,1fr)_13rem] sm:gap-x-6 md:grid-cols-[4.5rem_minmax(0,1fr)_17rem]"
            >
              <div className="flex flex-col items-center gap-2">
                <Skeleton className="size-3.5" />
                <Skeleton className="h-3 w-9" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-5 w-11/12" />
                <Skeleton className="h-5 w-2/3" />
                <MetaSkeleton className="pt-1" />
              </div>
              <Skeleton className="hidden aspect-[16/9] w-full sm:block" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SidePieceSkeleton() {
  return (
    <div className="space-y-4 py-8 first:pt-0">
      <Skeleton className="aspect-[16/10] w-full" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-2/3" />
      <MetaSkeleton />
    </div>
  );
}

export function EditorialSkeleton() {
  return (
    <div role="status" aria-label="Loading editorial" className="grid gap-10 py-12 lg:grid-cols-[1fr_2fr_1fr] lg:gap-0">
      <div className="hidden divide-y divide-border border-border pr-8 lg:block lg:border-r">
        <SidePieceSkeleton />
        <SidePieceSkeleton />
      </div>
      <div className="flex flex-col items-center gap-4 lg:px-8">
        <Skeleton className="aspect-[3/2] w-full" />
        <Skeleton className="mt-6 h-9 w-10/12" />
        <Skeleton className="h-9 w-8/12" />
        <Skeleton className="mt-2 h-4 w-9/12" />
        <MetaSkeleton className="mt-4" />
      </div>
      <div className="hidden divide-y divide-border border-border pl-8 lg:block lg:border-l">
        <SidePieceSkeleton />
        <SidePieceSkeleton />
      </div>
    </div>
  );
}

export function WeeklySkeleton() {
  return (
    <div role="status" aria-label="Loading weekly research" className="grid gap-10 border-b border-border py-12 lg:grid-cols-[3fr_2fr] lg:gap-14">
      <Skeleton className="aspect-[3/2] w-full" />
      <div className="space-y-4">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="mt-6 h-11 w-full" />
        <Skeleton className="h-11 w-3/4" />
        <Skeleton className="mt-4 h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="mt-3 h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export function SectionNavSkeleton() {
  return (
    <div className="flex gap-8 border-b border-border pb-4">
      <Skeleton className="h-3 w-12" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/** Whole-page stand-in for /archive, shown by the route's loading state and the header's instant overlay. */
export function ArchiveShellSkeleton({ withBrand = false }: { withBrand?: boolean }) {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-24 md:px-10" aria-busy="true">
      {withBrand && (
        <div className="py-4 md:py-5">
          <BrandLockup />
        </div>
      )}
      <div className={withBrand ? "pt-10 md:pt-14" : "pt-28 md:pt-32"}>
        <SectionNavSkeleton />
        <div className="pt-12">
          <NewsFeedSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ArticleSkeleton() {
  return (
    <div role="status" aria-label="Loading edition" className="mx-auto max-w-7xl px-5 pb-24 md:px-10">
      <div className="py-4 md:py-5">
        <BrandLockup />
      </div>
      <Skeleton className="mt-10 h-3 w-28 md:mt-14" />
      <div className="mx-auto mt-16 max-w-3xl space-y-5 text-center">
        <Skeleton className="mx-auto h-3 w-56" />
        <Skeleton className="mx-auto h-14 w-full" />
        <Skeleton className="mx-auto h-14 w-2/3" />
        <Skeleton className="mx-auto h-4 w-4/5" />
      </div>
      <Skeleton className="mx-auto mt-14 aspect-[21/9] w-full max-w-5xl" />
      <div className="mx-auto mt-14 grid max-w-5xl gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-3 w-full" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className={`h-4 ${index % 3 === 2 ? "w-3/5" : "w-full"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Generic page stand-in for form-style pages (reading brief, onboarding). */
export function FormPageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="mx-auto min-h-screen max-w-3xl px-5 py-10 md:py-16">
      <BrandLockup />
      <div className="mt-24 space-y-5">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="space-y-3 pt-6">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="mt-4 h-11 w-32" />
      </div>
    </div>
  );
}

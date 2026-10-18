'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

/**
 * Base shimmer skeleton component for loading state placeholders.
 * Uses Tailwind `animate-pulse` with `#E2E8F0` base color and respects prefers-reduced-motion.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse motion-reduce:animate-none bg-[#E2E8F0] dark:bg-slate-800 rounded-md',
        className
      )}
      {...props}
    />
  );
}

/**
 * CourseCardSkeleton
 * Matches the course card layout in app/page.tsx:
 * - Thumbnail image area with category badge placeholder
 * - Title, 2-line description, and instructor / duration metadata row
 * - Action buttons row (View Course & Enroll)
 */
export function CourseCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-sm flex flex-col justify-between',
        className
      )}
      aria-busy="true"
      aria-label="Loading course..."
    >
      <div>
        {/* Course Thumbnail */}
        <div className="relative h-44 w-full bg-[#F8FAFC] border-b border-[#E2E8F0] overflow-hidden">
          <Skeleton className="h-full w-full rounded-none" />
          <div className="absolute top-3 left-3">
            <Skeleton className="h-5 w-20 rounded bg-white/70" />
          </div>
        </div>

        {/* Course Content */}
        <div className="p-5 space-y-2.5">
          {/* Course Title */}
          <Skeleton className="h-5 w-3/4 rounded-md" />

          {/* Description lines */}
          <div className="space-y-1.5 pt-1">
            <Skeleton className="h-3.5 w-full rounded" />
            <Skeleton className="h-3.5 w-5/6 rounded" />
          </div>

          {/* Instructor and Duration meta row */}
          <div className="pt-2.5 flex items-center justify-between border-t border-[#E2E8F0]">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
        </div>
      </div>

      {/* Button Actions */}
      <div className="p-5 pt-0">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * TableRowSkeleton
 * For admin tables (5 columns by default: Student, Course, Amount, Status, Date).
 * Renders a `<tr>` element with 5 `<td>` cells containing pulsing skeletons.
 */
export function TableRowSkeleton({
  columns = 5,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <tr
      className={cn('border-b border-[#E2E8F0] dark:border-slate-800', className)}
      aria-busy="true"
    >
      {Array.from({ length: columns }).map((_, index) => (
        <td key={index} className="p-4 align-middle">
          <Skeleton
            className={cn(
              'h-4 rounded',
              index === 0 && 'w-32 sm:w-40',
              index === 1 && 'w-28 sm:w-36',
              index === 2 && 'w-16 sm:w-20',
              index === 3 && 'w-20 sm:w-24',
              index >= 4 && 'w-24 sm:w-28'
            )}
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * StatCardSkeleton
 * Matches admin telemetry stat cards:
 * - Header row with label and icon
 * - Large numerical stat
 * - Sub-caption indicator
 */
export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-2 shadow-sm',
        className
      )}
      aria-busy="true"
      aria-label="Loading statistic..."
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-5 w-5 rounded-md" />
      </div>
      <Skeleton className="h-8 w-20 rounded-md" />
      <Skeleton className="h-3 w-28 rounded" />
    </div>
  );
}

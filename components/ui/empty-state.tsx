'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  /**
   * Optional icon to render inside the highlighted badge area.
   * Can be any React node (e.g., Lucide icon component).
   */
  icon?: React.ReactNode;
  /**
   * Main heading text explaining the empty state.
   */
  title: string;
  /**
   * Optional supporting paragraph text with helpful instructions or context.
   */
  description?: string;
  /**
   * Optional call-to-action button configuration.
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Optional additional CSS class names for container customization.
   */
  className?: string;
}

/**
 * EmptyState Component
 *
 * A clean, centered placeholder state for empty tables, course catalogs,
 * search results, or notification feeds following the LearnHub Certify design system (#1E3A5F / #F8FAFC).
 *
 * @example
 * // 1. Basic empty state
 * <EmptyState
 *   title="No certificates found"
 *   description="You have not been issued any certificates yet. Complete a course to earn one."
 * />
 *
 * @example
 * // 2. Empty state with icon and action button
 * import { BookOpen } from 'lucide-react';
 *
 * <EmptyState
 *   icon={<BookOpen className="w-6 h-6 text-[#1E3A5F]" />}
 *   title="No enrolled courses"
 *   description="Explore our curated catalog and start your learning journey today."
 *   action={{
 *     label: "Browse Courses",
 *     onClick: () => router.push('/courses')
 *   }}
 * />
 *
 * @example
 * // 3. Search query with reset action
 * import { SearchX } from 'lucide-react';
 *
 * <EmptyState
 *   icon={<SearchX className="w-6 h-6 text-[#B08D57]" />}
 *   title="No results match your search"
 *   description="Try adjusting your keywords or clearing active filters to see more results."
 *   action={{
 *     label: "Clear Filters",
 *     onClick: () => handleClearFilters()
 *   }}
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-4',
        className
      )}
    >
      {/* Icon Area */}
      {icon && (
        <div
          className="w-14 h-14 rounded-2xl bg-white border border-[#E2E8F0] text-[#1E3A5F] flex items-center justify-center shadow-xs transition-transform duration-200"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      {/* Title & Description */}
      <div className="space-y-1.5 max-w-sm mx-auto">
        <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">
          {title}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* Action Button */}
      {action && (
        <div className="pt-1">
          <button
            type="button"
            onClick={action.onClick}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-[#1E3A5F] hover:bg-[#162F4D] text-white text-xs sm:text-sm font-semibold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2 cursor-pointer active:scale-[0.98]"
          >
            {action.label}
          </button>
        </div>
      )}
    </div>
  );
}

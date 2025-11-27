"use client";

import { ReactNode, forwardRef } from "react";

interface CategorySectionProps {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  children: ReactNode;
}

/**
 * CategorySection - Wrapper for each configuration category
 * 
 * Features:
 * - Has an ID for scrollspy navigation
 * - Displays category header with icon
 * - Contains the selection cards
 */
export const CategorySection = forwardRef<HTMLElement, CategorySectionProps>(
  function CategorySection({ id, title, description, icon, children }, ref) {
    return (
      <section
        ref={ref}
        id={id}
        className="py-8 border-b border-gray-100 last:border-b-0 scroll-mt-20"
      >
        {/* Section Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <span className="text-2xl" role="img" aria-label={title}>
                {icon}
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              {title}
            </h2>
          </div>
          {description && (
            <p className="text-sm text-gray-500 ml-10">
              {description}
            </p>
          )}
        </div>

        {/* Section Content */}
        <div className="ml-0 lg:ml-10">
          {children}
        </div>
      </section>
    );
  }
);


"use client";

import { useState, useEffect, useCallback } from "react";
import { PartCategory } from "@/lib/parts-data";

interface ScrollspyNavProps {
  categories: PartCategory[];
}

/**
 * ScrollspyNav - Sticky tab navigation with scrollspy
 * 
 * Features:
 * - Sticks to top of sidebar
 * - Highlights active section based on scroll position
 * - Smooth scroll to section on click
 * - Backdrop blur effect
 */
export function ScrollspyNav({ categories }: ScrollspyNavProps) {
  const [activeId, setActiveId] = useState<string>(categories[0]?.id || "");

  // IntersectionObserver to track visible sections
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    categories.forEach((category) => {
      const element = document.getElementById(category.id);
      if (!element) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
              setActiveId(category.id);
            }
          });
        },
        {
          rootMargin: "-20% 0px -60% 0px",
          threshold: [0, 0.3, 0.5, 1],
        }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, [categories]);

  const handleClick = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <nav className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-gray-200">
      <div className="px-6 py-4">
        {/* Section Title */}
        <h1 className="text-lg font-bold text-gray-900 mb-3">
          Customize Your Ride
        </h1>

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-2 px-2 pb-1">
          {categories.map((category) => {
            const isActive = activeId === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => handleClick(category.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                  whitespace-nowrap transition-all duration-200
                  ${isActive 
                    ? "bg-gray-900 text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <span>{category.icon}</span>
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

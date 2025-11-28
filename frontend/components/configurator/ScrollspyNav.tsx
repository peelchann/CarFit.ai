"use client";

import { useState, useEffect, useCallback } from "react";
import { PartCategory } from "@/lib/parts-data";

interface ScrollspyNavProps {
  categories: PartCategory[];
}

/**
 * ScrollspyNav - Sticky header with Logo and tab navigation
 * 
 * Structure:
 * - Fixed header (h-16) with Logo placeholder
 * - Sticky tab bar with IntersectionObserver scrollspy
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
    <div className="sticky top-0 z-50">
      {/* Fixed Header with Logo */}
      <header className="h-16 border-b border-gray-200 flex items-center px-6 bg-white">
        {/* Logo Placeholder - REPLACE WITH YOUR LOGO */}
        {/* To replace: swap this div with <Image src="/logo.png" width={140} height={40} alt="Logo" /> */}
        <div 
          className="w-[140px] h-[40px] bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center flex-shrink-0"
        >
          <span className="text-xs text-gray-400 font-medium">LOGO (140×40)</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Brand Text */}
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          CarFit Studio
        </span>
      </header>

      {/* Sticky Tab Navigation */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="px-6 py-3">
          {/* Section Title */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">
              Customize Your Ride
            </h1>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-2 px-2">
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
                      ? "bg-black text-white shadow-md" 
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
    </div>
  );
}

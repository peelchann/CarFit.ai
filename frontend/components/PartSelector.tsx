"use client";

import { useState } from "react";
import { Check, Info } from "lucide-react";
import { 
  PART_CATEGORIES, 
  PartOption, 
  PartCategoryId,
  getPartsByCategory 
} from "@/lib/parts-data";

interface PartSelectorProps {
  /** Map of selected parts (one per category) */
  selectedParts: Map<PartCategoryId, PartOption>;
  /** Callback when a part is selected/deselected */
  onSelect: (part: PartOption) => void;
  /** Loading state */
  isLoading?: boolean;
}

/**
 * PartSelector Component
 * 
 * Displays category tabs and part options grid.
 * Uses hardcoded data from /lib/parts-data.ts
 * 
 * TO ADD NEW PARTS:
 * - Edit /lib/parts-data.ts
 * - Add PNG to /public/parts/{category}/
 */
export function PartSelector({ selectedParts, onSelect, isLoading }: PartSelectorProps) {
  // Track which category tab is active
  const [activeCategory, setActiveCategory] = useState<PartCategoryId>('wheels');
  
  // Get parts for the active category
  const categoryParts = getPartsByCategory(activeCategory);
  const activeTab = PART_CATEGORIES.find(c => c.id === activeCategory);
  
  // Get selected part for current category (if any)
  const selectedInCategory = selectedParts.get(activeCategory);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">Parts Catalog</h2>
        <p className="text-xs text-gray-500 mt-1">
          {activeTab?.description || 'Select a category'}
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 mb-4 p-1 bg-gray-900 rounded-lg flex-shrink-0">
        {PART_CATEGORIES.map((category) => {
          const hasSelection = selectedParts.has(category.id);
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all relative ${
                activeCategory === category.id
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              }`}
            >
              <span>{category.icon}</span>
              <span className="hidden sm:inline">{category.label.split(' ')[0]}</span>
              {/* Selection indicator dot */}
              {hasSelection && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Category Label */}
      <div className="mb-3 flex items-center justify-between flex-shrink-0">
        <span className="text-sm font-medium text-gray-300">{activeTab?.label}</span>
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {categoryParts.length} Items
        </span>
      </div>

      {/* Parts Grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl p-8">
          Loading catalog...
        </div>
      ) : categoryParts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-sm border border-dashed border-gray-800 rounded-xl p-8">
          <p>No parts in this category.</p>
          <p className="text-xs mt-2">Add PNGs to /public/parts/{activeCategory}/</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
          {categoryParts.map((part) => (
            <PartCard
              key={part.id}
              part={part}
              isSelected={selectedInCategory?.id === part.id}
              onSelect={() => onSelect(part)}
            />
          ))}
        </div>
      )}

      {/* Selected Part Info */}
      {selectedInCategory && (
        <div className="mt-4 pt-4 border-t border-gray-800 flex-shrink-0">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">{selectedInCategory.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selectedInCategory.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Individual Part Card Component
 */
interface PartCardProps {
  part: PartOption;
  isSelected: boolean;
  onSelect: () => void;
}

function PartCard({ part, isSelected, onSelect }: PartCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <button
      onClick={onSelect}
      className={`group relative w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all hover:border-blue-500/50 hover:bg-gray-800/50 ${
        isSelected
          ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]"
          : "border-gray-800 bg-gray-900/50"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-950">
        {imageError ? (
          // Placeholder when image fails to load
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-gray-900 to-gray-800">
            <div className="w-8 h-8 rounded-full border-2 border-gray-700/50 flex items-center justify-center">
              <span className="text-lg">{getCategoryIcon(part.categoryId)}</span>
            </div>
          </div>
        ) : (
          // Actual part image
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={part.imagePath}
            alt={part.name}
            className="w-full h-full object-contain p-1"
            onError={() => setImageError(true)}
          />
        )}
        
        {/* Selected Checkmark */}
        {isSelected && (
          <div className="absolute right-1 top-1 rounded-full bg-blue-500 p-0.5">
            <Check className="h-2.5 w-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Part Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium text-gray-200 text-sm line-clamp-1">{part.name}</span>
          <span className="text-sm font-semibold text-blue-400 flex-shrink-0">${part.price}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{part.description}</p>
      </div>
    </button>
  );
}

/**
 * Helper to get category icon
 */
function getCategoryIcon(categoryId: PartCategoryId): string {
  const category = PART_CATEGORIES.find(c => c.id === categoryId);
  return category?.icon || '🔧';
}

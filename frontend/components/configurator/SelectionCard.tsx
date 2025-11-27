"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
 import { Check, ChevronDown, ChevronUp, Circle, Square, CheckSquare } from "lucide-react";
import Image from "next/image";
import { PartOption, SelectionType } from "@/lib/parts-data";

interface SelectionCardProps {
  option: PartOption;
  isSelected: boolean;
  selectionType: SelectionType; // 'exclusive' (radio) or 'additive' (checkbox)
  onSelect: () => void;
}

/**
 * SelectionCard - Interactive option card with exclusive/additive modes
 * 
 * Features:
 * - Exclusive mode: Radio button UI (circular indicator)
 * - Additive mode: Checkbox UI (square indicator)
 * - Visual selection state (thick border + checkmark)
 * - Hover effects
 * - Expandable accordion for details
 */
export function SelectionCard({ 
  option, 
  isSelected, 
  selectionType,
  onSelect 
}: SelectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isExclusive = selectionType === 'exclusive';

  const handleCardClick = () => {
    onSelect();
  };

  const handleAccordionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      layout
      className={`
        relative rounded-xl border-2 transition-all duration-200 cursor-pointer
        ${isSelected 
          ? "border-black bg-gray-50 shadow-md" 
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
        }
      `}
      onClick={handleCardClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      {/* Main Card Content */}
      <div className="p-4 flex items-center gap-4">
        {/* Selection Indicator - Different for exclusive vs additive */}
        <SelectionIndicator 
          isSelected={isSelected} 
          isExclusive={isExclusive} 
        />

        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative">
          <Image
            src={option.imagePath}
            alt={option.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">
              {option.name}
            </h3>
            {/* Selection type badge */}
            <span className={`
              text-[10px] px-1.5 py-0.5 rounded-full font-medium
              ${isExclusive 
                ? "bg-orange-100 text-orange-700" 
                : "bg-blue-100 text-blue-700"
              }
            `}>
              {isExclusive ? "Pick One" : "Add-on"}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">
            {option.description}
          </p>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <p className="font-bold text-gray-900">
            {option.price === 0 ? "Included" : `+$${option.price.toLocaleString()}`}
          </p>
        </div>

        {/* Accordion Toggle */}
        <button
          onClick={handleAccordionClick}
          className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label={isExpanded ? "Collapse details" : "Expand details"}
        >
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>
      </div>

      {/* Accordion Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              <div className="flex gap-4">
                {/* Larger Image Preview */}
                <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                  <Image
                    src={option.imagePath}
                    alt={option.name}
                    fill
                    sizes="128px"
                    className="object-contain p-2"
                  />
                </div>

                {/* Details */}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-700 mb-2">Details</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    {option.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-600 capitalize">
                      {option.categoryId}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="font-semibold text-green-600">
                      {option.price === 0 ? "No extra cost" : `+$${option.price.toLocaleString()}`}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500 text-xs">
                      Layer z-index: {option.zIndex}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Badge */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute -top-2 -right-2 bg-black text-white text-xs font-bold px-2 py-1 rounded-full shadow-md"
        >
          {isExclusive ? "Selected" : "Added"}
        </motion.div>
      )}
    </motion.div>
  );
}

// ==========================================
// SELECTION INDICATOR COMPONENT
// ==========================================

interface SelectionIndicatorProps {
  isSelected: boolean;
  isExclusive: boolean;
}

/**
 * Visual indicator that changes based on selection type:
 * - Exclusive: Radio button (circle)
 * - Additive: Checkbox (square)
 */
function SelectionIndicator({ isSelected, isExclusive }: SelectionIndicatorProps) {
  if (isExclusive) {
    // Radio button style (circle)
    return (
      <div
        className={`
          flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${isSelected 
            ? "bg-black border-black" 
            : "border-gray-300 bg-white"
          }
        `}
      >
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-2 h-2 rounded-full bg-white"
          />
        )}
      </div>
    );
  }

  // Checkbox style (square)
  return (
    <div
      className={`
        flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center
        transition-all duration-200
        ${isSelected 
          ? "bg-blue-600 border-blue-600" 
          : "border-gray-300 bg-white"
        }
      `}
    >
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Check className="w-4 h-4 text-white" strokeWidth={3} />
        </motion.div>
      )}
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import { PartOption, SelectionType } from "@/lib/parts-data";

interface OptionCardProps {
  option: PartOption;
  isSelected: boolean;
  type: SelectionType; // 'exclusive' (radio) or 'additive' (checkbox)
  onSelect: () => void;
}

/**
 * OptionCard - Unified selection card with CSS Grid for pixel-perfect alignment
 * 
 * Grid Structure: grid-cols-[96px_1fr_24px]
 * - Column 1: Fixed 96px (w-24) image thumbnail
 * - Column 2: Flexible text content (title + price)
 * - Column 3: Fixed 24px (w-6) selection indicator
 * 
 * This ensures perfect vertical alignment across all cards regardless of:
 * - Selection type (radio vs checkbox)
 * - Image dimensions
 * - Text length
 */
export function OptionCard({ 
  option, 
  isSelected, 
  type,
  onSelect 
}: OptionCardProps) {
  const isRadio = type === 'exclusive';

  return (
    <motion.button
      onClick={onSelect}
      className={`
        w-full grid grid-cols-[96px_1fr_24px] gap-3 items-center
        p-3 rounded-xl border-2 transition-all duration-200
        text-left cursor-pointer
        ${isSelected 
          ? "border-blue-600 bg-blue-50" 
          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
        }
      `}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
    >
      {/* Column 1: Image Thumbnail (Fixed 96px x 64px) */}
      <div className="w-24 h-16 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
        <Image
          src={option.imagePath}
          alt={option.name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      {/* Column 2: Text Content (Flexible) */}
      <div className="min-w-0 py-1">
        <h3 className="font-semibold text-gray-900 truncate text-sm">
          {option.name}
        </h3>
        <p className="text-sm font-bold text-gray-700 mt-0.5">
          {option.price === 0 ? "Included" : `+$${option.price.toLocaleString()}`}
        </p>
      </div>

      {/* Column 3: Selection Indicator (Fixed 24px) */}
      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
        {isRadio ? (
          // Radio button style (circle)
          <div
            className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center
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
                className="w-2 h-2 rounded-full bg-white"
              />
            )}
          </div>
        ) : (
          // Checkbox style (square)
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center
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
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}


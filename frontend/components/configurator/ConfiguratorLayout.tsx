"use client";

import { useCallback, useState } from "react";
import { LayeredVisualizer } from "./LayeredVisualizer";
import { ScrollspyNav } from "./ScrollspyNav";
import { CategorySection } from "./CategorySection";
import { OptionCard } from "./OptionCard";
import { 
  PART_CATEGORIES, 
  PART_OPTIONS, 
  PartCategoryId,
  getCategoryById,
  buildAiPromptFromParts
} from "@/lib/parts-data";
import { useConfiguratorStore } from "@/lib/configurator-store";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

/**
 * ConfiguratorLayout - Split-Screen Layered Composite Configurator
 * 
 * Implements the "Paper Doll" pattern:
 * - Left: LayeredVisualizer with z-index stacking
 * - Right: Scrollable options with exclusive/additive selection
 * 
 * Uses Zustand for state management.
 */
export function ConfiguratorLayout() {
  const {
    carImage,
    isGenerating,
    selections,
    selectPart,
    setResultImage,
    setIsGenerating,
    setAiMessage,
    getSelectedParts,
    getTotalPrice,
    getSelectionCount,
    isPartSelected,
  } = useConfiguratorStore();

  // Mobile preview expansion state
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);

  const totalPrice = getTotalPrice();
  const selectionCount = getSelectionCount();
  const selectedParts = getSelectedParts();
  const canGenerate = !!carImage && selectionCount > 0;

  // Toggle preview expansion (mobile only)
  const handlePreviewTap = useCallback(() => {
    setIsPreviewExpanded(prev => !prev);
  }, []);

  // ==========================================
  // AI GENERATION HANDLER
  // ==========================================
  const handleGenerate = useCallback(async () => {
    if (!carImage || selectionCount === 0) return;

    setIsGenerating(true);
    setResultImage(null);
    setAiMessage(null);

    try {
      // Convert car image to base64
      const carImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(carImage);
      });

      // For layered composite, we send all selected parts
      // The AI will need to apply multiple modifications
      const partsData = selectedParts.map(part => ({
        id: part.id,
        name: part.name,
        category: part.categoryId,
        description: part.description,
      }));

      // Get the first part's image as primary reference (for now)
      // In a full implementation, you might send all part images
      const primaryPart = selectedParts[0];
      const partImageResponse = await fetch(primaryPart.imagePath);
      const partImageBlob = await partImageResponse.blob();
      const partImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(partImageBlob);
      });

      // Build AI prompt description from selected parts
      const aiPromptDescription = buildAiPromptFromParts(selectedParts);
      const partNames = selectedParts.map(p => p.name).join(", ");

      // Call the API
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_image: carImageBase64,
          part_image: partImageBase64,
          part_name: partNames,
          part_category: primaryPart.categoryId,
          part_description: aiPromptDescription,
          // Additional data for multi-part generation
          all_parts: partsData,
        }),
      });

      const data = await response.json();

      if (data.image_base64) {
        setResultImage(data.image_base64);
        setAiMessage(data.message || `Applied ${selectionCount} modification(s) successfully.`);
      } else if (data.image_url) {
        setResultImage(data.image_url);
        setAiMessage(data.message || "Preview generated.");
      } else if (data.message) {
        setAiMessage(data.message);
        setResultImage("https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setAiMessage("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [carImage, selectedParts, selectionCount, setIsGenerating, setResultImage, setAiMessage]);

  return (
    <div className="h-screen overflow-hidden">
      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row h-screen">
        
        {/* LEFT COLUMN - Layered Visualizer */}
        {/* Mobile: Collapsible 40vh/70vh, Desktop: Fixed 62% full height */}
        <div 
          className={`
            ${isPreviewExpanded ? 'h-[70vh]' : 'h-[40vh]'} 
            lg:h-screen lg:w-[62%] lg:fixed lg:left-0 lg:top-0 
            bg-gradient-to-br from-gray-900 via-gray-800 to-black
            transition-all duration-300 ease-in-out
            flex-shrink-0
          `}
        >
          <LayeredVisualizer 
            onTapExpand={handlePreviewTap}
            isExpanded={isPreviewExpanded}
          />
        </div>

        {/* RIGHT COLUMN - Sidebar with Scroll Area + Sticky Footer */}
        <div className="flex-1 lg:w-[38%] lg:ml-[62%] flex flex-col min-h-0 border-l border-gray-200 bg-white">
          
          {/* Sticky Navigation */}
          <ScrollspyNav categories={PART_CATEGORIES} />

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pb-6">
              {PART_CATEGORIES.map((category) => {
                const categoryOptions = PART_OPTIONS.filter(
                  (opt) => opt.categoryId === category.id
                );
                
                return (
                  <CategorySection
                    key={category.id}
                    id={category.id}
                    title={category.label}
                    description={category.description}
                    icon={category.icon}
                  >
                    {/* Selection Type Hint */}
                    <div className="mb-3 flex items-center gap-2">
                      <span className={`
                        text-xs px-2 py-1 rounded-full font-medium
                        ${category.type === 'exclusive' 
                          ? "bg-orange-100 text-orange-700" 
                          : "bg-blue-100 text-blue-700"
                        }
                      `}>
                        {category.type === 'exclusive' 
                          ? "Select One" 
                          : "Select Multiple"
                        }
                      </span>
                      <span className="text-xs text-gray-400">
                        {category.type === 'exclusive' 
                          ? "Choosing a new option replaces the current one" 
                          : "Add as many as you like"
                        }
                      </span>
                    </div>

                    {/* Options - Using unified OptionCard with CSS Grid */}
                    <div className="space-y-2">
                      {categoryOptions.map((option) => (
                        <OptionCard
                          key={option.id}
                          option={option}
                          isSelected={isPartSelected(option.id)}
                          type={category.type}
                          onSelect={() => selectPart(category.id, option.id)}
                        />
                      ))}
                    </div>
                  </CategorySection>
                );
              })}
            </div>
          </div>

          {/* Sticky Footer - Mobile Optimized with Safe Area */}
          <div className="flex-shrink-0 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            {/* Mobile: Compact single row | Desktop: Two rows */}
            <div className="p-4 lg:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] lg:pb-6">
              
              {/* Mobile Layout: Price + Button in one row */}
              <div className="flex lg:hidden items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="text-lg font-bold text-gray-900">
                    ${totalPrice.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className={`
                    flex-shrink-0 px-5 py-2.5 rounded-xl font-semibold text-white 
                    transition-all text-sm
                    ${canGenerate && !isGenerating
                      ? "bg-blue-600 active:scale-[0.98]"
                      : "bg-gray-300 cursor-not-allowed"
                    }
                  `}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : !carImage ? (
                    "Upload First"
                  ) : selectionCount === 0 ? (
                    "Select Parts"
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>

              {/* Desktop Layout: Two rows */}
              <div className="hidden lg:block">
                {/* Price Summary */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Price</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${totalPrice.toLocaleString()}
                    </p>
                  </div>
                  {selectionCount > 0 && (
                    <p className="text-xs text-gray-400 text-right max-w-[150px] truncate">
                      {selectedParts.map(p => p.name).join(', ')}
                    </p>
                  )}
                </div>

                {/* Generate Button - Full Width */}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className={`
                    w-full py-3.5 rounded-xl font-semibold text-white 
                    transition-all text-base
                    ${canGenerate && !isGenerating
                      ? "bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl active:scale-[0.98]"
                      : "bg-gray-300 cursor-not-allowed"
                    }
                  `}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating Preview...
                    </span>
                  ) : !carImage ? (
                    "Upload a Photo First"
                  ) : selectionCount === 0 ? (
                    "Select Options to Continue"
                  ) : (
                    "Generate Preview"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

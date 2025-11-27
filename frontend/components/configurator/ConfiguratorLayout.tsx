"use client";

import { useCallback } from "react";
import { LayeredVisualizer } from "./LayeredVisualizer";
import { ScrollspyNav } from "./ScrollspyNav";
import { CategorySection } from "./CategorySection";
import { SelectionCard } from "./SelectionCard";
import { 
  PART_CATEGORIES, 
  PART_OPTIONS, 
  PartCategoryId,
  getCategoryById 
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

  const totalPrice = getTotalPrice();
  const selectionCount = getSelectionCount();
  const selectedParts = getSelectedParts();
  const canGenerate = !!carImage && selectionCount > 0;

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

      // Build a combined description for multi-part generation
      const combinedDescription = selectedParts
        .map(p => `${p.name} (${p.categoryId})`)
        .join(", ");

      // Call the API
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_image: carImageBase64,
          part_image: partImageBase64,
          part_name: combinedDescription,
          part_category: primaryPart.categoryId,
          part_description: `Multiple modifications: ${combinedDescription}`,
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
    <div className="min-h-screen bg-gray-50">
      {/* Split Screen Layout */}
      <div className="flex flex-col lg:flex-row lg:h-screen">
        
        {/* LEFT COLUMN - Layered Visualizer (62%) */}
        <div className="h-72 lg:h-full lg:w-[62%] lg:fixed lg:left-0 lg:top-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <LayeredVisualizer />
        </div>

        {/* RIGHT COLUMN - Scrollable Controls (38%) */}
        <div className="flex-1 lg:w-[38%] lg:ml-[62%] bg-white min-h-screen">
          {/* Sticky Navigation */}
          <ScrollspyNav categories={PART_CATEGORIES} />

          {/* Configuration Sections */}
          <div className="px-4 lg:px-6 pb-32">
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

                  {/* Options */}
                  <div className="space-y-3">
                    {categoryOptions.map((option) => (
                      <SelectionCard
                        key={option.id}
                        option={option}
                        isSelected={isPartSelected(option.id)}
                        selectionType={category.type}
                        onSelect={() => selectPart(category.id, option.id)}
                      />
                    ))}
                  </div>
                </CategorySection>
              );
            })}
          </div>

          {/* Fixed Bottom Summary Bar */}
          <div className="fixed bottom-0 right-0 lg:w-[38%] w-full bg-white border-t border-gray-200 shadow-lg z-50">
            <div className="px-4 lg:px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs lg:text-sm text-gray-500 truncate">
                  {selectionCount === 0 
                    ? "No modifications selected" 
                    : `${selectionCount} layer${selectionCount !== 1 ? 's' : ''} • ${selectedParts.map(p => p.name).join(', ')}`
                  }
                </p>
                <p className="text-xl lg:text-2xl font-bold text-gray-900">
                  ${totalPrice.toLocaleString()}
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isGenerating}
                className={`
                  flex-shrink-0 px-6 lg:px-8 py-3 rounded-full font-semibold text-white 
                  transition-all text-sm lg:text-base
                  ${canGenerate && !isGenerating
                    ? "bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl active:scale-95"
                    : "bg-gray-300 cursor-not-allowed"
                  }
                `}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </span>
                ) : !carImage ? (
                  "Upload Photo First"
                ) : selectionCount === 0 ? (
                  "Select Options"
                ) : (
                  `Generate with ${selectionCount} Layer${selectionCount !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

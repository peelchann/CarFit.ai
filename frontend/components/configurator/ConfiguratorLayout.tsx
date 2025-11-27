"use client";

import { useState, useCallback, createContext, useContext } from "react";
import { ProductVisualizer } from "./ProductVisualizer";
import { ScrollspyNav } from "./ScrollspyNav";
import { CategorySection } from "./CategorySection";
import { SelectionCard } from "./SelectionCard";
import { PART_CATEGORIES, PART_OPTIONS, PartCategoryId, PartOption } from "@/lib/parts-data";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// ============================================
// CONTEXT FOR CONFIGURATOR STATE
// ============================================

interface ConfiguratorState {
  selectedOptions: Record<PartCategoryId, string | null>;
  carImage: File | null;
  resultImage: string | null;
  isGenerating: boolean;
  aiMessage: string | null;
}

interface ConfiguratorContextType {
  state: ConfiguratorState;
  selectOption: (categoryId: PartCategoryId, optionId: string) => void;
  setCarImage: (file: File | null) => void;
  getSelectedPart: () => PartOption | null;
  clearAll: () => void;
  handleGenerate: () => Promise<void>;
}

const ConfiguratorContext = createContext<ConfiguratorContextType | null>(null);

export function useConfigurator() {
  const context = useContext(ConfiguratorContext);
  if (!context) {
    throw new Error("useConfigurator must be used within ConfiguratorLayout");
  }
  return context;
}

// ============================================
// MAIN LAYOUT COMPONENT
// ============================================

export function ConfiguratorLayout() {
  const [state, setState] = useState<ConfiguratorState>({
    selectedOptions: {
      wrap: null,
      roof: null,
      body: null,
    },
    carImage: null,
    resultImage: null,
    isGenerating: false,
    aiMessage: null,
  });

  const selectOption = useCallback((categoryId: PartCategoryId, optionId: string) => {
    setState(prev => ({
      ...prev,
      selectedOptions: {
        ...prev.selectedOptions,
        // Toggle: if already selected, deselect; otherwise select
        [categoryId]: prev.selectedOptions[categoryId] === optionId ? null : optionId,
      },
      // Clear result when changing selection
      resultImage: null,
      aiMessage: null,
    }));
  }, []);

  const setCarImage = useCallback((file: File | null) => {
    setState(prev => ({
      ...prev,
      carImage: file,
      resultImage: null,
      aiMessage: null,
    }));
  }, []);

  const getSelectedPart = useCallback((): PartOption | null => {
    // Find the first selected option across all categories
    for (const categoryId of Object.keys(state.selectedOptions) as PartCategoryId[]) {
      const optionId = state.selectedOptions[categoryId];
      if (optionId) {
        const part = PART_OPTIONS.find(p => p.id === optionId);
        if (part) return part;
      }
    }
    return null;
  }, [state.selectedOptions]);

  const clearAll = useCallback(() => {
    setState({
      selectedOptions: { wrap: null, roof: null, body: null },
      carImage: null,
      resultImage: null,
      isGenerating: false,
      aiMessage: null,
    });
  }, []);

  // Generation handler
  const handleGenerate = useCallback(async () => {
    const selectedPart = getSelectedPart();
    if (!state.carImage || !selectedPart) return;

    setState(prev => ({ ...prev, isGenerating: true, resultImage: null, aiMessage: null }));

    try {
      // Convert car image to base64
      const carImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(state.carImage!);
      });

      // Fetch the part image as base64
      const partImageResponse = await fetch(selectedPart.imagePath);
      const partImageBlob = await partImageResponse.blob();
      const partImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(partImageBlob);
      });

      // Call the API
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          car_image: carImageBase64,
          part_image: partImageBase64,
          part_name: selectedPart.name,
          part_category: selectedPart.categoryId,
          part_description: selectedPart.description,
        }),
      });

      const data = await response.json();

      if (data.image_base64) {
        setState(prev => ({
          ...prev,
          resultImage: data.image_base64,
          aiMessage: data.message || "AI generated image successfully.",
        }));
      } else if (data.image_url) {
        setState(prev => ({
          ...prev,
          resultImage: data.image_url,
          aiMessage: data.message || "Preview generated.",
        }));
      } else if (data.message) {
        setState(prev => ({
          ...prev,
          aiMessage: data.message,
          resultImage: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800",
        }));
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setState(prev => ({
        ...prev,
        aiMessage: "Failed to generate image. Please try again.",
      }));
    } finally {
      setState(prev => ({ ...prev, isGenerating: false }));
    }
  }, [state.carImage, getSelectedPart]);

  const contextValue: ConfiguratorContextType = {
    state,
    selectOption,
    setCarImage,
    getSelectedPart,
    clearAll,
    handleGenerate,
  };

  // Count total selected options
  const selectedCount = Object.values(state.selectedOptions).filter(Boolean).length;
  const selectedPart = getSelectedPart();

  // Calculate total price
  const totalPrice = Object.values(state.selectedOptions)
    .filter(Boolean)
    .reduce((sum, optionId) => {
      const part = PART_OPTIONS.find(p => p.id === optionId);
      return sum + (part?.price || 0);
    }, 0);

  return (
    <ConfiguratorContext.Provider value={contextValue}>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile: Stack layout */}
        {/* Desktop: Split screen */}
        <div className="flex flex-col lg:flex-row lg:h-screen">
          
          {/* LEFT COLUMN - Fixed Visualizer (60-65%) */}
          <div className="h-72 lg:h-full lg:w-[62%] lg:fixed lg:left-0 lg:top-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
            <ProductVisualizer
              carImage={state.carImage}
              selectedPart={selectedPart}
              resultImage={state.resultImage}
              isGenerating={state.isGenerating}
              aiMessage={state.aiMessage}
              onImageSelected={setCarImage}
              onClear={clearAll}
              onGenerate={handleGenerate}
              canGenerate={!!state.carImage && !!selectedPart}
            />
          </div>

          {/* RIGHT COLUMN - Scrollable Controls (35-40%) */}
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
                    <div className="space-y-3">
                      {categoryOptions.map((option) => (
                        <SelectionCard
                          key={option.id}
                          option={option}
                          isSelected={state.selectedOptions[category.id] === option.id}
                          onSelect={() => selectOption(category.id, option.id)}
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
                    {selectedCount === 0 
                      ? "No options selected" 
                      : `${selectedCount} ${selectedCount === 1 ? 'option' : 'options'} selected`
                    }
                  </p>
                  <p className="text-xl lg:text-2xl font-bold text-gray-900">
                    ${totalPrice.toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!state.carImage || !selectedPart || state.isGenerating}
                  className={`
                    flex-shrink-0 px-6 lg:px-8 py-3 rounded-full font-semibold text-white 
                    transition-all text-sm lg:text-base
                    ${state.carImage && selectedPart && !state.isGenerating
                      ? "bg-black hover:bg-gray-800 shadow-lg hover:shadow-xl active:scale-95"
                      : "bg-gray-300 cursor-not-allowed"
                    }
                  `}
                >
                  {state.isGenerating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : !state.carImage ? (
                    "Upload Photo First"
                  ) : !selectedPart ? (
                    "Select an Option"
                  ) : (
                    "Generate Preview"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConfiguratorContext.Provider>
  );
}

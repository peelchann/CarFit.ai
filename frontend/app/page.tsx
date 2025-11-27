"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { PartSelector } from "@/components/PartSelector";
import { ImageStage } from "@/components/ImageStage";
import { PartOption, PartCategoryId } from "@/lib/parts-data";

/**
 * CarFit Studio (VroomRoom) - Main Page
 * 
 * AI-powered car customization using Nano Banana Pro (gemini-3-pro-image-preview)
 * 
 * FLOW:
 * 1. User uploads their car photo (Image 1)
 * 2. User selects aftermarket parts from catalog (Image 2)
 * 3. AI generates photorealistic image of car with parts installed
 */

// Use relative URLs for API calls (works in both dev and production)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function Home() {
  // Selected parts - one per category
  const [selectedParts, setSelectedParts] = useState<Map<PartCategoryId, PartOption>>(new Map());
  
  // Image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);

  /**
   * Handle part selection
   */
  const handlePartSelect = useCallback((part: PartOption) => {
    setSelectedParts(prev => {
      const newMap = new Map(prev);
      const currentPart = newMap.get(part.categoryId);
      if (currentPart?.id === part.id) {
        newMap.delete(part.categoryId);
      } else {
        newMap.set(part.categoryId, part);
      }
      return newMap;
    });
  }, []);

  /**
   * Fetch part image as base64
   */
  const fetchPartImageAsBase64 = async (imagePath: string): Promise<string> => {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Failed to fetch part image:", error);
      throw error;
    }
  };

  /**
   * Generate AI preview using Nano Banana Pro
   * Sends both car image and part image to the API
   */
  const handleGenerate = useCallback(async () => {
    if (!selectedImage || selectedParts.size === 0) return;
    
    setIsGenerating(true);
    setGenerationMessage(null);
    
    try {
      // Convert car image to base64
      const carImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      // Get the first selected part (for now, generate one at a time)
      const selectedPart = Array.from(selectedParts.values())[0];
      
      // Fetch the part image as base64
      const partImageBase64 = await fetchPartImageAsBase64(selectedPart.imagePath);

      // Call the Nano Banana Pro API
      const response = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          car_image: carImageBase64,
          part_image: partImageBase64,
          part_name: selectedPart.name,
          part_category: selectedPart.categoryId,
          part_description: selectedPart.description,
        }),
      });
      
      const data = await response.json();
      
      // Handle different response types
      if (data.status === "success" && data.image_base64) {
        // AI generated image successfully
        setResultImage(data.image_base64);
        setGenerationMessage(data.message || "Generated successfully!");
      } else if (data.status === "demo" && data.image_url) {
        // Demo mode
        setResultImage(data.image_url);
        setGenerationMessage(data.message || "Demo mode - configure API key for real generation");
      } else if (data.status === "rate_limited") {
        // Rate limited
        setGenerationMessage(data.message || "Rate limited. Please wait and try again.");
        alert("Rate limited. Please wait a moment and try again.");
      } else if (data.status === "text_response") {
        // Model returned text instead of image
        setGenerationMessage(data.message);
        console.log("AI Response:", data.message);
      } else {
        // Other status
        setGenerationMessage(data.message || "Generation completed");
        console.log("API Response:", data);
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setGenerationMessage("Failed to generate. Check console for details.");
      alert("Failed to generate image. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedImage, selectedParts]);

  /**
   * Clear all state and start over
   */
  const handleClear = useCallback(() => {
    setSelectedImage(null);
    setResultImage(null);
    setSelectedParts(new Map());
    setGenerationMessage(null);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Header />
      
      <main className="container mx-auto max-w-[1600px] p-4 lg:p-6 lg:h-[calc(100vh-64px)]">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left Panel: Parts Catalog */}
          <div className="lg:col-span-3 flex flex-col gap-6 lg:h-full lg:overflow-hidden">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm lg:h-full flex flex-col">
              <PartSelector 
                selectedParts={selectedParts}
                onSelect={handlePartSelect}
                isLoading={false}
              />
              
              {/* Selected Parts Summary */}
              {selectedParts.size > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Your Build ({selectedParts.size} parts)
                  </h3>
                  <div className="space-y-1">
                    {Array.from(selectedParts.values()).map(part => (
                      <div 
                        key={part.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-300 truncate">{part.name}</span>
                        <span className="text-blue-400 font-medium">${part.price}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-800 mt-2">
                      <span className="text-white font-medium">Total</span>
                      <span className="text-blue-400 font-bold">
                        ${Array.from(selectedParts.values()).reduce((sum, p) => sum + p.price, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center/Right Panel: Image Stage */}
          <div className="lg:col-span-9 flex flex-col lg:h-full">
            <div className="flex-1 rounded-2xl bg-gray-900/20 border border-gray-800/50 p-4 lg:p-8 backdrop-blur-sm">
              <ImageStage
                selectedImage={selectedImage}
                selectedParts={selectedParts}
                resultImage={resultImage}
                isGenerating={isGenerating}
                onImageSelected={setSelectedImage}
                onClear={handleClear}
                onGenerate={handleGenerate}
                canGenerate={!!selectedImage && selectedParts.size > 0}
              />
            </div>
            
            {/* Generation Message */}
            {generationMessage && (
              <div className="mt-2 px-4 py-2 bg-gray-900/50 rounded-lg text-sm text-gray-400 text-center">
                {generationMessage}
              </div>
            )}
            
            {/* Footer */}
            <div className="mt-4 flex justify-between text-xs text-gray-600 px-2">
              <p>CarFit Studio v0.3.0 (VroomRoom)</p>
              <p>Powered by Nano Banana Pro & FastAPI</p>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

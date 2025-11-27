"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { PartSelector } from "@/components/PartSelector";
import { ImageStage } from "@/components/ImageStage";
import { PartOption } from "@/lib/parts-data";

/**
 * CarFit Studio (VroomRoom) - Main Page
 * 
 * AI-powered car customization using Nano Banana Pro
 * 
 * FLOW:
 * 1. User uploads their car photo
 * 2. User selects ONE part from catalog
 * 3. AI generates photorealistic image of car with part installed
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function Home() {
  // Single part selection (only one at a time)
  const [selectedPart, setSelectedPart] = useState<PartOption | null>(null);
  
  // Image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [generationMessage, setGenerationMessage] = useState<string | null>(null);

  /**
   * Handle part selection - only ONE part at a time
   */
  const handlePartSelect = useCallback((part: PartOption) => {
    // Toggle selection: if same part clicked, deselect; otherwise select new part
    setSelectedPart(prev => prev?.id === part.id ? null : part);
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
   */
  const handleGenerate = useCallback(async () => {
    if (!selectedImage || !selectedPart) return;
    
    setIsGenerating(true);
    setGenerationMessage("Preparing images...");
    
    try {
      // Convert car image to base64
      const carImageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedImage);
      });

      setGenerationMessage("Fetching part image...");
      
      // Fetch the part image as base64
      const partImageBase64 = await fetchPartImageAsBase64(selectedPart.imagePath);

      setGenerationMessage("Generating with AI...");

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
      console.log("API Response:", data);
      
      // Handle different response types
      if (data.status === "success" && data.image_base64) {
        // AI generated image successfully
        setResultImage(data.image_base64);
        setGenerationMessage("Generated successfully!");
      } else if (data.status === "demo" && data.image_url) {
        // Demo mode
        setResultImage(data.image_url);
        setGenerationMessage("Demo mode - showing sample image");
      } else if (data.status === "rate_limited") {
        setGenerationMessage("Rate limited. Please wait and try again.");
      } else if (data.status === "text_response" && data.message) {
        // Model returned text - this shouldn't happen with image model
        setGenerationMessage(`AI Response: ${data.message}`);
      } else if (data.message) {
        setGenerationMessage(data.message);
      } else {
        setGenerationMessage("Generation completed - check console for details");
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setGenerationMessage("Failed to generate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [selectedImage, selectedPart]);

  /**
   * Clear all state and start over
   */
  const handleClear = useCallback(() => {
    setSelectedImage(null);
    setResultImage(null);
    setSelectedPart(null);
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
                selectedPart={selectedPart}
                onSelect={handlePartSelect}
                isLoading={false}
              />
              
              {/* Selected Part Summary */}
              {selectedPart && (
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    Selected Part
                  </h3>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-300 truncate">{selectedPart.name}</span>
                    <span className="text-blue-400 font-bold">${selectedPart.price}</span>
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
                selectedPart={selectedPart}
                resultImage={resultImage}
                isGenerating={isGenerating}
                onImageSelected={setSelectedImage}
                onClear={handleClear}
                onGenerate={handleGenerate}
                canGenerate={!!selectedImage && !!selectedPart}
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

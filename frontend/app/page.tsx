"use client";

import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { PartSelector } from "@/components/PartSelector";
import { ImageStage } from "@/components/ImageStage";
import { PartOption, PartCategoryId } from "@/lib/parts-data";

/**
 * CarFit Studio - Main Page
 * 
 * This is the main application page that orchestrates:
 * - Part selection (via PartSelector)
 * - Image upload and overlay preview (via ImageStage)
 * - AI generation requests
 * 
 * STATE MANAGEMENT:
 * - selectedParts: Map of categoryId -> PartOption (one part per category)
 * - selectedImage: The uploaded car photo
 * - resultImage: The AI-generated result
 */

// Use relative URLs for API calls (works in both dev and production)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

export default function Home() {
  // Selected parts - one per category (Map ensures only one part per category)
  const [selectedParts, setSelectedParts] = useState<Map<PartCategoryId, PartOption>>(new Map());
  
  
  // Image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  /**
   * Handle part selection
   * - If part is already selected, deselect it
   * - If different part in same category, replace it
   * - If part in new category, add it
   */
  const handlePartSelect = useCallback((part: PartOption) => {
    setSelectedParts(prev => {
      const newMap = new Map(prev);
      
      // Check if this exact part is already selected
      const currentPart = newMap.get(part.categoryId);
      if (currentPart?.id === part.id) {
        // Deselect if clicking the same part
        newMap.delete(part.categoryId);
      } else {
        // Select new part (replaces any existing part in same category)
        newMap.set(part.categoryId, part);
      }
      
      return newMap;
    });
  }, []);

  /**
   * Generate AI preview
   * Sends the car image and selected parts to the backend
   */
  const handleGenerate = useCallback(async () => {
    if (!selectedImage || selectedParts.size === 0) return;
    
    setIsGenerating(true);
    
    // Convert file to base64 data URI
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      
      // Build prompt from selected parts
      const partsDescription = Array.from(selectedParts.values())
        .map(part => `${part.name} (${part.description})`)
        .join(", ");
      
      try {
        const response = await fetch(`${API_BASE}/api/generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: base64data,
            part_id: Array.from(selectedParts.values()).map(p => p.id).join(","),
            prompt: `Car customization with: ${partsDescription}. Photorealistic, 8k, cinematic lighting, professional automotive photography.`,
          }),
        });
        
        const data = await response.json();
        if (data.image_url) {
          setResultImage(data.image_url);
        } else if (data.message) {
          // For demo mode or text responses
          console.log("API Response:", data.message);
          // Show a demo image for now
          setResultImage("https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800");
        }
      } catch (error) {
        console.error("Generation failed:", error);
        alert("Failed to generate image. Check console for details.");
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(selectedImage);
  }, [selectedImage, selectedParts]);

  /**
   * Clear all state and start over
   */
  const handleClear = useCallback(() => {
    setSelectedImage(null);
    setResultImage(null);
    setSelectedParts(new Map());
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
            
            {/* Footer */}
            <div className="mt-4 flex justify-between text-xs text-gray-600 px-2">
              <p>CarFit Studio v0.2.0 (VroomRoom MVP)</p>
              <p>Powered by Gemini AI & FastAPI</p>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

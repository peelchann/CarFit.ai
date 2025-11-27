"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { PartSelector } from "@/components/PartSelector";
import { ImageStage } from "@/components/ImageStage";

interface Part {
  id: string;
  name: string;
  image: string;
  category: string;
  price: number;
}

export default function Home() {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoadingParts, setIsLoadingParts] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedPart, setSelectedPart] = useState<Part | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  // Fetch parts from backend
  useEffect(() => {
    setIsLoadingParts(true);
    fetch("http://localhost:8001/api/parts")
      .then((res) => res.json())
      .then((data) => {
        if (data.parts) {
          setParts(data.parts);
        }
      })
      .catch((err) => console.error("Failed to fetch parts:", err))
      .finally(() => setIsLoadingParts(false));
  }, []);

  const handleGenerate = async () => {
    if (!selectedImage || !selectedPart) return;
    setIsGenerating(true);
    
    // Convert file to base64 data URI
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64data = reader.result as string;
      
      try {
        const response = await fetch("http://localhost:8001/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image_url: base64data,
            part_id: selectedPart.id,
            prompt: `car with ${selectedPart.name} ${selectedPart.category}, realistic, 8k, cinematic lighting`,
          }),
        });
        
        const data = await response.json();
        if (data.image_url) {
          setResultImage(data.image_url);
        }
      } catch (error) {
        console.error("Generation failed:", error);
        alert("Failed to generate image. Check console.");
      } finally {
        setIsGenerating(false);
      }
    };
    reader.readAsDataURL(selectedImage);
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <Header />
      
      <main className="container mx-auto max-w-[1600px] p-4 lg:p-6 lg:h-[calc(100vh-64px)]">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-12">
          
          {/* Left Panel: Parts Catalog */}
          <div className="lg:col-span-3 flex flex-col gap-6 lg:h-full lg:overflow-hidden">
            <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 backdrop-blur-sm lg:h-full flex flex-col">
              <PartSelector 
                parts={parts} 
                selectedPart={selectedPart} 
                onSelect={setSelectedPart}
                isLoading={isLoadingParts}
              />
            </div>
          </div>

          {/* Center/Right Panel: Image Stage */}
          <div className="lg:col-span-9 flex flex-col lg:h-full">
            <div className="flex-1 rounded-2xl bg-gray-900/20 border border-gray-800/50 p-4 lg:p-8 backdrop-blur-sm">
               <ImageStage
                 selectedImage={selectedImage}
                 resultImage={resultImage}
                 isGenerating={isGenerating}
                 onImageSelected={setSelectedImage}
                 onClear={() => {
                   setSelectedImage(null);
                   setResultImage(null);
                   setSelectedPart(null);
                 }}
                 onGenerate={handleGenerate}
                 canGenerate={!!selectedImage && !!selectedPart}
               />
            </div>
            
            {/* Quick status bar or footer info could go here */}
            <div className="mt-4 flex justify-between text-xs text-gray-600 px-2">
               <p>CarFit Studio v0.1.0 (MVP)</p>
               <p>Powered by Replicate AI & FastAPI</p>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}

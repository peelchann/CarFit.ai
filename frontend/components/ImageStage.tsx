"use client";

import { Upload, X, Wand2, Loader2, ArrowRight, ImageIcon } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { clsx } from "clsx";
import { PartOption, PartCategoryId } from "@/lib/parts-data";

interface ImageStageProps {
  selectedImage: File | null;
  selectedPart: PartOption | null;  // Changed: single part, not Map
  resultImage: string | null;
  isGenerating: boolean;
  onImageSelected: (file: File) => void;
  onClear: () => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

/**
 * ImageStage Component
 * 
 * Shows car image and selected part side by side, then generates combined result
 */
export function ImageStage({
  selectedImage,
  selectedPart,
  resultImage,
  isGenerating,
  onImageSelected,
  onClear,
  onGenerate,
  canGenerate,
}: ImageStageProps) {
  const [isDragging, setIsDragging] = useState(false);

  // Create object URL for the selected image
  const imageUrl = useMemo(() => {
    if (selectedImage) {
      return URL.createObjectURL(selectedImage);
    }
    return null;
  }, [selectedImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImageSelected(file);
      }
    },
    [onImageSelected]
  );

  // ==========================================
  // RESULT VIEW - Show AI generated image
  // ==========================================
  if (resultImage) {
    return (
      <div className="relative h-full w-full flex flex-col">
        <div className="flex-1 rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden group shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultImage}
            alt="AI Generated Result"
            className="h-full w-full object-contain"
          />
          
          {/* Overlay Actions */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 flex items-end justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">AI Generated Preview</h3>
              <p className="text-gray-400 text-sm">Powered by Nano Banana Pro</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={onClear} 
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors text-sm font-medium"
              >
                Start Over
              </button>
              <button className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 transition-all text-sm font-medium flex items-center gap-2">
                Save Build <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={onClear}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // PREVIEW VIEW - Show car and part SIDE BY SIDE
  // ==========================================
  if (selectedImage && imageUrl) {
    return (
      <div className="relative h-full w-full flex flex-col">
        {/* Two images side by side */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LEFT: User's Car Image */}
          <div className="relative rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden">
            <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-black/70 rounded-full text-xs text-white backdrop-blur-sm">
              Your Car
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Your vehicle"
              className="h-full w-full object-contain"
            />
            <button
              onClick={onClear}
              className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* RIGHT: Selected Part Image */}
          <div className="relative rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden flex items-center justify-center">
            <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-black/70 rounded-full text-xs text-white backdrop-blur-sm">
              Part to Install
            </div>
            
            {selectedPart ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPart.imagePath}
                  alt={selectedPart.name}
                  className="h-full w-full object-contain p-4"
                />
                <div className="absolute bottom-3 left-3 right-3 bg-black/70 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-white font-medium text-sm">{selectedPart.name}</p>
                  <p className="text-gray-400 text-xs">{selectedPart.description}</p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-gray-500 p-8">
                <ImageIcon className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm text-center">Select a part from the catalog</p>
              </div>
            )}
          </div>
        </div>

        {/* Generating Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
              <div className="relative rounded-full bg-gray-900 p-4 shadow-xl border border-gray-800">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            </div>
            <p className="mt-6 text-lg font-medium text-white animate-pulse">Generating with AI...</p>
            <p className="text-sm text-gray-400">Nano Banana Pro is installing the part</p>
          </div>
        )}

        {/* Generate Action Bar */}
        <div className="mt-6">
          <button
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
            className={clsx(
              "group relative w-full overflow-hidden rounded-xl py-4 transition-all",
              !canGenerate || isGenerating
                ? "cursor-not-allowed bg-gray-800 text-gray-500"
                : "bg-blue-600 hover:bg-blue-500 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)]"
            )}
          >
            <div className="relative z-10 flex items-center justify-center gap-2 font-bold text-white">
              {isGenerating ? (
                "Generating..."
              ) : (
                <>
                  <Wand2 className="h-5 w-5" />
                  <span>Generate AI Preview</span>
                </>
              )}
            </div>
            {canGenerate && !isGenerating && (
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:animate-shimmer" />
            )}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            {!selectedPart 
              ? "Select a part to continue" 
              : !selectedImage
              ? "Upload your car photo"
              : "Ready to generate • ~15s processing time"}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY STATE - Upload dropzone
  // ==========================================
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        "relative flex h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
        isDragging
          ? "border-blue-500 bg-blue-500/10"
          : "border-gray-800 bg-gray-900/50 hover:border-gray-700 hover:bg-gray-900"
      )}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      
      <div className="mb-6 rounded-full bg-gray-800 p-6 shadow-xl ring-1 ring-white/5">
        <Upload className="h-10 w-10 text-gray-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-white">Upload your vehicle</h3>
      <p className="mt-2 text-center text-sm text-gray-400 max-w-xs">
        Drag and drop your car photo here, or click to browse.
      </p>
      
      <div className="mt-8 flex gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" /> JPG, PNG
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-500" /> Max 10MB
        </span>
      </div>
    </div>
  );
}

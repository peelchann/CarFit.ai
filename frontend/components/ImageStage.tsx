"use client";

import { Upload, X, Wand2, Loader2, ArrowRight, Layers } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { clsx } from "clsx";
import { PartOption, PartCategoryId, getOverlayAnchor } from "@/lib/parts-data";

interface ImageStageProps {
  selectedImage: File | null;
  selectedParts: Map<PartCategoryId, PartOption>;
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
 * Handles the main image display area:
 * - Empty state: Upload dropzone
 * - Image selected: Shows car with part overlays
 * - Generated: Shows AI result
 * 
 * OVERLAY SYSTEM:
 * - Parts are positioned using CSS transforms based on anchor points
 * - Each category has its own anchor (x, y, scale) in /lib/parts-data.ts
 * - Overlays update in real-time as parts are selected
 */
export function ImageStage({
  selectedImage,
  selectedParts,
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

  // Count of applied overlays
  const overlayCount = selectedParts.size;

  // ==========================================
  // RESULT VIEW - Show AI generated image
  // ==========================================
  if (resultImage) {
    return (
      <div className="relative h-full w-full rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden group shadow-2xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resultImage}
          alt="Generated Result"
          className="h-full w-full object-contain"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 flex items-end justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">Your Custom Build</h3>
            <p className="text-gray-400 text-sm">Generated with Gemini AI</p>
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
    );
  }

  // ==========================================
  // PREVIEW VIEW - Show car with part overlays
  // ==========================================
  if (selectedImage && imageUrl) {
    return (
      <div className="relative h-full w-full flex flex-col">
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-gray-950 border border-gray-800 group">
          {/* Base Car Image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Your vehicle"
            className="h-full w-full object-contain"
          />

          {/* Part Overlays - Positioned using anchor points */}
          {Array.from(selectedParts.entries()).map(([categoryId, part]) => {
            const anchor = getOverlayAnchor(categoryId);
            return (
              <PartOverlay
                key={part.id}
                part={part}
                anchor={anchor}
              />
            );
          })}

          {/* Overlay Count Badge */}
          {overlayCount > 0 && (
            <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur-md">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white font-medium">
                {overlayCount} part{overlayCount !== 1 ? 's' : ''} applied
              </span>
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClear}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Generating Overlay */}
          {isGenerating && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
                <div className="relative rounded-full bg-gray-900 p-4 shadow-xl border border-gray-800">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
              </div>
              <p className="mt-6 text-lg font-medium text-white animate-pulse">Generating preview...</p>
              <p className="text-sm text-gray-400">AI is customizing your vehicle</p>
            </div>
          )}
        </div>

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
                "Processing..."
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
            {!canGenerate 
              ? "Select at least one part to continue" 
              : `${overlayCount} part${overlayCount !== 1 ? 's' : ''} selected • ~15s processing time`}
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

/**
 * PartOverlay Component
 * 
 * Renders a single part overlay on top of the car image.
 * Position and scale are determined by the anchor configuration.
 * 
 * TO ADJUST POSITIONING:
 * - Edit OVERLAY_ANCHORS in /lib/parts-data.ts
 * - x: 0 = left, 0.5 = center, 1 = right
 * - y: 0 = top, 0.5 = center, 1 = bottom
 * - scale: relative size (0.3 = 30% of image width)
 */
interface PartOverlayProps {
  part: PartOption;
  anchor: { x: number; y: number; scale: number };
}

function PartOverlay({ part, anchor }: PartOverlayProps) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Show placeholder if image fails to load
    return (
      <div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          left: `${anchor.x * 100}%`,
          top: `${anchor.y * 100}%`,
          transform: "translate(-50%, -50%)",
          width: `${anchor.scale * 100}%`,
        }}
      >
        <div className="bg-gray-800/80 rounded-lg px-3 py-2 text-xs text-gray-400 backdrop-blur-sm">
          {part.name} (image not found)
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute pointer-events-none transition-all duration-300 ease-out"
      style={{
        left: `${anchor.x * 100}%`,
        top: `${anchor.y * 100}%`,
        transform: "translate(-50%, -50%)",
        width: `${anchor.scale * 100}%`,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={part.imagePath}
        alt={part.name}
        className="w-full h-auto drop-shadow-2xl"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

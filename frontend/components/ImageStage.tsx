import { Upload, X, Wand2, Loader2, ArrowRight } from "lucide-react";
import { useState, useCallback } from "react";
import { clsx } from "clsx";

interface ImageStageProps {
  selectedImage: File | null;
  resultImage: string | null;
  isGenerating: boolean;
  onImageSelected: (file: File) => void;
  onClear: () => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

export function ImageStage({
  selectedImage,
  resultImage,
  isGenerating,
  onImageSelected,
  onClear,
  onGenerate,
  canGenerate,
}: ImageStageProps) {
  const [isDragging, setIsDragging] = useState(false);

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

  // If we have a result, show the result view
  if (resultImage) {
    return (
      <div className="relative h-full w-full rounded-2xl bg-gray-950 border border-gray-800 overflow-hidden group shadow-2xl">
        <img
          src={resultImage}
          alt="Generated Result"
          className="h-full w-full object-contain"
        />
        
        {/* Overlay Actions */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 flex items-end justify-between">
           <div>
             <h3 className="text-white font-semibold text-lg">Your Custom Build</h3>
             <p className="text-gray-400 text-sm">Generated with Stable Diffusion XL</p>
           </div>
           <div className="flex gap-3">
             <button 
                onClick={onClear} 
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-colors text-sm font-medium"
             >
               Discard
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

  // If an image is selected but not generated yet
  if (selectedImage) {
    const imageUrl = URL.createObjectURL(selectedImage);
    return (
      <div className="relative h-full w-full flex flex-col">
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-gray-950 border border-gray-800 group">
          <img
            src={imageUrl}
            alt="Original Upload"
            className="h-full w-full object-contain opacity-80 transition-opacity group-hover:opacity-100"
          />
          
          <button
            onClick={onClear}
            className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur-md transition-colors hover:bg-black/70"
          >
            <X className="h-5 w-5" />
          </button>

          {isGenerating && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="relative">
                 <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/20"></div>
                 <div className="relative rounded-full bg-gray-900 p-4 shadow-xl border border-gray-800">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                 </div>
              </div>
              <p className="mt-6 text-lg font-medium text-white animate-pulse">Installing parts...</p>
              <p className="text-sm text-gray-400">AI is analyzing your vehicle geometry</p>
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
                        <span>Generate Preview</span>
                        </>
                    )}
                </div>
                {canGenerate && !isGenerating && (
                     <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:animate-shimmer" />
                )}
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">
                {!canGenerate 
                   ? "Select a part to continue" 
                   : "1 Generation = ~15s. Requires GPU processing."}
            </p>
        </div>
      </div>
    );
  }

  // Empty State (Upload)
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


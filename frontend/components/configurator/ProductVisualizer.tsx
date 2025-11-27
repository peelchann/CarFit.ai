"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Sparkles, Download, RotateCcw } from "lucide-react";
import Image from "next/image";
import { PartOption } from "@/lib/parts-data";

interface ProductVisualizerProps {
  carImage: File | null;
  selectedPart: PartOption | null;
  resultImage: string | null;
  isGenerating: boolean;
  aiMessage: string | null;
  onImageSelected: (file: File) => void;
  onClear: () => void;
  onGenerate: () => void;
  canGenerate: boolean;
}

/**
 * ProductVisualizer - Fixed left column showing the car/result
 * 
 * Features:
 * - Drag & drop image upload
 * - Shows uploaded car image
 * - Shows AI-generated result
 * - Loading state with animation
 * - Selected part indicator
 */
export function ProductVisualizer({
  carImage,
  selectedPart,
  resultImage,
  isGenerating,
  aiMessage,
  onImageSelected,
  onClear,
  onGenerate,
  canGenerate,
}: ProductVisualizerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [carImageSrc, setCarImageSrc] = useState<string | null>(null);

  // Create object URL for car image
  useEffect(() => {
    if (carImage) {
      const url = URL.createObjectURL(carImage);
      setCarImageSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCarImageSrc(null);
    }
  }, [carImage]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onImageSelected(file);
    }
  }, [onImageSelected]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  }, [onImageSelected]);

  // Result View
  if (resultImage) {
    return (
      <div className="relative h-full w-full flex flex-col">
        {/* Result Image */}
        <div className="flex-1 relative">
          <Image
            src={resultImage}
            alt="Generated Result"
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
          
          {/* AI Message Overlay */}
          {aiMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2"
            >
              <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-white/90">{aiMessage}</p>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button
            onClick={onClear}
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-colors"
            title="Start Over"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <a
            href={resultImage}
            download="carfit-preview.png"
            className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-colors"
            title="Download"
          >
            <Download className="w-5 h-5" />
          </a>
        </div>

        {/* Success Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1"
        >
          <Sparkles className="w-4 h-4" />
          AI Generated
        </motion.div>
      </div>
    );
  }

  // Car Image Uploaded View
  if (carImage && carImageSrc) {
    return (
      <div className="relative h-full w-full flex flex-col">
        {/* Car Image */}
        <div className="flex-1 relative">
          <Image
            src={carImageSrc}
            alt="Your Car"
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />

          {/* Loading Overlay */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full"
                  />
                  <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-white" />
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 text-white font-medium"
                >
                  Generating your custom build...
                </motion.p>
                <p className="text-white/60 text-sm mt-1">
                  This may take 15-30 seconds
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Part Indicator */}
        {selectedPart && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-white/20 relative overflow-hidden">
                <Image
                  src={selectedPart.imagePath}
                  alt={selectedPart.name}
                  fill
                  sizes="48px"
                  className="object-contain p-1"
                />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium text-sm">{selectedPart.name}</p>
                <p className="text-white/60 text-xs">{selectedPart.categoryId}</p>
              </div>
              <p className="text-white font-bold">${selectedPart.price.toLocaleString()}</p>
            </div>
          </motion.div>
        )}

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-colors"
          title="Remove Image"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Upload Info */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
          <p className="text-white/80 text-xs">Your Vehicle</p>
        </div>
      </div>
    );
  }

  // Empty State - Upload Prompt
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative h-full w-full flex flex-col items-center justify-center p-8
        transition-all duration-200
        ${isDragging ? "bg-white/10" : ""}
      `}
    >
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className={`
          mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6
          transition-all duration-200
          ${isDragging ? "bg-white/20 scale-110" : "bg-white/10"}
        `}>
          <Upload className={`w-8 h-8 ${isDragging ? "text-white" : "text-white/60"}`} />
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Upload Your Vehicle
        </h2>
        <p className="text-white/60 max-w-xs mx-auto mb-6">
          Drag and drop your car photo here, or click to browse
        </p>

        <div className="flex gap-4 justify-center text-xs text-white/40">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            JPG, PNG, WebP
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            Max 10MB
          </span>
        </div>
      </motion.div>

      {/* Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}


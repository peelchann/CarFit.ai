"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, Loader2, Sparkles, Download, RotateCcw, Layers } from "lucide-react";
import Image from "next/image";
import { useConfiguratorStore } from "@/lib/configurator-store";
import { PartOption } from "@/lib/parts-data";

/**
 * LayeredVisualizer - The "Paper Doll" Compositor
 * 
 * This component implements a Z-Index layering system where multiple
 * transparent PNG layers are stacked on top of the user's car image.
 * 
 * Architecture:
 * - Base Layer (z-0): User's uploaded car photo
 * - Part Layers (z-10+): Transparent PNGs sorted by zIndex
 * - UI Overlays (z-50+): Loading states, messages, controls
 */
export function LayeredVisualizer() {
  const {
    carImage,
    carImageUrl,
    resultImage,
    isGenerating,
    aiMessage,
    setCarImage,
    clearAll,
    getSelectedLayers,
    getSelectionCount,
  } = useConfiguratorStore();

  const selectedLayers = getSelectedLayers();
  const selectionCount = getSelectionCount();

  // File handling
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setCarImage(file);
    }
  }, [setCarImage]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCarImage(file);
    }
  }, [setCarImage]);

  // ==========================================
  // RESULT VIEW (AI Generated)
  // ==========================================
  if (resultImage) {
    return (
      <div className="relative h-full w-full flex flex-col">
        {/* Logo Watermark - Glass Style */}
        <div className="absolute top-6 left-6 z-20 border-2 border-white/30 text-white font-bold text-xl px-4 py-1 rounded backdrop-blur-md">
          CarFit Studio
        </div>

        <div className="flex-1 relative">
          <Image
            src={resultImage}
            alt="Generated Result"
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
          
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
        <div className="absolute top-6 right-6 flex gap-2 z-20">
          <button
            onClick={clearAll}
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

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-6 left-6 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 z-20"
        >
          <Sparkles className="w-4 h-4" />
          AI Generated
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // COMPOSITOR VIEW (Layered Preview)
  // ==========================================
  if (carImage && carImageUrl) {
    return (
      <div className="relative h-screen w-full">
        {/* Logo Watermark - Glass Style */}
        <div className="absolute top-6 left-6 z-20 border-2 border-white/30 text-white font-bold text-xl px-4 py-1 rounded backdrop-blur-md">
          CarFit Studio
        </div>

        {/* Layer Stack Container */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-3xl max-h-full">
            
            {/* BASE LAYER: User's Car Photo (z-index: 0) */}
            <div className="absolute inset-0">
              <Image
                src={carImageUrl}
                alt="Your Car"
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>

            {/* PART LAYERS: Transparent PNGs sorted by z-index */}
            <AnimatePresence>
              {selectedLayers.map((layer) => (
                <PartLayer key={layer.id} part={layer} />
              ))}
            </AnimatePresence>

            {/* LOADING OVERLAY */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-50"
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
                    AI is compositing {selectionCount} modification{selectionCount !== 1 ? 's' : ''}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Clear Button */}
        <button
          onClick={clearAll}
          className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full text-white transition-colors z-20"
          title="Remove Image"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Layer Count Badge */}
        {selectionCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-6 left-6 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 z-20"
          >
            <Layers className="w-4 h-4" />
            {selectionCount} Layer{selectionCount !== 1 ? 's' : ''}
          </motion.div>
        )}

        {/* Upload Info */}
        <div className="absolute bottom-6 right-6 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full z-20">
          <p className="text-white/80 text-xs">Your Vehicle • Live Preview</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // EMPTY STATE (Upload Prompt)
  // ==========================================
  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative h-screen w-full flex flex-col items-center justify-center p-8"
    >
      {/* Logo Watermark - Glass Style */}
      <div className="absolute top-6 left-6 z-20 border-2 border-white/30 text-white font-bold text-xl px-4 py-1 rounded backdrop-blur-md">
        CarFit Studio
      </div>

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
        <div className="mx-auto w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6">
          <Upload className="w-8 h-8 text-white/60" />
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

// ==========================================
// PART LAYER COMPONENT
// ==========================================

interface PartLayerProps {
  part: PartOption;
}

/**
 * Individual part layer with fade-in animation
 * Note: Layer images are placeholders - in production, replace with actual transparent PNGs
 */
function PartLayer({ part }: PartLayerProps) {
  const [hasError, setHasError] = useState(false);

  // Don't render anything if the image failed to load
  // The layer system requires proper transparent PNGs to work
  if (hasError) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: part.zIndex }}
    >
      <Image
        src={part.layerImageUrl}
        alt={part.name}
        fill
        sizes="100vw"
        className="object-contain"
        onError={() => setHasError(true)}
        unoptimized
      />
      
      {/* Layer label (optional, for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded"
          style={{ zIndex: part.zIndex + 1 }}
        >
          z:{part.zIndex} {part.name}
        </div>
      )}
    </motion.div>
  );
}


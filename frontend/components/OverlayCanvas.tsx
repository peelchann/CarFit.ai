"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PartOption, PartCategoryId, getOverlayAnchor, OverlayAnchor } from "@/lib/parts-data";

interface OverlayCanvasProps {
  /** The base car image file */
  carImage: File;
  /** Currently selected parts to overlay (one per category) */
  selectedParts: Map<PartCategoryId, PartOption>;
  /** Callback when canvas is ready with composite image */
  onCompositeReady?: (dataUrl: string) => void;
}

/**
 * OverlayCanvas Component
 * 
 * Renders the car image with part overlays positioned using anchor points.
 * 
 * HOW OVERLAY POSITIONING WORKS:
 * - Each category has an anchor point defined in OVERLAY_ANCHORS (lib/parts-data.ts)
 * - x, y are normalized (0-1) coordinates on the canvas
 * - scale determines the size of the overlay relative to canvas
 * 
 * TO ADJUST POSITIONING:
 * - Edit OVERLAY_ANCHORS in /lib/parts-data.ts
 * - Or fine-tune your PNG assets to match the default anchors
 */
export function OverlayCanvas({ carImage, selectedParts, onCompositeReady }: OverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load an image and return a promise
   */
  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }, []);

  /**
   * Draw a part overlay at its anchor position
   */
  const drawOverlay = useCallback((
    ctx: CanvasRenderingContext2D,
    partImage: HTMLImageElement,
    anchor: OverlayAnchor,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    // Calculate overlay dimensions based on scale
    const overlayWidth = canvasWidth * anchor.scale;
    const overlayHeight = (partImage.height / partImage.width) * overlayWidth;

    // Calculate position (anchor point is center of overlay)
    const x = (anchor.x * canvasWidth) - (overlayWidth / 2);
    const y = (anchor.y * canvasHeight) - (overlayHeight / 2);

    // Draw the overlay
    ctx.drawImage(partImage, x, y, overlayWidth, overlayHeight);
  }, []);

  /**
   * Main render function - draws car + all overlays
   */
  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsLoading(true);

    try {
      // Load the car image
      const carImageUrl = URL.createObjectURL(carImage);
      const carImg = await loadImage(carImageUrl);
      URL.revokeObjectURL(carImageUrl);

      // Set canvas dimensions to match car image aspect ratio
      const containerWidth = containerRef.current?.clientWidth || 800;
      const aspectRatio = carImg.height / carImg.width;
      const canvasWidth = containerWidth;
      const canvasHeight = containerWidth * aspectRatio;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      setDimensions({ width: canvasWidth, height: canvasHeight });

      // Clear canvas
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw the base car image
      ctx.drawImage(carImg, 0, 0, canvasWidth, canvasHeight);

      // Draw each selected part overlay
      for (const [categoryId, part] of selectedParts) {
        try {
          const partImg = await loadImage(part.imagePath);
          const anchor = getOverlayAnchor(categoryId);
          drawOverlay(ctx, partImg, anchor, canvasWidth, canvasHeight);
        } catch (error) {
          console.warn(`Failed to load overlay for ${part.name}:`, error);
          // Continue with other overlays even if one fails
        }
      }

      // Notify parent of composite image
      if (onCompositeReady) {
        const dataUrl = canvas.toDataURL("image/png");
        onCompositeReady(dataUrl);
      }

    } catch (error) {
      console.error("Failed to render canvas:", error);
    } finally {
      setIsLoading(false);
    }
  }, [carImage, selectedParts, loadImage, drawOverlay, onCompositeReady]);

  // Re-render when inputs change
  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      renderCanvas();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [renderCanvas]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg"
        style={{ maxHeight: "100%" }}
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-300">Rendering...</span>
          </div>
        </div>
      )}

      {/* Debug overlay anchors (uncomment to visualize) */}
      {/* {process.env.NODE_ENV === 'development' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from(selectedParts.keys()).map(categoryId => {
            const anchor = getOverlayAnchor(categoryId);
            return (
              <div
                key={categoryId}
                className="absolute w-4 h-4 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${anchor.x * 100}%`,
                  top: `${anchor.y * 100}%`,
                }}
                title={`${categoryId}: (${anchor.x}, ${anchor.y})`}
              />
            );
          })}
        </div>
      )} */}
    </div>
  );
}

/**
 * Simplified overlay preview (no canvas, just CSS positioning)
 * Use this for quick previews without full canvas rendering
 */
interface SimpleOverlayProps {
  carImageUrl: string;
  selectedParts: Map<PartCategoryId, PartOption>;
}

export function SimpleOverlay({ carImageUrl, selectedParts }: SimpleOverlayProps) {
  return (
    <div className="relative w-full h-full">
      {/* Base car image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={carImageUrl}
        alt="Your car"
        className="w-full h-full object-contain"
      />

      {/* Part overlays positioned with CSS */}
      {Array.from(selectedParts.entries()).map(([categoryId, part]) => {
        const anchor = getOverlayAnchor(categoryId);
        return (
          <div
            key={part.id}
            className="absolute pointer-events-none"
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
              className="w-full h-auto"
            />
          </div>
        );
      })}
    </div>
  );
}


/**
 * CarFit Studio - Parts Data Model & Constants
 * 
 * This file contains all the typed data models and hardcoded part options.
 * 
 * TO SWAP ASSETS:
 * - Navigate to /public/parts/{category}/
 * - Replace the PNG files, keeping the SAME filenames
 * - The UI will automatically use your new images
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Valid part category identifiers
 * Add new categories here as literal types
 */
export type PartCategoryId = 'wrap' | 'roof' | 'body';

/**
 * Part category metadata
 */
export interface PartCategory {
  id: PartCategoryId;
  label: string;
  description: string;
  icon: string; // Emoji or icon identifier
}

/**
 * Individual part option within a category
 */
export interface PartOption {
  id: string;
  categoryId: PartCategoryId;
  name: string;
  description: string;
  imagePath: string; // Relative path to PNG in /public/parts/...
  price: number; // Price in USD for display
}

/**
 * Overlay anchor point configuration for positioning parts on the car image
 */
export interface OverlayAnchor {
  x: number;      // Normalized 0–1 across width (0 = left, 1 = right)
  y: number;      // Normalized 0–1 across height (0 = top, 1 = bottom)
  scale: number;  // Relative scaling factor for the PNG (1.0 = 100%)
}

// ============================================
// CONSTANTS - CATEGORIES
// ============================================

/**
 * Available part categories
 * Displayed as tabs/buttons in the UI
 */
export const PART_CATEGORIES: PartCategory[] = [
  {
    id: 'wrap',
    label: 'Car Wraps',
    description: 'Transform your car with vinyl wraps.',
    icon: '🎨',
  },
  {
    id: 'roof',
    label: 'Roof Storage',
    description: 'Add roof boxes, racks, or baskets.',
    icon: '📦',
  },
  {
    id: 'body',
    label: 'Body Style Accent',
    description: 'Front lip, side skirts, or spoiler.',
    icon: '🏎️',
  },
];

// ============================================
// CONSTANTS - PART OPTIONS
// ============================================

/**
 * All available part options
 * 
 * TO ADD NEW PARTS:
 * 1. Add the PNG to /public/parts/{category}/
 * 2. Add a new entry here with the correct imagePath
 * 
 * TO REPLACE EXISTING PARTS:
 * - Just replace the PNG file at the imagePath location
 * - Keep the same filename
 */
export const PART_OPTIONS: PartOption[] = [
  // ==========================================
  // CAR WRAPS - 3 options
  // PNG location: /public/parts/wrap/
  // ==========================================
  {
    id: 'wrap_matte_black_01',
    categoryId: 'wrap',
    name: 'Matte Black Wrap',
    description: 'Sleek matte black finish for a stealthy look.',
    imagePath: '/parts/wrap/wrap_matte_black_01.png',
    price: 2499,
  },
  {
    id: 'wrap_satin_chrome_02',
    categoryId: 'wrap',
    name: 'Satin Chrome Silver',
    description: 'Mirror-like satin chrome for head-turning style.',
    imagePath: '/parts/wrap/wrap_satin_chrome_02.png',
    price: 3499,
  },
  {
    id: 'wrap_color_shift_03',
    categoryId: 'wrap',
    name: 'Color Shift Purple-Blue',
    description: 'Chameleon wrap that shifts colors in the light.',
    imagePath: '/parts/wrap/wrap_color_shift_03.png',
    price: 3999,
  },

  // ==========================================
  // ROOF STORAGE - 3 options
  // PNG location: /public/parts/roof/
  // ==========================================
  {
    id: 'roof_box_black_01',
    categoryId: 'roof',
    name: 'Matte Black Roof Box',
    description: 'Sleek roof box for extra storage.',
    imagePath: '/parts/roof/roof_box_black_01.png',
    price: 449,
  },
  {
    id: 'roof_rack_silver_02',
    categoryId: 'roof',
    name: 'Silver Roof Rack Rails',
    description: 'Low-profile roof rails for mounting gear.',
    imagePath: '/parts/roof/roof_rack_silver_02.png',
    price: 199,
  },
  {
    id: 'roof_basket_black_03',
    categoryId: 'roof',
    name: 'Black Roof Basket',
    description: 'Open basket for camping and outdoor trips.',
    imagePath: '/parts/roof/roof_basket_black_03.png',
    price: 279,
  },

  // ==========================================
  // BODY STYLE ACCENT - 3 options
  // PNG location: /public/parts/body/
  // ==========================================
  {
    id: 'body_frontlip_black_01',
    categoryId: 'body',
    name: 'Black Front Lip Spoiler',
    description: 'Low front lip to sharpen the front view.',
    imagePath: '/parts/body/body_frontlip_black_01.png',
    price: 189,
  },
  {
    id: 'body_sideskirt_color_02',
    categoryId: 'body',
    name: 'Color-Matched Side Skirts',
    description: 'Side skirts that extend the body line.',
    imagePath: '/parts/body/body_sideskirt_color_02.png',
    price: 249,
  },
  {
    id: 'body_spoiler_black_03',
    categoryId: 'body',
    name: 'Subtle Rear Roof Spoiler',
    description: 'Clean rear spoiler for a sportier silhouette.',
    imagePath: '/parts/body/body_spoiler_black_03.png',
    price: 179,
  },
];

// ============================================
// OVERLAY ANCHOR CONFIGURATION
// ============================================

/**
 * Anchor points for positioning part overlays on the car image
 * 
 * These define WHERE each category's PNG will be placed on the canvas.
 * Adjust these values to fine-tune positioning:
 * - x: 0 = left edge, 0.5 = center, 1 = right edge
 * - y: 0 = top edge, 0.5 = center, 1 = bottom edge
 * - scale: 1.0 = 100% of original PNG size
 * 
 * NOTE: These are starting points. You'll likely need to adjust
 * based on your specific PNG assets and car photo angles.
 */
export const OVERLAY_ANCHORS: Record<PartCategoryId, OverlayAnchor> = {
  wrap: { 
    x: 0.5,   // Center horizontally
    y: 0.5,   // Center (wrap covers whole car)
    scale: 1.0  // Full size reference
  },
  roof: { 
    x: 0.5,   // Center horizontally
    y: 0.15,  // Upper portion of image (roof area)
    scale: 0.4 
  },
  body: { 
    x: 0.5,   // Center horizontally
    y: 0.55,  // Middle-lower portion (body line area)
    scale: 0.5 
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all parts for a specific category
 */
export function getPartsByCategory(categoryId: PartCategoryId): PartOption[] {
  return PART_OPTIONS.filter(part => part.categoryId === categoryId);
}

/**
 * Get a specific part by ID
 */
export function getPartById(partId: string): PartOption | undefined {
  return PART_OPTIONS.find(part => part.id === partId);
}

/**
 * Get category metadata by ID
 */
export function getCategoryById(categoryId: PartCategoryId): PartCategory | undefined {
  return PART_CATEGORIES.find(cat => cat.id === categoryId);
}

/**
 * Get overlay anchor for a category
 */
export function getOverlayAnchor(categoryId: PartCategoryId): OverlayAnchor {
  return OVERLAY_ANCHORS[categoryId];
}

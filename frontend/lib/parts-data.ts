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
export type PartCategoryId = 'wheels' | 'roof' | 'body';

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
    id: 'wheels',
    label: 'Wheels & Rims',
    description: 'Change the design of your wheels.',
    icon: '🛞',
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
  // WHEELS - 3 options
  // PNG location: /public/parts/wheels/
  // ==========================================
  {
    id: 'wheel_sport_black_01',
    categoryId: 'wheels',
    name: 'Sport Black Alloy',
    description: 'Aggressive black multi-spoke sports wheel.',
    imagePath: '/parts/wheels/wheel_sport_black_01.png',
    price: 299,
  },
  {
    id: 'wheel_lux_silver_02',
    categoryId: 'wheels',
    name: 'Luxury Silver Multi-Spoke',
    description: 'Clean silver multi-spoke design for a premium look.',
    imagePath: '/parts/wheels/wheel_lux_silver_02.png',
    price: 349,
  },
  {
    id: 'wheel_offroad_bronze_03',
    categoryId: 'wheels',
    name: 'Off-Road Bronze Deep Dish',
    description: 'Chunky off-road wheel in bronze finish.',
    imagePath: '/parts/wheels/wheel_offroad_bronze_03.png',
    price: 399,
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
  wheels: { 
    x: 0.5,   // Center horizontally
    y: 0.75,  // Lower portion of image (where wheels typically are)
    scale: 0.3 
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


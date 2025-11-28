/**
 * CarFit Studio - Layered Composite Parts Data
 * 
 * This implements the "Paper Doll" pattern for product visualization.
 * Multiple transparent PNG layers are stacked to create unique combinations.
 * 
 * KEY CONCEPTS:
 * - Base Layer: Always visible (the car chassis)
 * - Exclusive Categories: Only ONE option can be selected (e.g., paint color)
 * - Additive Categories: MULTIPLE options can be selected (e.g., accessories)
 * - Z-Index: Controls layer stacking order (higher = on top)
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * Selection type determines UI behavior:
 * - 'exclusive': Radio button logic (select one, replaces previous)
 * - 'additive': Checkbox logic (select many, toggles on/off)
 */
export type SelectionType = 'exclusive' | 'additive';

/**
 * Category IDs for type safety
 */
export type PartCategoryId = 'wrap' | 'roof' | 'body';

/**
 * Part category with selection behavior
 */
export interface PartCategory {
  id: PartCategoryId;
  label: string;
  description: string;
  icon: string;
  type: SelectionType; // 'exclusive' or 'additive'
}

/**
 * Individual part option with layer information
 */
export interface PartOption {
  id: string;
  categoryId: PartCategoryId;
  name: string;
  description: string;
  price: number;
  imagePath: string;      // Thumbnail for selection UI
  layerImageUrl: string;  // Transparent PNG overlay for compositor
  zIndex: number;         // Stacking order (higher = on top)
}

// ============================================
// CONSTANTS - CATEGORIES
// ============================================

export const PART_CATEGORIES: PartCategory[] = [
  {
    id: 'wrap',
    label: 'Car Wraps',
    description: 'Transform your car with vinyl wraps. Select ONE color.',
    icon: '🎨',
    type: 'exclusive', // User picks ONE wrap color
  },
  {
    id: 'roof',
    label: 'Roof Storage',
    description: 'Choose ONE roof accessory for your vehicle.',
    icon: '📦',
    type: 'exclusive', // User picks ONE roof accessory
  },
  {
    id: 'body',
    label: 'Body Style Accent',
    description: 'Add body kit components. Combine multiple parts.',
    icon: '🏎️',
    type: 'additive', // User can pick MULTIPLE body parts
  },
];

// ============================================
// CONSTANTS - PART OPTIONS WITH LAYER DATA
// ============================================

/**
 * All available parts with layer information for the compositor.
 * 
 * Z-INDEX GUIDE:
 * - 10-19: Base modifications (wrap/paint)
 * - 20-29: Lower accessories (body kit)
 * - 30-39: Mid accessories (roof rails)
 * - 40-49: Upper accessories (roof box, basket)
 */
export const PART_OPTIONS: PartOption[] = [
  // ==========================================
  // CAR WRAPS - EXCLUSIVE (pick one)
  // Z-Index: 10 (base layer modification)
  // ==========================================
  {
    id: 'wrap_matte_black_01',
    categoryId: 'wrap',
    name: 'Matte Black Wrap',
    description: 'Sleek matte black finish for a stealthy look.',
    price: 2499,
    imagePath: '/parts/wrap/wrap_matte_black_01.png',
    layerImageUrl: '/layers/wrap/matte-black.png',
    zIndex: 10,
  },
  {
    id: 'wrap_satin_chrome_02',
    categoryId: 'wrap',
    name: 'Satin Chrome Silver',
    description: 'Mirror-like satin chrome for head-turning style.',
    price: 3499,
    imagePath: '/parts/wrap/wrap_satin_chrome_02.png',
    layerImageUrl: '/layers/wrap/satin-chrome.png',
    zIndex: 10,
  },
  {
    id: 'wrap_color_shift_03',
    categoryId: 'wrap',
    name: 'Color Shift Purple-Blue',
    description: 'Chameleon wrap that shifts colors in the light.',
    price: 3999,
    imagePath: '/parts/wrap/wrap_color_shift_03.png',
    layerImageUrl: '/layers/wrap/color-shift.png',
    zIndex: 10,
  },

  // ==========================================
  // ROOF STORAGE - EXCLUSIVE (pick one)
  // Z-Index: 30-45 (stacked on top)
  // ==========================================
  {
    id: 'roof_rack_silver_02',
    categoryId: 'roof',
    name: 'Silver Roof Rack Rails',
    description: 'Low-profile roof rails for mounting gear.',
    price: 199,
    imagePath: '/parts/roof/roof_rack_silver_02.png',
    layerImageUrl: '/layers/roof/rack-rails.png',
    zIndex: 30, // Base for roof accessories
  },
  {
    id: 'roof_box_black_01',
    categoryId: 'roof',
    name: 'Matte Black Roof Box',
    description: 'Sleek roof box for extra storage.',
    price: 449,
    imagePath: '/parts/roof/roof_box_black_01.png',
    layerImageUrl: '/layers/roof/box-black.png',
    zIndex: 40, // On top of rails
  },
  {
    id: 'roof_basket_black_03',
    categoryId: 'roof',
    name: 'Black Roof Basket',
    description: 'Open basket for camping and outdoor trips.',
    price: 279,
    imagePath: '/parts/roof/roof_basket_black_03.png',
    layerImageUrl: '/layers/roof/basket-black.png',
    zIndex: 45, // Alternative to box
  },

  // ==========================================
  // BODY STYLE ACCENT - ADDITIVE (pick many)
  // Z-Index: 20-25 (lower body parts)
  // ==========================================
  {
    id: 'body_frontlip_black_01',
    categoryId: 'body',
    name: 'Black Front Lip Spoiler',
    description: 'Low front lip to sharpen the front view.',
    price: 189,
    imagePath: '/parts/body/body_frontlip_black_01.png',
    layerImageUrl: '/layers/body/frontlip-black.png',
    zIndex: 20,
  },
  {
    id: 'body_sideskirt_color_02',
    categoryId: 'body',
    name: 'Color-Matched Side Skirts',
    description: 'Side skirts that extend the body line.',
    price: 249,
    imagePath: '/parts/body/body_sideskirt_color_02.png',
    layerImageUrl: '/layers/body/sideskirt.png',
    zIndex: 21,
  },
  {
    id: 'body_spoiler_black_03',
    categoryId: 'body',
    name: 'Subtle Rear Roof Spoiler',
    description: 'Clean rear spoiler for a sportier silhouette.',
    price: 179,
    imagePath: '/parts/body/body_spoiler_black_03.png',
    layerImageUrl: '/layers/body/spoiler-black.png',
    zIndex: 25,
  },
];

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
 * Check if a category uses exclusive selection
 */
export function isExclusiveCategory(categoryId: PartCategoryId): boolean {
  const category = getCategoryById(categoryId);
  return category?.type === 'exclusive';
}

/**
 * Get all selected parts sorted by z-index for rendering
 */
export function getLayersSortedByZIndex(selectedIds: string[]): PartOption[] {
  return selectedIds
    .map(id => getPartById(id))
    .filter((part): part is PartOption => part !== undefined)
    .sort((a, b) => a.zIndex - b.zIndex);
}

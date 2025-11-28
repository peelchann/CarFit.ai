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
  /** AI prompt description - used by Gemini to understand what to apply */
  aiPrompt: string;
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
    description: 'Transform your car with vinyl wraps. Select ONE design.',
    icon: '🎨',
    type: 'exclusive', // User picks ONE wrap design
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
    label: 'Body Accents',
    description: 'Add body kit components. Combine multiple parts.',
    icon: '🏎️',
    type: 'additive', // User can pick MULTIPLE body parts
  },
];

// ============================================
// CONSTANTS - PART OPTIONS WITH AI PROMPTS
// ============================================

/**
 * All available parts with detailed AI prompt descriptions.
 * 
 * The 'aiPrompt' field is used by Gemini to understand exactly what
 * modification to apply to the user's car photo.
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
    name: 'Dune Graphics',
    description: 'Matte black with bold desert-tan geometric side graphics.',
    aiPrompt: 'wrapped in matte black with bold desert-tan geometric side graphics and typography',
    price: 2499,
    imagePath: '/parts/wrap/wrap_matte_black_01.png',
    layerImageUrl: '/layers/wrap/matte-black.png',
    zIndex: 10,
  },
  {
    id: 'wrap_satin_chrome_02',
    categoryId: 'wrap',
    name: 'Graffiti Art',
    description: 'Vibrant urban graffiti design with cyan and magenta splashes.',
    aiPrompt: 'wrapped in a vibrant urban graffiti design with cyan and magenta splashes and street-art graphics',
    price: 3499,
    imagePath: '/parts/wrap/wrap_satin_chrome_02.png',
    layerImageUrl: '/layers/wrap/satin-chrome.png',
    zIndex: 10,
  },
  {
    id: 'wrap_color_shift_03',
    categoryId: 'wrap',
    name: 'Urban Camo',
    description: 'Geometric urban camouflage in shades of grey and gunmetal.',
    aiPrompt: 'wrapped in a geometric urban camouflage pattern in varying shades of matte grey, gunmetal, and black',
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
    name: 'Aero Cargo Box',
    description: 'Sleek, aerodynamic silver hard-shell roof cargo box.',
    aiPrompt: 'fitted with a sleek, aerodynamic silver hard-shell roof cargo box mounted on the roof',
    price: 449,
    imagePath: '/parts/roof/roof_rack_silver_02.png',
    layerImageUrl: '/layers/roof/rack-rails.png',
    zIndex: 40,
  },
  {
    id: 'roof_box_black_01',
    categoryId: 'roof',
    name: 'Rooftop Tent',
    description: 'Folded black soft-shell rooftop tent for camping.',
    aiPrompt: 'carrying a folded black soft-shell rooftop tent mounted on a roof rack',
    price: 899,
    imagePath: '/parts/roof/roof_box_black_01.png',
    layerImageUrl: '/layers/roof/box-black.png',
    zIndex: 45,
  },
  {
    id: 'roof_basket_black_03',
    categoryId: 'roof',
    name: 'Off-Road Basket',
    description: 'Rugged matte black tubular steel roof basket with wind fairing.',
    aiPrompt: 'equipped with a rugged matte black tubular steel roof basket with a wind fairing',
    price: 349,
    imagePath: '/parts/roof/roof_basket_black_03.png',
    layerImageUrl: '/layers/roof/basket-black.png',
    zIndex: 42,
  },

  // ==========================================
  // BODY ACCENTS - ADDITIVE (pick many)
  // Z-Index: 20-25 (lower body parts)
  // ==========================================
  {
    id: 'body_frontlip_black_01',
    categoryId: 'body',
    name: 'Rear Wing',
    description: 'Sporty gloss black rear roof wing spoiler.',
    aiPrompt: 'sporting a gloss black rear roof wing spoiler mounted on the back of the roof',
    price: 289,
    imagePath: '/parts/body/body_frontlip_black_01.png',
    layerImageUrl: '/layers/body/frontlip-black.png',
    zIndex: 25,
  },
  {
    id: 'body_sideskirt_color_02',
    categoryId: 'body',
    name: 'Carbon Splitter',
    description: 'Glossy carbon fiber front bumper splitter lip.',
    aiPrompt: 'modified with a glossy carbon fiber front bumper splitter lip',
    price: 349,
    imagePath: '/parts/body/body_sideskirt_color_02.png',
    layerImageUrl: '/layers/body/sideskirt.png',
    zIndex: 20,
  },
  {
    id: 'body_spoiler_black_03',
    categoryId: 'body',
    name: 'Side Steps',
    description: 'Silver diamond-plate metal side running boards.',
    aiPrompt: 'fitted with silver diamond-plate metal side step running boards',
    price: 399,
    imagePath: '/parts/body/body_spoiler_black_03.png',
    layerImageUrl: '/layers/body/spoiler-black.png',
    zIndex: 21,
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

/**
 * Build AI prompt description from selected parts
 */
export function buildAiPromptFromParts(parts: PartOption[]): string {
  if (parts.length === 0) return '';
  
  const descriptions = parts.map(p => p.aiPrompt);
  
  if (descriptions.length === 1) {
    return descriptions[0];
  }
  
  // Join multiple parts with proper grammar
  const last = descriptions.pop();
  return descriptions.join(', ') + ', and ' + last;
}

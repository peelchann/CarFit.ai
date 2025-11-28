/**
 * CarFit Studio - Configurator State Management (Zustand)
 * 
 * Handles the layered composite selection logic:
 * - Exclusive categories: Only one selection allowed (replaces previous)
 * - Additive categories: Multiple selections allowed (toggles on/off)
 * 
 * Also manages:
 * - User's uploaded car image
 * - AI generation state
 * - Result image
 */

import { create } from 'zustand';
import { 
  PartCategoryId, 
  PartOption, 
  getPartById,
  getLayersSortedByZIndex 
} from './parts-data';

// ============================================
// TYPES
// ============================================

interface ConfiguratorState {
  // Selection state
  // For exclusive categories: stores single ID or null
  // For additive categories: stores array of IDs
  selections: {
    wrap: string | null;      // Exclusive: one wrap color
    roof: string | null;      // Exclusive: one roof accessory
    body: string[];           // Additive: multiple body parts
  };
  
  // Image state
  carImage: File | null;
  carImageUrl: string | null;
  resultImage: string | null;
  
  // Generation state
  isGenerating: boolean;
  aiMessage: string | null;
  
  // Actions
  selectPart: (categoryId: PartCategoryId, partId: string) => void;
  deselectPart: (categoryId: PartCategoryId, partId: string) => void;
  clearCategory: (categoryId: PartCategoryId) => void;
  setCarImage: (file: File | null) => void;
  setResultImage: (url: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setAiMessage: (message: string | null) => void;
  clearAll: () => void;
  
  // Computed getters
  getSelectedParts: () => PartOption[];
  getSelectedLayers: () => PartOption[];
  getTotalPrice: () => number;
  getSelectionCount: () => number;
  isPartSelected: (partId: string) => boolean;
}

// ============================================
// INITIAL STATE
// ============================================

const initialSelections = {
  wrap: null,
  roof: null,
  body: [],
};

// ============================================
// STORE
// ============================================

export const useConfiguratorStore = create<ConfiguratorState>((set, get) => ({
  // Initial state
  selections: { ...initialSelections },
  carImage: null,
  carImageUrl: null,
  resultImage: null,
  isGenerating: false,
  aiMessage: null,

  // ==========================================
  // SELECTION ACTIONS
  // ==========================================

  /**
   * Select a part - handles both exclusive and additive logic
   */
  selectPart: (categoryId: PartCategoryId, partId: string) => {
    set((state) => {
      // Handle exclusive categories (wrap, roof)
      if (categoryId === 'wrap') {
        return {
          selections: {
            ...state.selections,
            wrap: state.selections.wrap === partId ? null : partId,
          },
          resultImage: null,
          aiMessage: null,
        };
      }
      
      if (categoryId === 'roof') {
        return {
          selections: {
            ...state.selections,
            roof: state.selections.roof === partId ? null : partId,
          },
          resultImage: null,
          aiMessage: null,
        };
      }
      
      // Handle additive category (body)
      const currentArray = state.selections.body;
      const newArray = currentArray.includes(partId)
        ? currentArray.filter(id => id !== partId)
        : [...currentArray, partId];
      
      return {
        selections: {
          ...state.selections,
          body: newArray,
        },
        resultImage: null,
        aiMessage: null,
      };
    });
  },

  /**
   * Deselect a specific part
   */
  deselectPart: (categoryId: PartCategoryId, partId: string) => {
    set((state) => {
      // Handle exclusive categories (wrap, roof)
      if (categoryId === 'wrap') {
        return {
          selections: {
            ...state.selections,
            wrap: state.selections.wrap === partId ? null : state.selections.wrap,
          },
        };
      }
      
      if (categoryId === 'roof') {
        return {
          selections: {
            ...state.selections,
            roof: state.selections.roof === partId ? null : state.selections.roof,
          },
        };
      }
      
      // Handle additive category (body)
      return {
        selections: {
          ...state.selections,
          body: state.selections.body.filter(id => id !== partId),
        },
      };
    });
  },

  /**
   * Clear all selections in a category
   */
  clearCategory: (categoryId: PartCategoryId) => {
    set((state) => {
      // Handle exclusive categories (wrap, roof)
      if (categoryId === 'wrap') {
        return {
          selections: {
            ...state.selections,
            wrap: null,
          },
        };
      }
      
      if (categoryId === 'roof') {
        return {
          selections: {
            ...state.selections,
            roof: null,
          },
        };
      }
      
      // Handle additive category (body)
      return {
        selections: {
          ...state.selections,
          body: [],
        },
      };
    });
  },

  // ==========================================
  // IMAGE ACTIONS
  // ==========================================

  setCarImage: (file: File | null) => {
    // Revoke previous URL if exists
    const prevUrl = get().carImageUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    
    set({
      carImage: file,
      carImageUrl: file ? URL.createObjectURL(file) : null,
      resultImage: null,
      aiMessage: null,
    });
  },

  setResultImage: (url: string | null) => {
    set({ resultImage: url });
  },

  setIsGenerating: (generating: boolean) => {
    set({ isGenerating: generating });
  },

  setAiMessage: (message: string | null) => {
    set({ aiMessage: message });
  },

  /**
   * Reset everything to initial state
   */
  clearAll: () => {
    const prevUrl = get().carImageUrl;
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    
    set({
      selections: { ...initialSelections },
      carImage: null,
      carImageUrl: null,
      resultImage: null,
      isGenerating: false,
      aiMessage: null,
    });
  },

  // ==========================================
  // COMPUTED GETTERS
  // ==========================================

  /**
   * Get all currently selected parts as PartOption objects
   */
  getSelectedParts: () => {
    const { selections } = get();
    const selectedIds: string[] = [];
    
    // Collect all selected IDs
    if (selections.wrap) {
      selectedIds.push(selections.wrap);
    }
    if (selections.roof) {
      selectedIds.push(selections.roof);
    }
    selectedIds.push(...selections.body);
    
    // Convert to PartOption objects
    return selectedIds
      .map(id => getPartById(id))
      .filter((part): part is PartOption => part !== undefined);
  },

  /**
   * Get selected parts sorted by z-index for layer rendering
   */
  getSelectedLayers: () => {
    const { selections } = get();
    const selectedIds: string[] = [];
    
    if (selections.wrap) {
      selectedIds.push(selections.wrap);
    }
    if (selections.roof) {
      selectedIds.push(selections.roof);
    }
    selectedIds.push(...selections.body);
    
    return getLayersSortedByZIndex(selectedIds);
  },

  /**
   * Calculate total price of all selected parts
   */
  getTotalPrice: () => {
    const parts = get().getSelectedParts();
    return parts.reduce((sum, part) => sum + part.price, 0);
  },

  /**
   * Get count of selected items
   */
  getSelectionCount: () => {
    const { selections } = get();
    let count = 0;
    
    if (selections.wrap) count++;
    if (selections.roof) count++;
    count += selections.body.length;
    
    return count;
  },

  /**
   * Check if a specific part is selected
   */
  isPartSelected: (partId: string) => {
    const { selections } = get();
    
    // Check exclusive categories
    if (selections.wrap === partId) return true;
    if (selections.roof === partId) return true;
    
    // Check additive category
    if (selections.body.includes(partId)) return true;
    
    return false;
  },
}));

// ============================================
// SELECTOR HOOKS (for optimized re-renders)
// ============================================

export const useCarImage = () => useConfiguratorStore(state => state.carImage);
export const useCarImageUrl = () => useConfiguratorStore(state => state.carImageUrl);
export const useResultImage = () => useConfiguratorStore(state => state.resultImage);
export const useIsGenerating = () => useConfiguratorStore(state => state.isGenerating);
export const useAiMessage = () => useConfiguratorStore(state => state.aiMessage);
export const useSelections = () => useConfiguratorStore(state => state.selections);
export const useTotalPrice = () => useConfiguratorStore(state => state.getTotalPrice());
export const useSelectionCount = () => useConfiguratorStore(state => state.getSelectionCount());


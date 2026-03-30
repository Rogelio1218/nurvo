import { create } from 'zustand';
import { PriceResult, PharmacyResult } from '../lib/pharmacy';

type SortMode = 'price' | 'distance' | 'best';

interface PharmacyStore {
  // Search state
  searchQuery: string;
  searchGeneric: string | undefined;
  results: PriceResult[];
  nearbyPharmacies: PharmacyResult[];
  loading: boolean;
  error: string | null;
  sortMode: SortMode;

  // Actions
  setSearchQuery: (query: string, generic?: string) => void;
  setResults: (results: PriceResult[]) => void;
  setNearbyPharmacies: (pharmacies: PharmacyResult[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSortMode: (mode: SortMode) => void;
  clearSearch: () => void;
  getSortedResults: () => PriceResult[];
}

export const usePharmacyStore = create<PharmacyStore>((set, get) => ({
  searchQuery: '',
  searchGeneric: undefined,
  results: [],
  nearbyPharmacies: [],
  loading: false,
  error: null,
  sortMode: 'best',

  setSearchQuery: (query, generic) =>
    set({ searchQuery: query, searchGeneric: generic }),
  setResults: (results) => set({ results, error: null }),
  setNearbyPharmacies: (pharmacies) => set({ nearbyPharmacies: pharmacies }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),
  setSortMode: (sortMode) => set({ sortMode }),
  clearSearch: () =>
    set({
      searchQuery: '',
      searchGeneric: undefined,
      results: [],
      error: null,
    }),

  getSortedResults: () => {
    const { results, sortMode } = get();
    const sorted = [...results];
    switch (sortMode) {
      case 'price':
        return sorted.sort((a, b) => a.price - b.price);
      case 'distance':
        return sorted.sort((a, b) => a.distanceMiles - b.distanceMiles);
      case 'best':
      default:
        // Weighted score: prioritize in-stock, then balance price + distance
        return sorted.sort((a, b) => {
          if (a.inStock !== b.inStock) return a.inStock ? -1 : 1;
          const scoreA = a.price * 0.6 + a.distanceMiles * 8;
          const scoreB = b.price * 0.6 + b.distanceMiles * 8;
          return scoreA - scoreB;
        });
    }
  },
}));

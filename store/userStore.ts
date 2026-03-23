import { create } from 'zustand';

interface UserStore {
  userId: string | null;
  activeProfileId: string | null;
  activeProfileName: string;
  subscriptionTier: 'free' | 'premium' | 'family';
  trialActive: boolean;
  setUser: (userId: string) => void;
  setActiveProfile: (profileId: string, name: string) => void;
  setSubscription: (tier: 'free' | 'premium' | 'family') => void;
  setTrialActive: (active: boolean) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  userId: null,
  activeProfileId: null,
  activeProfileName: '',
  subscriptionTier: 'free',
  trialActive: false,
  setUser: (userId) => set({ userId }),
  setActiveProfile: (profileId, name) =>
    set({ activeProfileId: profileId, activeProfileName: name }),
  setSubscription: (tier) => set({ subscriptionTier: tier }),
  setTrialActive: (active) => set({ trialActive: active }),
  clearUser: () =>
    set({
      userId: null,
      activeProfileId: null,
      activeProfileName: '',
      subscriptionTier: 'free',
      trialActive: false,
    }),
}));

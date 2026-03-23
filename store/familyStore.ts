import { create } from 'zustand';

export interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship?: string;
  ui_mode: string;
  avatar_url?: string;
  date_of_birth?: string;
  is_primary: boolean;
  created_at?: string;
  medicationCount?: number;
}

interface FamilyStore {
  members: FamilyMember[];
  setMembers: (members: FamilyMember[]) => void;
  addMember: (member: FamilyMember) => void;
  updateMember: (id: string, updates: Partial<FamilyMember>) => void;
  deleteMember: (id: string) => void;
}

export const useFamilyStore = create<FamilyStore>((set) => ({
  members: [],
  setMembers: (members) => set({ members }),
  addMember: (member) =>
    set((state) => ({ members: [...state.members, member] })),
  updateMember: (id, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  deleteMember: (id) =>
    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
    })),
}));

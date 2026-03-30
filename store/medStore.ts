import { create } from 'zustand';

export interface Medication {
  id: string;
  profile_id: string;
  name: string;
  generic_name?: string;
  dose_strength?: string;
  dose_unit?: string;
  form?: string;
  what_for?: string;
  prescriber?: string;
  pharmacy_name?: string;
  pharmacy_phone?: string;
  supply_count?: number;
  supply_last_updated?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  pill_color?: string;
  pill_shape?: string;
  pill_imprint?: string;
  is_critical: boolean;
  notes?: string;
  created_at?: string;
  medication_schedules?: Schedule[];
}

export interface Schedule {
  id: string;
  medication_id: string;
  frequency: string;
  times_of_day: string[];
  days_of_week: number[];
  interval_hours?: number;
  as_needed: boolean;
}

export interface DoseLog {
  id: string;
  medication_id: string;
  profile_id: string;
  scheduled_time: string;
  confirmed_time?: string;
  status: 'taken' | 'skipped' | 'missed' | 'pending';
  notes?: string;
  medications?: {
    name: string;
    dose_strength?: string;
    dose_unit?: string;
    form?: string;
    is_critical: boolean;
  };
}

interface MedStore {
  medications: Medication[];
  todaysDoses: DoseLog[];
  loadingMeds: boolean;
  setMedications: (meds: Medication[]) => void;
  addMedication: (med: Medication) => void;
  updateMedication: (id: string, updates: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  setTodaysDoses: (doses: DoseLog[]) => void;
  updateDoseStatus: (doseId: string, status: DoseLog['status']) => void;
  decrementSupply: (medicationId: string) => void;
  setLoadingMeds: (loading: boolean) => void;
}

export const useMedStore = create<MedStore>((set) => ({
  medications: [],
  todaysDoses: [],
  loadingMeds: false,
  setMedications: (medications) => set({ medications }),
  addMedication: (med) =>
    set((state) => ({ medications: [med, ...state.medications] })),
  updateMedication: (id, updates) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  deleteMedication: (id) =>
    set((state) => ({
      medications: state.medications.filter((m) => m.id !== id),
    })),
  setTodaysDoses: (todaysDoses) => set({ todaysDoses }),
  updateDoseStatus: (doseId, status) =>
    set((state) => ({
      todaysDoses: state.todaysDoses.map((d) =>
        d.id === doseId ? { ...d, status } : d
      ),
    })),
  decrementSupply: (medicationId) =>
    set((state) => ({
      medications: state.medications.map((m) =>
        m.id === medicationId && m.supply_count !== undefined && m.supply_count !== null
          ? { ...m, supply_count: Math.max(m.supply_count - 1, 0) }
          : m
      ),
    })),
  setLoadingMeds: (loadingMeds) => set({ loadingMeds }),
}));

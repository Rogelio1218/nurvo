import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInContext: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          created_at: string;
          trial_start: string | null;
          subscription_tier: string;
          subscription_status: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          relationship: string | null;
          ui_mode: string;
          avatar_url: string | null;
          date_of_birth: string | null;
          is_primary: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      medications: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          generic_name: string | null;
          dose_strength: string | null;
          dose_unit: string | null;
          form: string | null;
          what_for: string | null;
          prescriber: string | null;
          pharmacy_name: string | null;
          pharmacy_phone: string | null;
          supply_count: number | null;
          supply_last_updated: string | null;
          start_date: string | null;
          end_date: string | null;
          status: string;
          pill_color: string | null;
          pill_shape: string | null;
          pill_imprint: string | null;
          is_critical: boolean;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['medications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['medications']['Insert']>;
      };
    };
  };
};

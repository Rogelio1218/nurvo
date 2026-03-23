import { supabase } from './supabase';

// ─── Users ───────────────────────────────────────────────────────────────────

export async function createUser(userId: string, email: string, name: string) {
  const { data, error } = await supabase.from('users').upsert({
    id: userId,
    email,
    name,
    trial_start: new Date().toISOString(),
    subscription_tier: 'free',
    subscription_status: 'active',
  });
  if (error) throw error;
  return data;
}

export async function getUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

// ─── Profiles ─────────────────────────────────────────────────────────────────

export async function createProfile(
  userId: string,
  name: string,
  relationship?: string,
  isPrimary = false
) {
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      user_id: userId,
      name,
      relationship: relationship ?? null,
      is_primary: isPrimary,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getProfiles(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .order('is_primary', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateProfile(profileId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProfile(profileId: string) {
  const { error } = await supabase.from('profiles').delete().eq('id', profileId);
  if (error) throw error;
}

// ─── Medications ──────────────────────────────────────────────────────────────

export async function getMedications(profileId: string) {
  const { data, error } = await supabase
    .from('medications')
    .select('*, medication_schedules(*)')
    .eq('profile_id', profileId)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createMedication(medication: Record<string, any>) {
  const { data, error } = await supabase
    .from('medications')
    .insert(medication)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMedication(id: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('medications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedication(id: string) {
  const { error } = await supabase
    .from('medications')
    .update({ status: 'discontinued' })
    .eq('id', id);
  if (error) throw error;
}

export async function createSchedule(schedule: Record<string, any>) {
  const { data, error } = await supabase
    .from('medication_schedules')
    .insert(schedule)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Dose Logs ────────────────────────────────────────────────────────────────

export async function getTodaysDoses(profileId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await supabase
    .from('dose_logs')
    .select('*, medications(name, dose_strength, dose_unit, form, is_critical)')
    .eq('profile_id', profileId)
    .gte('scheduled_time', today.toISOString())
    .lt('scheduled_time', tomorrow.toISOString())
    .order('scheduled_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function logDose(
  medicationId: string,
  profileId: string,
  scheduledTime: string,
  status: 'taken' | 'skipped' | 'missed'
) {
  const { data, error } = await supabase
    .from('dose_logs')
    .insert({
      medication_id: medicationId,
      profile_id: profileId,
      scheduled_time: scheduledTime,
      confirmed_time: status === 'taken' ? new Date().toISOString() : null,
      status,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Streaks ──────────────────────────────────────────────────────────────────

export async function getStreak(profileId: string) {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('profile_id', profileId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertStreak(profileId: string, updates: Record<string, any>) {
  const { data, error } = await supabase
    .from('streaks')
    .upsert({ profile_id: profileId, ...updates })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Drug Interactions ────────────────────────────────────────────────────────

export async function saveInteraction(interaction: Record<string, any>) {
  const { data, error } = await supabase
    .from('medication_interactions')
    .insert(interaction)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getInteractions(profileId: string) {
  const { data, error } = await supabase
    .from('medication_interactions')
    .select('*')
    .eq('profile_id', profileId);
  if (error) throw error;
  return data ?? [];
}

// ─── Clarity ──────────────────────────────────────────────────────────────────

export async function createConversation(profileId: string) {
  const { data, error } = await supabase
    .from('clarity_conversations')
    .insert({ profile_id: profileId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getConversations(profileId: string) {
  const { data, error } = await supabase
    .from('clarity_conversations')
    .select('*, clarity_messages(*)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const { data, error } = await supabase
    .from('clarity_messages')
    .insert({ conversation_id: conversationId, role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDailyUsage(profileId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('clarity_daily_usage')
    .select('*')
    .eq('profile_id', profileId)
    .eq('date', today)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function incrementDailyUsage(profileId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase.rpc('increment_clarity_usage', {
    p_profile_id: profileId,
    p_date: today,
  });
  if (error) {
    // Fallback: upsert manually
    await supabase.from('clarity_daily_usage').upsert(
      { profile_id: profileId, date: today, question_count: 1 },
      { onConflict: 'profile_id,date' }
    );
  }
}

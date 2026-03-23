import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { searchMedications, MedSuggestion } from '../../lib/autocomplete';
import { checkInteractions } from '../../lib/interactions';
import { useUserStore } from '../../store/userStore';
import { useMedStore } from '../../store/medStore';
import { createMedication, createSchedule } from '../../lib/api';
import DrugInteractionAlert from '../../components/DrugInteractionAlert';

const FREQUENCIES = ['Daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'];
const TIMES = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
const FORMS = ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Patch', 'Inhaler', 'Drops', 'Supplement', 'Other'];

export default function AddMedScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    scannedName?: string;
    scannedGeneric?: string;
    scannedStrength?: string;
  }>();

  const { activeProfileId } = useUserStore();
  const { medications, addMedication } = useMedStore();

  const [name, setName] = useState(params.scannedName ?? '');
  const [genericName, setGenericName] = useState(params.scannedGeneric ?? '');
  const [doseStrength, setDoseStrength] = useState(params.scannedStrength ?? '');
  const [doseUnit, setDoseUnit] = useState('mg');
  const [form, setForm] = useState('Tablet');
  const [whatFor, setWhatFor] = useState('');
  const [prescriber, setPrescriber] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [supplyCount, setSupplyCount] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [notes, setNotes] = useState('');

  // Schedule
  const [frequency, setFrequency] = useState('Daily');
  const [selectedTimes, setSelectedTimes] = useState(['08:00']);
  const [asNeeded, setAsNeeded] = useState(false);

  // Autocomplete
  const [suggestions, setSuggestions] = useState<MedSuggestion[]>([]);
  const [searching, setSearching] = useState(false);

  // Interactions
  const [interactions, setInteractions] = useState<any[]>([]);
  const [showInteractions, setShowInteractions] = useState(false);

  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1=basic, 2=schedule, 3=details

  useEffect(() => {
    if (params.scannedName) {
      setName(params.scannedName);
    }
  }, [params.scannedName]);

  const handleNameChange = async (text: string) => {
    setName(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchMedications(text);
      setSuggestions(results);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSuggestion = async (item: MedSuggestion) => {
    setName(item.name);
    if (item.genericName) setGenericName(item.genericName);
    if (item.strength) setDoseStrength(item.strength);
    setSuggestions([]);

    if (Platform.OS !== 'web') await Haptics.selectionAsync();

    // Check interactions
    const existingMeds = medications.map((m) => ({
      name: m.name,
      id: m.id,
    }));
    if (existingMeds.length > 0) {
      const found = await checkInteractions(item.name, existingMeds);
      if (found.length > 0) {
        setInteractions(found);
        setShowInteractions(true);
      }
    }
  };

  const toggleTime = (time: string) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setSelectedTimes((prev) =>
      prev.includes(time)
        ? prev.filter((t) => t !== time)
        : [...prev, time].sort()
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter the medication name.');
      return;
    }
    if (!activeProfileId) return;
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setSaving(true);
    try {
      const med = await createMedication({
        profile_id: activeProfileId,
        name: name.trim(),
        generic_name: genericName || null,
        dose_strength: doseStrength || null,
        dose_unit: doseUnit || null,
        form: form.toLowerCase(),
        what_for: whatFor || null,
        prescriber: prescriber || null,
        pharmacy_name: pharmacyName || null,
        supply_count: supplyCount ? parseInt(supplyCount) : null,
        status: 'active',
        is_critical: isCritical,
        notes: notes || null,
      });

      if (!asNeeded && selectedTimes.length > 0) {
        await createSchedule({
          medication_id: med.id,
          frequency: frequency.toLowerCase().replace(' ', '_'),
          times_of_day: selectedTimes,
          days_of_week: [0, 1, 2, 3, 4, 5, 6],
          as_needed: false,
        });
      } else if (asNeeded) {
        await createSchedule({
          medication_id: med.id,
          frequency: 'as_needed',
          times_of_day: [],
          days_of_week: [],
          as_needed: true,
        });
      }

      addMedication(med);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save medication.');
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      {/* Medication name */}
      <View style={styles.field}>
        <Text style={styles.label}>Medication name *</Text>
        <View style={styles.searchWrapper}>
          <Feather name="search" size={16} color={theme.colors.textTertiary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="e.g. Lisinopril, Vitamin D"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={handleNameChange}
            autoCapitalize="words"
          />
          {searching && <ActivityIndicator size="small" color={theme.colors.primary} />}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  {item.genericName && (
                    <Text style={styles.suggestionGeneric}>{item.genericName}</Text>
                  )}
                </View>
                <View style={[styles.sourcePill, item.source === 'supplement' && styles.sourcePillSupp]}>
                  <Text style={styles.sourcePillText}>
                    {item.source === 'fda' ? 'FDA' : 'Supplement'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {showInteractions && (
        <DrugInteractionAlert
          interactions={interactions}
          onDismiss={() => setShowInteractions(false)}
        />
      )}

      {/* Dose */}
      <View style={styles.row}>
        <View style={[styles.field, { flex: 2 }]}>
          <Text style={styles.label}>Dose strength</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="e.g. 10"
            placeholderTextColor={theme.colors.textTertiary}
            value={doseStrength}
            onChangeText={setDoseStrength}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={styles.label}>Unit</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="mg"
            placeholderTextColor={theme.colors.textTertiary}
            value={doseUnit}
            onChangeText={setDoseUnit}
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Form */}
      <View style={styles.field}>
        <Text style={styles.label}>Form</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {FORMS.map((f) => (
              <TouchableOpacity
                key={f}
                style={[styles.chip, form === f && styles.chipActive]}
                onPress={() => { setForm(f); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.chipText, form === f && styles.chipTextActive]}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* What for */}
      <View style={styles.field}>
        <Text style={styles.label}>What it's for</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="e.g. Blood pressure, anxiety"
          placeholderTextColor={theme.colors.textTertiary}
          value={whatFor}
          onChangeText={setWhatFor}
          autoCapitalize="sentences"
        />
      </View>

      {/* Critical toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Feather name="alert-circle" size={18} color={theme.colors.danger} />
          <View>
            <Text style={styles.toggleLabel}>Mark as critical</Text>
            <Text style={styles.toggleHint}>Critical meds appear at the top of your list</Text>
          </View>
        </View>
        <Switch
          value={isCritical}
          onValueChange={setIsCritical}
          trackColor={{ false: theme.colors.border, true: theme.colors.danger }}
          thumbColor={theme.colors.surface}
        />
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      {/* As needed toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Feather name="clock" size={18} color={theme.colors.primary} />
          <View>
            <Text style={styles.toggleLabel}>Take as needed</Text>
            <Text style={styles.toggleHint}>No fixed schedule — take when required</Text>
          </View>
        </View>
        <Switch
          value={asNeeded}
          onValueChange={setAsNeeded}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={theme.colors.surface}
        />
      </View>

      {!asNeeded && (
        <>
          {/* Frequency */}
          <View style={styles.field}>
            <Text style={styles.label}>Frequency</Text>
            <View style={styles.chipRow}>
              {FREQUENCIES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[styles.chip, frequency === f && styles.chipActive]}
                  onPress={() => { setFrequency(f); Haptics.selectionAsync(); }}
                >
                  <Text style={[styles.chipText, frequency === f && styles.chipTextActive]}>
                    {f}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Times */}
          <View style={styles.field}>
            <Text style={styles.label}>Reminder times</Text>
            <View style={styles.timeGrid}>
              {TIMES.map((time) => {
                const isSelected = selectedTimes.includes(time);
                const [h, m] = time.split(':').map(Number);
                const label = new Date(0, 0, 0, h, m).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                });
                return (
                  <TouchableOpacity
                    key={time}
                    style={[styles.timeChip, isSelected && styles.timeChipActive]}
                    onPress={() => toggleTime(time)}
                  >
                    <Text style={[styles.timeChipText, isSelected && styles.timeChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.field}>
        <Text style={styles.label}>Prescriber</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="e.g. Dr. Smith"
          placeholderTextColor={theme.colors.textTertiary}
          value={prescriber}
          onChangeText={setPrescriber}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Pharmacy name</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="e.g. CVS Pharmacy"
          placeholderTextColor={theme.colors.textTertiary}
          value={pharmacyName}
          onChangeText={setPharmacyName}
          autoCapitalize="words"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Pills / supply remaining</Text>
        <TextInput
          style={styles.inputBox}
          placeholder="e.g. 30"
          placeholderTextColor={theme.colors.textTertiary}
          value={supplyCount}
          onChangeText={setSupplyCount}
          keyboardType="number-pad"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={[styles.inputBox, styles.textArea]}
          placeholder="Additional notes..."
          placeholderTextColor={theme.colors.textTertiary}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          autoCapitalize="sentences"
        />
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add medication</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Step indicators */}
      <View style={styles.steps}>
        {[1, 2, 3].map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.stepItem}
            onPress={() => setStep(s)}
          >
            <View style={[styles.stepDot, step === s && styles.stepDotActive, step > s && styles.stepDotDone]}>
              {step > s ? (
                <Feather name="check" size={12} color={theme.colors.surface} />
              ) : (
                <Text style={[styles.stepNum, (step === s || step > s) && styles.stepNumActive]}>
                  {s}
                </Text>
              )}
            </View>
            <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>
              {s === 1 ? 'Basics' : s === 2 ? 'Schedule' : 'Details'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.footerRow}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.prevButton}
              onPress={() => setStep(step - 1)}
            >
              <Text style={styles.prevButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 ? (
            <TouchableOpacity
              style={[styles.nextButton, !name.trim() && step === 1 && styles.buttonDisabled]}
              onPress={() => setStep(step + 1)}
              disabled={!name.trim() && step === 1}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Feather name="arrow-right" size={18} color={theme.colors.surface} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.buttonDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.surface} />
              ) : (
                <>
                  <Feather name="check" size={18} color={theme.colors.surface} />
                  <Text style={styles.saveButtonText}>Save medication</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.disclaimer}>
          Not a medical service. Consult your healthcare provider for medical decisions.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    fontSize: 18,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.xxl,
  },
  stepItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: theme.colors.primary,
  },
  stepDotDone: {
    backgroundColor: theme.colors.success,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textTertiary,
  },
  stepNumActive: {
    color: theme.colors.surface,
  },
  stepLabel: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '600',
  },
  stepLabelActive: {
    color: theme.colors.primary,
  },
  scroll: {
    padding: theme.spacing.xl,
    paddingBottom: 40,
  },
  stepContent: {
    gap: theme.spacing.xl,
  },
  field: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    height: 48,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  inputBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    height: 48,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  textArea: {
    height: 80,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
  suggestionsBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  suggestionGeneric: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  sourcePill: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sourcePillSupp: {
    backgroundColor: theme.colors.warningLight,
  },
  sourcePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.surface,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  toggleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  toggleHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  timeChip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '30%',
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  timeChipTextActive: {
    color: theme.colors.surface,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  prevButton: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prevButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  nextButton: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  saveButton: {
    flex: 1,
    height: 50,
    borderRadius: theme.radius.button,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  disclaimer: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
});

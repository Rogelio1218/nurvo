import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { searchMedications, MedSuggestion } from '../../lib/autocomplete';
import { useUserStore } from '../../store/userStore';
import { createMedication, createSchedule } from '../../lib/api';
import { useMedStore } from '../../store/medStore';
import { StatusBar } from 'expo-status-bar';

export default function AddMedOnboardingScreen() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MedSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<MedSuggestion | null>(null);
  const [saving, setSaving] = useState(false);
  const { activeProfileId } = useUserStore();
  const { addMedication } = useMedStore();

  const handleSearch = async (text: string) => {
    setQuery(text);
    setSelected(null);
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

  const handleSelect = (item: MedSuggestion) => {
    setSelected(item);
    setQuery(item.name);
    setSuggestions([]);
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
  };

  const handleSave = async () => {
    if (!activeProfileId) return;
    const medName = selected?.name || query.trim();
    if (!medName) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSaving(true);
    try {
      const med = await createMedication({
        profile_id: activeProfileId,
        name: medName,
        generic_name: selected?.genericName ?? null,
        dose_strength: selected?.strength ?? null,
        status: 'active',
        is_critical: false,
      });
      await createSchedule({
        medication_id: med.id,
        frequency: 'daily',
        times_of_day: ['08:00'],
        days_of_week: [0, 1, 2, 3, 4, 5, 6],
        as_needed: false,
      });
      addMedication(med);
      router.push('/onboarding/complete');
    } catch {
      router.push('/onboarding/complete');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={22} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.iconWrapper}>
        <Ionicons name="medical-outline" size={28} color={theme.colors.primary} />
      </View>

      <Text style={styles.title}>Add your first medication</Text>
      <Text style={styles.subtitle}>
        Optional — you can always add or update medications later.
      </Text>

      {/* Search input */}
      <View style={styles.searchWrapper}>
        <Feather
          name="search"
          size={18}
          color={theme.colors.textTertiary}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search medication name..."
          placeholderTextColor={theme.colors.textTertiary}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="words"
        />
        {searching && (
          <ActivityIndicator
            size="small"
            color={theme.colors.primary}
            style={{ marginRight: theme.spacing.sm }}
          />
        )}
        {selected && (
          <Feather name="check-circle" size={18} color={theme.colors.success} />
        )}
      </View>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <View style={styles.suggestionLeft}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  {item.genericName && (
                    <Text style={styles.suggestionGeneric}>
                      {item.genericName}
                    </Text>
                  )}
                </View>
                <View
                  style={[
                    styles.sourceBadge,
                    item.source === 'supplement' && styles.sourceBadgeSupplement,
                  ]}
                >
                  <Text style={styles.sourceText}>
                    {item.source === 'fda' ? 'FDA' : 'Supplement'}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Feather
          name="info"
          size={14}
          color={theme.colors.textTertiary}
          style={{ marginTop: 2 }}
        />
        <Text style={styles.disclaimerText}>
          Nurvo is a wellness organizer — not a medical service. Always consult
          your healthcare provider for medical advice.
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!query.trim() || saving) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={!query.trim() || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <Text style={styles.primaryButtonText}>Add medication</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => router.push('/onboarding/complete')}
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodyPrimary,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    height: 52,
    marginBottom: theme.spacing.sm,
  },
  searchIcon: {
    marginRight: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionLeft: {
    flex: 1,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  suggestionGeneric: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  sourceBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    marginLeft: theme.spacing.sm,
  },
  sourceBadgeSupplement: {
    backgroundColor: theme.colors.warningLight,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textTertiary,
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: theme.spacing.xl,
    right: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  skipText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
});

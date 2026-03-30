import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { usePharmacyStore } from '../../store/pharmacyStore';
import { useMedStore } from '../../store/medStore';
import { searchMedications, MedSuggestion } from '../../lib/autocomplete';
import { searchMedicationPrices } from '../../lib/pharmacy';
import PharmacyResultCard from '../../components/PharmacyResultCard';

type SortMode = 'best' | 'price' | 'distance';

export default function RefillScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ medName?: string; genericName?: string }>();
  const inputRef = useRef<TextInput>(null);

  const {
    searchQuery,
    results,
    loading,
    error,
    sortMode,
    setSearchQuery,
    setResults,
    setLoading,
    setError,
    setSortMode,
    getSortedResults,
    clearSearch,
  } = usePharmacyStore();

  const { medications } = useMedStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<MedSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedGeneric, setSelectedGeneric] = useState<string | undefined>();
  const [hasSearched, setHasSearched] = useState(false);

  // Pre-fill from params (when navigating from low supply banner)
  useEffect(() => {
    if (params.medName) {
      setQuery(params.medName);
      setSelectedGeneric(params.genericName || undefined);
      handleSearch(params.medName, params.genericName || undefined);
    }
  }, [params.medName]);

  // Quick-pick meds from user's own list
  const userMeds = medications
    .filter((m) => m.status === 'active')
    .slice(0, 6);

  const handleQueryChange = async (text: string) => {
    setQuery(text);
    setSelectedGeneric(undefined);
    if (text.length >= 2) {
      const results = await searchMedications(text);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: MedSuggestion) => {
    setQuery(suggestion.name);
    setSelectedGeneric(suggestion.genericName);
    setShowSuggestions(false);
    Keyboard.dismiss();
    handleSearch(suggestion.name, suggestion.genericName);
  };

  const handleQuickPick = (med: { name: string; generic_name?: string }) => {
    setQuery(med.name);
    setSelectedGeneric(med.generic_name);
    setShowSuggestions(false);
    Keyboard.dismiss();
    handleSearch(med.name, med.generic_name);
  };

  const handleSearch = async (name?: string, generic?: string) => {
    const searchName = name || query;
    if (!searchName.trim()) return;

    Keyboard.dismiss();
    setShowSuggestions(false);
    setLoading(true);
    setError(null);
    setSearchQuery(searchName, generic || selectedGeneric);
    setHasSearched(true);

    try {
      const priceResults = await searchMedicationPrices(
        searchName,
        generic || selectedGeneric
      );
      setResults(priceResults);
      if (priceResults.length === 0) {
        setError('No pharmacies found nearby. Try expanding your search area.');
      }
    } catch (err: any) {
      if (err.message?.includes('permission')) {
        setError(
          'Location access is needed to find pharmacies near you. Please enable location in Settings.'
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const sortedResults = getSortedResults();
  const inStockCount = results.filter((r) => r.inStock).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find & Refill</Text>
        <Text style={styles.subtitle}>
          Search any medication, pill, or supplement
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={theme.colors.textTertiary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search medication or supplement..."
            placeholderTextColor={theme.colors.textTertiary}
            value={query}
            onChangeText={handleQueryChange}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
                clearSearch();
                setHasSearched(false);
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Autocomplete Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            {suggestions.map((s, idx) => (
              <TouchableOpacity
                key={`${s.name}-${idx}`}
                style={styles.suggestionRow}
                onPress={() => handleSuggestionSelect(s)}
              >
                <Ionicons
                  name={s.source === 'supplement' ? 'leaf-outline' : 'medical-outline'}
                  size={16}
                  color={theme.colors.textSecondary}
                />
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  {s.genericName && (
                    <Text style={styles.suggestionGeneric} numberOfLines={1}>
                      {s.genericName}
                      {s.strength ? ` · ${s.strength}` : ''}
                    </Text>
                  )}
                </View>
                <View style={styles.sourceBadge}>
                  <Text style={styles.sourceText}>
                    {s.source === 'fda' ? 'Rx' : 'Supplement'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Quick Pick from User's Meds */}
        {!hasSearched && userMeds.length > 0 && (
          <View style={styles.quickSection}>
            <Text style={styles.sectionLabel}>Your Medications</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChips}
            >
              {userMeds.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  style={[
                    styles.quickChip,
                    med.supply_count !== undefined &&
                      med.supply_count !== null &&
                      med.supply_count <= 7 &&
                      styles.quickChipUrgent,
                  ]}
                  onPress={() => handleQuickPick(med)}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      med.supply_count !== undefined &&
                        med.supply_count !== null &&
                        med.supply_count <= 7 &&
                        styles.quickChipTextUrgent,
                    ]}
                    numberOfLines={1}
                  >
                    {med.name}
                  </Text>
                  {med.supply_count !== undefined &&
                    med.supply_count !== null &&
                    med.supply_count <= 7 && (
                      <View style={styles.lowDot} />
                    )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>
              Finding pharmacies near you...
            </Text>
            <Text style={styles.loadingSubtext}>
              Checking prices & availability
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <View style={styles.errorContainer}>
            <Feather name="map-pin" size={32} color={theme.colors.textTertiary} />
            <Text style={styles.errorTitle}>Couldn't find results</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => handleSearch()}
            >
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Results */}
        {!loading && !error && hasSearched && sortedResults.length > 0 && (
          <View style={styles.resultsSection}>
            {/* Results header */}
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>
                  {sortedResults.length} pharmac{sortedResults.length === 1 ? 'y' : 'ies'} found
                </Text>
                <Text style={styles.resultsSubtitle}>
                  {inStockCount} in stock · Searching "{searchQuery}"
                </Text>
              </View>
            </View>

            {/* Sort Tabs */}
            <View style={styles.sortRow}>
              {(['best', 'price', 'distance'] as SortMode[]).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    styles.sortTab,
                    sortMode === mode && styles.sortTabActive,
                  ]}
                  onPress={() => setSortMode(mode)}
                >
                  <Text
                    style={[
                      styles.sortTabText,
                      sortMode === mode && styles.sortTabTextActive,
                    ]}
                  >
                    {mode === 'best'
                      ? 'Best Match'
                      : mode === 'price'
                      ? 'Lowest Price'
                      : 'Nearest'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Result Cards */}
            {sortedResults.map((result, idx) => (
              <PharmacyResultCard key={result.pharmacyId} result={result} rank={idx} />
            ))}
          </View>
        )}

        {/* Empty initial state */}
        {!hasSearched && !loading && userMeds.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="search" size={32} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Find any medication</Text>
            <Text style={styles.emptyText}>
              Search for prescriptions, OTC medications, vitamins, or
              supplements. We'll find the closest pharmacy with the best price.
            </Text>
          </View>
        )}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Prices shown are estimates based on public drug pricing data and may
          vary. Call the pharmacy to confirm availability and final pricing.
          Nurvo does not sell medications.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    paddingHorizontal: theme.spacing.md,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    ...theme.shadow,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
  },
  suggestionsContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: theme.spacing.xs,
    overflow: 'hidden',
    ...theme.shadow,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  suggestionInfo: {
    flex: 1,
    gap: 1,
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  suggestionGeneric: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  sourceBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 120,
    gap: theme.spacing.xl,
  },
  quickSection: {
    gap: theme.spacing.md,
  },
  sectionLabel: {
    ...theme.typography.sectionHeader,
    color: theme.colors.textSecondary,
  },
  quickChips: {
    gap: theme.spacing.sm,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickChipUrgent: {
    borderColor: theme.colors.danger,
    backgroundColor: theme.colors.dangerLight,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textPrimary,
    maxWidth: 120,
  },
  quickChipTextUrgent: {
    color: theme.colors.danger,
    fontWeight: '600',
  },
  lowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.danger,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  loadingSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: theme.spacing.md,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
  },
  retryButton: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  resultsSection: {
    gap: theme.spacing.md,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  resultsSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sortRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  sortTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sortTabActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  sortTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  sortTabTextActive: {
    color: theme.colors.surface,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: theme.spacing.md,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 300,
  },
  disclaimer: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: theme.spacing.md,
  },
});

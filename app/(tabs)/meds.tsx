import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { useMedStore, Medication } from '../../store/medStore';
import { getMedications } from '../../lib/api';

const FORM_ICONS: Record<string, string> = {
  tablet: '💊',
  capsule: '💊',
  liquid: '🧪',
  injection: '💉',
  patch: '🩹',
  inhaler: '🫁',
  drops: '💧',
  supplement: '🌿',
};

export default function MedsScreen() {
  const insets = useSafeAreaInsets();
  const { activeProfileId } = useUserStore();
  const { medications, setMedications } = useMedStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadMedications = useCallback(async () => {
    if (!activeProfileId) return;
    try {
      const meds = await getMedications(activeProfileId);
      setMedications(meds as Medication[]);
    } catch (err) {
      console.error('Failed to load medications:', err);
    } finally {
      setLoading(false);
    }
  }, [activeProfileId]);

  useFocusEffect(
    useCallback(() => {
      loadMedications();
    }, [loadMedications])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedications();
    setRefreshing(false);
  };

  const criticalMeds = medications.filter((m) => m.is_critical);
  const regularMeds = medications.filter((m) => !m.is_critical);

  const renderMedRow = (med: Medication) => {
    const form = med.form?.toLowerCase() ?? '';
    const emoji = FORM_ICONS[form] ?? '💊';

    return (
      <TouchableOpacity
        key={med.id}
        style={styles.medRow}
        onPress={() =>
          router.push({ pathname: '/meds/detail', params: { id: med.id } })
        }
        activeOpacity={0.75}
      >
        <View style={styles.medEmoji}>
          <Text style={styles.emojiText}>{emoji}</Text>
        </View>
        <View style={styles.medInfo}>
          <Text style={styles.medName} numberOfLines={1}>
            {med.name}
          </Text>
          <Text style={styles.medDetails} numberOfLines={1}>
            {[
              med.dose_strength && `${med.dose_strength}${med.dose_unit ?? ''}`,
              med.form,
              med.what_for,
            ]
              .filter(Boolean)
              .join(' · ') || 'Tap to see details'}
          </Text>
          {med.prescriber && (
            <Text style={styles.prescriber}>{med.prescriber}</Text>
          )}
        </View>
        <View style={styles.medRight}>
          {med.supply_count !== undefined && med.supply_count !== null && (
            <View
              style={[
                styles.supplyBadge,
                med.supply_count <= 7 && styles.supplyLow,
              ]}
            >
              <Text
                style={[
                  styles.supplyText,
                  med.supply_count <= 7 && styles.supplyTextLow,
                ]}
              >
                {med.supply_count} left
              </Text>
            </View>
          )}
          <Feather
            name="chevron-right"
            size={18}
            color={theme.colors.textTertiary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Medications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => router.push('/meds/scanner')}
          >
            <Feather name="camera" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/meds/add')}
          >
            <Feather name="plus" size={20} color={theme.colors.surface} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : medications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="medical-outline"
              size={40}
              color={theme.colors.textTertiary}
            />
            <Text style={styles.emptyTitle}>No medications yet</Text>
            <Text style={styles.emptyText}>
              Add your medications to track doses and get reminders.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => router.push('/meds/add')}
            >
              <Feather name="plus" size={16} color={theme.colors.surface} />
              <Text style={styles.emptyAddButtonText}>Add medication</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {criticalMeds.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>Critical</Text>
                <View style={styles.medList}>
                  {criticalMeds.map(renderMedRow)}
                </View>
              </View>
            )}

            {regularMeds.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionHeader}>
                  {criticalMeds.length > 0 ? 'Regular' : 'All Medications'}
                </Text>
                <View style={styles.medList}>
                  {regularMeds.map(renderMedRow)}
                </View>
              </View>
            )}
          </>
        )}

        <Text style={styles.disclaimer}>
          Nurvo is a personal wellness organizer. Not a medical service. Always
          consult a qualified healthcare provider for medical decisions.
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 100,
    gap: theme.spacing.xl,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    ...theme.typography.sectionHeader,
    color: theme.colors.textSecondary,
  },
  medList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
    ...theme.shadow,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  medEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 22,
  },
  medInfo: {
    flex: 1,
    gap: 2,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  medDetails: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  prescriber: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  medRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  supplyBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  supplyLow: {
    backgroundColor: theme.colors.dangerLight,
  },
  supplyText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  supplyTextLow: {
    color: theme.colors.danger,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: theme.spacing.md,
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
    maxWidth: 280,
  },
  emptyAddButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  disclaimer: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useMedStore, Medication } from '../../store/medStore';
import { deleteMedication } from '../../lib/api';
import PharmacyCard from '../../components/PharmacyCard';

export default function MedDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medications, deleteMedication: deleteMedFromStore } = useMedStore();
  const [med, setMed] = useState<Medication | null>(null);

  useEffect(() => {
    if (id) {
      const found = medications.find((m) => m.id === id);
      setMed(found ?? null);
    }
  }, [id, medications]);

  const handleDelete = () => {
    Alert.alert(
      'Remove medication',
      `Remove ${med?.name} from your list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            if (Platform.OS !== 'web') {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            try {
              await deleteMedication(id);
              deleteMedFromStore(id);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  if (!med) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Medication not found.</Text>
      </View>
    );
  }

  const InfoRow = ({
    label,
    value,
  }: {
    label: string;
    value?: string | null;
  }) => {
    if (!value) return null;
    return (
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {med.name}
        </Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Feather name="trash-2" size={18} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>💊</Text>
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{med.name}</Text>
            {med.generic_name && (
              <Text style={styles.heroGeneric}>{med.generic_name}</Text>
            )}
            <View style={styles.heroMeta}>
              {med.dose_strength && (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>
                    {med.dose_strength}
                    {med.dose_unit ?? ''}
                  </Text>
                </View>
              )}
              {med.form && (
                <View style={styles.metaBadge}>
                  <Text style={styles.metaBadgeText}>{med.form}</Text>
                </View>
              )}
              {med.is_critical && (
                <View style={[styles.metaBadge, styles.criticalBadge]}>
                  <Feather name="alert-circle" size={10} color={theme.colors.danger} />
                  <Text style={[styles.metaBadgeText, styles.criticalBadgeText]}>
                    Critical
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.infoCard}>
            <InfoRow label="What it's for" value={med.what_for} />
            <InfoRow label="Prescriber" value={med.prescriber} />
            <InfoRow
              label="Supply"
              value={
                med.supply_count != null ? `${med.supply_count} remaining` : null
              }
            />
            <InfoRow
              label="Status"
              value={med.status.charAt(0).toUpperCase() + med.status.slice(1)}
            />
            {med.notes && <InfoRow label="Notes" value={med.notes} />}
          </View>
        </View>

        {/* Schedule */}
        {med.medication_schedules && med.medication_schedules.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            {med.medication_schedules.map((s: any, i: number) => (
              <View key={i} style={styles.scheduleCard}>
                <Feather name="clock" size={16} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.scheduleFreq}>
                    {s.as_needed ? 'As needed' : s.frequency?.replace('_', ' ')}
                  </Text>
                  {s.times_of_day?.length > 0 && (
                    <Text style={styles.scheduleTime}>
                      {s.times_of_day
                        .map((t: string) => {
                          const [h, m] = t.split(':').map(Number);
                          return new Date(0, 0, 0, h, m).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          });
                        })
                        .join(', ')}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pharmacy */}
        {med.pharmacy_name && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pharmacy</Text>
            <PharmacyCard
              name={med.pharmacy_name}
              phone={med.pharmacy_phone ?? undefined}
            />
          </View>
        )}

        {/* Disclaimer */}
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
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
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
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  deleteBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
    paddingBottom: 80,
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.lg,
    ...theme.shadow,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: {
    fontSize: 32,
  },
  heroInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  heroGeneric: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  heroMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: 4,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  criticalBadge: {
    backgroundColor: theme.colors.dangerLight,
  },
  criticalBadgeText: {
    color: theme.colors.danger,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.sectionHeader,
    color: theme.colors.textSecondary,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flexShrink: 1,
    textAlign: 'right',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scheduleFreq: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textTransform: 'capitalize',
  },
  scheduleTime: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  notFound: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 60,
  },
  disclaimer: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

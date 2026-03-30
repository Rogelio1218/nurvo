import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { theme } from '../constants/theme';
import { Medication } from '../store/medStore';

interface LowSupplyBannerProps {
  medications: Medication[];
}

export default function LowSupplyBanner({ medications }: LowSupplyBannerProps) {
  const lowSupplyMeds = medications.filter(
    (m) =>
      m.supply_count !== undefined &&
      m.supply_count !== null &&
      m.supply_count <= 7 &&
      m.status === 'active'
  );

  if (lowSupplyMeds.length === 0) return null;

  const outOfStock = lowSupplyMeds.filter((m) => m.supply_count === 0);
  const runningLow = lowSupplyMeds.filter(
    (m) => m.supply_count! > 0 && m.supply_count! <= 7
  );

  const handleFindPharmacy = (med: Medication) => {
    router.push({
      pathname: '/(tabs)/refill',
      params: { medName: med.name, genericName: med.generic_name || '' },
    });
  };

  return (
    <View style={styles.container}>
      {outOfStock.length > 0 && (
        <View style={styles.urgentBanner}>
          <View style={styles.bannerHeader}>
            <Feather name="alert-circle" size={16} color={theme.colors.danger} />
            <Text style={styles.urgentTitle}>Out of stock</Text>
          </View>
          {outOfStock.map((med) => (
            <TouchableOpacity
              key={med.id}
              style={styles.medRow}
              onPress={() => handleFindPharmacy(med)}
              activeOpacity={0.8}
            >
              <Text style={styles.urgentMedName} numberOfLines={1}>
                {med.name}
              </Text>
              <View style={styles.findButton}>
                <Feather name="search" size={13} color={theme.colors.surface} />
                <Text style={styles.findButtonText}>Find nearby</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {runningLow.length > 0 && (
        <View style={styles.warningBanner}>
          <View style={styles.bannerHeader}>
            <Feather name="alert-triangle" size={16} color={theme.colors.warning} />
            <Text style={styles.warningTitle}>Running low</Text>
          </View>
          {runningLow.map((med) => (
            <TouchableOpacity
              key={med.id}
              style={styles.medRow}
              onPress={() => handleFindPharmacy(med)}
              activeOpacity={0.8}
            >
              <View style={styles.medRowLeft}>
                <Text style={styles.warningMedName} numberOfLines={1}>
                  {med.name}
                </Text>
                <Text style={styles.supplyCount}>
                  {med.supply_count} dose{med.supply_count !== 1 ? 's' : ''} left
                </Text>
              </View>
              <View style={styles.refillButton}>
                <Text style={styles.refillButtonText}>Refill</Text>
                <Feather name="arrow-right" size={13} color={theme.colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  urgentBanner: {
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#F5B8B1',
    gap: theme.spacing.md,
  },
  warningBanner: {
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#F5D49A',
    gap: theme.spacing.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  urgentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.danger,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  medRowLeft: {
    flex: 1,
    gap: 1,
  },
  urgentMedName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  warningMedName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  supplyCount: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  findButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.danger,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  findButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  refillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  refillButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

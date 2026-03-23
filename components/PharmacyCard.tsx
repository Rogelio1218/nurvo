import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface PharmacyCardProps {
  name: string;
  phone?: string;
}

export default function PharmacyCard({ name, phone }: PharmacyCardProps) {
  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={styles.iconWrapper}>
          <Feather name="map-pin" size={16} color={theme.colors.primary} />
        </View>
        <View>
          <Text style={styles.label}>Pharmacy</Text>
          <Text style={styles.name}>{name}</Text>
          {phone && <Text style={styles.phone}>{phone}</Text>}
        </View>
      </View>
      {phone && (
        <TouchableOpacity style={styles.callButton} onPress={handleCall}>
          <Feather name="phone" size={16} color={theme.colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  phone: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

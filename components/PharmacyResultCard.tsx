import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { PriceResult } from '../lib/pharmacy';

interface PharmacyResultCardProps {
  result: PriceResult;
  rank?: number;
}

export default function PharmacyResultCard({
  result,
  rank,
}: PharmacyResultCardProps) {
  const isBestDeal = rank === 0 && result.inStock;

  const handleCall = () => {
    if (result.phone) {
      Linking.openURL(`tel:${result.phone}`);
    }
  };

  const handleDirections = () => {
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
      default: 'https://maps.google.com/maps?',
    });
    const url = Platform.select({
      ios: `${scheme}?daddr=${result.latitude},${result.longitude}`,
      android: `${scheme}${result.latitude},${result.longitude}?q=${result.latitude},${result.longitude}(${encodeURIComponent(result.pharmacyName)})`,
      default: `${scheme}daddr=${result.latitude},${result.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={[styles.card, isBestDeal && styles.bestDealCard]}>
      {isBestDeal && (
        <View style={styles.bestBadge}>
          <Feather name="award" size={12} color={theme.colors.surface} />
          <Text style={styles.bestBadgeText}>Best Deal</Text>
        </View>
      )}

      <View style={styles.topRow}>
        <View style={styles.pharmacyInfo}>
          <Text style={styles.pharmacyName} numberOfLines={1}>
            {result.pharmacyName}
          </Text>
          <Text style={styles.address} numberOfLines={2}>
            {result.address}
          </Text>
          <View style={styles.distanceRow}>
            <Feather name="navigation" size={12} color={theme.colors.textTertiary} />
            <Text style={styles.distance}>{result.distanceMiles} mi</Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          <Text style={styles.price}>${result.price.toFixed(2)}</Text>
          {result.genericPrice && (
            <Text style={styles.genericPrice}>
              Generic ${result.genericPrice.toFixed(2)}
            </Text>
          )}
          <Text style={styles.quantity}>{result.quantity}</Text>
        </View>
      </View>

      {/* Stock status */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.stockBadge,
            result.inStock ? styles.inStockBadge : styles.outStockBadge,
          ]}
        >
          <View
            style={[
              styles.stockDot,
              { backgroundColor: result.inStock ? theme.colors.success : theme.colors.danger },
            ]}
          />
          <Text
            style={[
              styles.stockText,
              { color: result.inStock ? theme.colors.success : theme.colors.danger },
            ]}
          >
            {result.inStock ? 'In Stock' : 'Out of Stock'}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.directionsButton}
          onPress={handleDirections}
          activeOpacity={0.8}
        >
          <Feather name="map-pin" size={15} color={theme.colors.surface} />
          <Text style={styles.directionsText}>Directions</Text>
        </TouchableOpacity>

        {result.phone && (
          <TouchableOpacity
            style={styles.callButton}
            onPress={handleCall}
            activeOpacity={0.8}
          >
            <Feather name="phone" size={15} color={theme.colors.primary} />
            <Text style={styles.callText}>Call</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...theme.shadow,
  },
  bestDealCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  bestBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.surface,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  pharmacyInfo: {
    flex: 1,
    gap: 3,
  },
  pharmacyName: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  address: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  distance: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  priceSection: {
    alignItems: 'flex-end',
    gap: 2,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  genericPrice: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: '600',
  },
  quantity: {
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  inStockBadge: {
    backgroundColor: theme.colors.successLight,
  },
  outStockBadge: {
    backgroundColor: theme.colors.dangerLight,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  directionsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingVertical: theme.spacing.md,
  },
  directionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  callButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.button,
    paddingVertical: theme.spacing.md,
  },
  callText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

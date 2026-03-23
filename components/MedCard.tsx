import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Feather, Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { DoseLog } from '../store/medStore';

interface MedCardProps {
  dose: DoseLog;
  onTake: (doseId: string) => void;
  onSkip: (doseId: string) => void;
  compact?: boolean;
}

export default function MedCard({
  dose,
  onTake,
  onSkip,
  compact = false,
}: MedCardProps) {
  const scale = useSharedValue(1);

  const medName = dose.medications?.name ?? 'Medication';
  const doseStr = dose.medications?.dose_strength;
  const unit = dose.medications?.dose_unit ?? '';
  const form = dose.medications?.form ?? '';
  const isCritical = dose.medications?.is_critical ?? false;
  const isTaken = dose.status === 'taken';
  const isSkipped = dose.status === 'skipped';
  const isPending = dose.status === 'pending';

  const time = dose.scheduled_time
    ? new Date(dose.scheduled_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  const handleTake = async () => {
    if (!isPending) return;
    scale.value = withSpring(0.96, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onTake(dose.id);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const cardBg = isTaken
    ? theme.colors.successLight
    : isSkipped
    ? theme.colors.border
    : theme.colors.surface;

  return (
    <Animated.View style={[styles.card, { backgroundColor: cardBg }, animatedStyle]}>
      {isCritical && !isTaken && (
        <View style={styles.criticalBadge}>
          <Feather name="alert-circle" size={10} color={theme.colors.danger} />
          <Text style={styles.criticalText}>Critical</Text>
        </View>
      )}

      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          <Ionicons
            name="medical-outline"
            size={20}
            color={isTaken ? theme.colors.success : theme.colors.primary}
          />
        </View>

        <View style={styles.info}>
          <Text style={styles.medName} numberOfLines={1}>
            {medName}
          </Text>
          <Text style={styles.details}>
            {[doseStr && `${doseStr}${unit}`, form].filter(Boolean).join(' · ') || 'See details'}
          </Text>
          {time ? <Text style={styles.time}>{time}</Text> : null}
        </View>

        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.takeButton}
              onPress={handleTake}
              activeOpacity={0.8}
            >
              <Feather name="check" size={16} color={theme.colors.surface} />
              <Text style={styles.takeButtonText}>Take</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => onSkip(dose.id)}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}

        {isTaken && (
          <View style={styles.takenBadge}>
            <Feather name="check-circle" size={20} color={theme.colors.success} />
          </View>
        )}

        {isSkipped && (
          <View style={styles.skippedBadge}>
            <Feather name="minus-circle" size={18} color={theme.colors.textTertiary} />
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
    marginBottom: theme.spacing.sm,
  },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.dangerLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  criticalText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.danger,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  details: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  time: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  takeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  takeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  skipButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  skipText: {
    fontSize: 13,
    color: theme.colors.textTertiary,
  },
  takenBadge: {
    padding: theme.spacing.sm,
  },
  skippedBadge: {
    padding: theme.spacing.sm,
  },
});

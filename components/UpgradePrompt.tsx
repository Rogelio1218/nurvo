import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

interface UpgradePromptProps {
  visible: boolean;
  onClose: () => void;
  feature?: string;
  reason?: string;
}

const PREMIUM_FEATURES = [
  { icon: 'users', label: 'Unlimited family members' },
  { icon: 'message-circle', label: 'Unlimited Clarity questions' },
  { icon: 'bell', label: 'Advanced reminders' },
  { icon: 'bar-chart-2', label: 'Wellness analytics' },
  { icon: 'shield', label: 'Interaction history' },
];

export default function UpgradePrompt({
  visible,
  onClose,
  feature,
  reason,
}: UpgradePromptProps) {
  const handleUpgrade = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    // RevenueCat purchase flow would go here
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.iconWrapper}>
            <Text style={styles.iconText}>⭐</Text>
          </View>

          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            {reason ?? `Unlock ${feature ?? 'all premium features'} and more.`}
          </Text>

          <View style={styles.featureList}>
            {PREMIUM_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureIcon}>
                  <Feather
                    name={f.icon as any}
                    size={15}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <Text style={styles.upgradeButtonText}>Start 7-day free trial</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text style={styles.laterText}>Maybe later</Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            This app is a wellness organizer. Not a medical service. Always
            consult a qualified healthcare provider for medical decisions.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.radius.modal,
    borderTopRightRadius: theme.radius.modal,
    padding: theme.spacing.xl,
    paddingBottom: 40,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.bodySecondary,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  featureList: {
    width: '100%',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  upgradeButton: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  upgradeButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
  },
  laterButton: {
    paddingVertical: theme.spacing.sm,
  },
  laterText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
  },
  disclaimer: {
    fontSize: 10,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 15,
    marginTop: theme.spacing.sm,
  },
});

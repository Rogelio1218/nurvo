import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';

interface CompletionRitualProps {
  visible: boolean;
  streak: number;
  allTaken: boolean;
  onClose: () => void;
}

export default function CompletionRitual({
  visible,
  streak,
  allTaken,
  onClose,
}: CompletionRitualProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withDelay(
        100,
        withSpring(1, { damping: 14, stiffness: 200 })
      );
      emojiScale.value = withDelay(
        300,
        withSequence(
          withSpring(1.3, { damping: 10 }),
          withSpring(1, { damping: 12 })
        )
      );
      if (Platform.OS !== 'web') {
        setTimeout(() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 200);
      }
    } else {
      scale.value = withTiming(0.9);
      opacity.value = withTiming(0);
      emojiScale.value = withTiming(0);
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ scale: emojiScale.value }],
  }));

  const emoji = allTaken ? '🎉' : '✅';
  const title = allTaken ? 'All doses taken!' : 'Dose confirmed!';
  const subtitle = allTaken
    ? `Perfect day! Keep your ${streak}-day streak going.`
    : 'Great job staying on track with your wellness routine.';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, backdropStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>
          <Animated.Text style={[styles.emoji, emojiStyle]}>{emoji}</Animated.Text>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {allTaken && streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {streak} day streak</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.modal,
    padding: theme.spacing.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  emoji: {
    fontSize: 56,
    marginBottom: theme.spacing.sm,
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
  streakBadge: {
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.warning,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    height: 48,
    paddingHorizontal: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: theme.spacing.sm,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
  },
});

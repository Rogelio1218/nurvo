import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function CompleteScreen() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(200, withSpring(1, { damping: 12, stiffness: 200 }));
    opacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    textOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    buttonOpacity.value = withDelay(1100, withTiming(1, { duration: 400 }));

    if (Platform.OS !== 'web') {
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 300);
    }
  }, []);

  const checkStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.content}>
        <Animated.View style={[styles.checkWrapper, checkStyle]}>
          <Feather name="check" size={40} color={theme.colors.surface} />
        </Animated.View>

        <Animated.View style={textStyle}>
          <Text style={styles.title}>You're all set!</Text>
          <Text style={styles.subtitle}>
            Nurvo is ready to help you and your family stay organized.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.featureGrid, textStyle]}>
          {[
            { icon: 'bell', label: 'Smart reminders', desc: 'Never miss a dose' },
            { icon: 'award', label: 'Daily streaks', desc: 'Build healthy habits' },
            { icon: 'message-circle', label: 'Clarity', desc: 'Wellness Q&A' },
            { icon: 'users', label: 'Family', desc: 'Manage everyone' },
          ].map((item, i) => (
            <View key={i} style={styles.featureCard}>
              <View style={styles.featureIconWrapper}>
                <Feather
                  name={item.icon as any}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Text style={styles.featureLabel}>{item.label}</Text>
              <Text style={styles.featureDesc}>{item.desc}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, buttonStyle]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonText}>Start using Nurvo</Text>
          <Feather name="arrow-right" size={20} color={theme.colors.primary} />
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Nurvo is not a medical service. Always consult a qualified healthcare
          provider for medical decisions.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 80,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xl,
  },
  checkWrapper: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.surface,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  featureCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    width: '47%',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.surface,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  footer: {
    gap: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.button,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  disclaimer: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 16,
  },
});

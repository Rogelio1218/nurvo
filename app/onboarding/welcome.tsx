import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const DISCLAIMER =
  'Nurvo is a personal wellness organizer. It is not a medical service and does not provide medical advice. Always consult a qualified healthcare provider for medical decisions.';

export default function WelcomeScreen() {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const titleOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslate = useSharedValue(20);
  const decorOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(
      200,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) })
    );
    titleOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    buttonOpacity.value = withDelay(1200, withTiming(1, { duration: 400 }));
    buttonTranslate.value = withDelay(1200, withTiming(0, { duration: 400 }));
    decorOpacity.value = withDelay(100, withTiming(0.08, { duration: 800 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslate.value }],
  }));

  const decorStyle = useAnimatedStyle(() => ({
    opacity: decorOpacity.value,
  }));

  const handleGetStarted = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/onboarding/who');
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background decorative circles */}
      <Animated.View style={[styles.decorCircle1, decorStyle]} />
      <Animated.View style={[styles.decorCircle2, decorStyle]} />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={styles.logoIconWrapper}>
            <Feather name="heart" size={36} color={theme.colors.surface} />
          </View>
        </Animated.View>

        {/* App name */}
        <Animated.View style={titleStyle}>
          <Text style={styles.appName}>Nurvo</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>Your wellness, organized.</Text>
          <Text style={styles.subTagline}>
            Track medications, build healthy habits,{'\n'}and stay on top of your family's wellness.
          </Text>
        </Animated.View>

        {/* Features list */}
        <Animated.View style={[styles.featureList, taglineStyle]}>
          {[
            { icon: 'check-circle', text: 'Smart medication reminders' },
            { icon: 'users', text: 'Family wellness organizer' },
            { icon: 'message-circle', text: 'Clarity wellness assistant' },
            { icon: 'award', text: 'Streaks & healthy habits' },
          ].map((item, i) => (
            <View key={i} style={styles.featureRow}>
              <Feather
                name={item.icon as any}
                size={16}
                color={theme.colors.primaryLight}
              />
              <Text style={styles.featureText}>{item.text}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        <Animated.View style={buttonStyle}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Get started</Text>
            <Feather
              name="arrow-right"
              size={20}
              color={theme.colors.primary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/onboarding/who')}
            activeOpacity={0.7}
          >
            <Text style={styles.loginButtonText}>
              Already have an account? Sign in
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.disclaimerContainer, buttonStyle]}>
          <Text style={styles.disclaimer}>{DISCLAIMER}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'space-between',
  },
  decorCircle1: {
    position: 'absolute',
    top: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: theme.colors.surface,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 120,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: theme.colors.surface,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 80,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: theme.spacing.xl,
  },
  logoIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.surface,
    letterSpacing: -1,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subTagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  featureList: {
    width: '100%',
    gap: theme.spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  featureText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  bottomSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 40,
    gap: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.button,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
  },
  loginButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  loginButtonText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  disclaimerContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: theme.spacing.lg,
  },
  disclaimer: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 15,
  },
});

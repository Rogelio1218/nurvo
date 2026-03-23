import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { StatusBar } from 'expo-status-bar';

type AuthMode = 'signup' | 'signin';

export default function WhoScreen() {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        router.push('/onboarding/name');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'signup' ? 'Create your account' : 'Welcome back'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'signup'
              ? 'Your wellness data is private and secure.'
              : 'Sign in to continue with Nurvo.'}
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="mail"
                size={18}
                color={theme.colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={theme.colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Feather
                name="lock"
                size={18}
                color={theme.colors.textTertiary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder={
                  mode === 'signup' ? 'At least 8 characters' : 'Your password'
                }
                placeholderTextColor={theme.colors.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={18}
                  color={theme.colors.textTertiary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.surface} />
            ) : (
              <Text style={styles.primaryButtonText}>
                {mode === 'signup' ? 'Create account' : 'Sign in'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchMode}
            onPress={() => setMode(mode === 'signup' ? 'signin' : 'signup')}
          >
            <Text style={styles.switchModeText}>
              {mode === 'signup'
                ? 'Already have an account? '
                : 'New to Nurvo? '}
              <Text style={styles.switchModeLink}>
                {mode === 'signup' ? 'Sign in' : 'Create account'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          This app is a personal wellness organizer. It is not a medical service
          and does not provide medical advice. Always consult a qualified
          healthcare provider for medical decisions.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xxl,
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodyPrimary,
    color: theme.colors.textSecondary,
  },
  form: {
    gap: theme.spacing.lg,
    flex: 1,
  },
  inputGroup: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    height: 52,
  },
  inputIcon: {
    marginRight: theme.spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  eyeButton: {
    padding: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
  },
  switchMode: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  switchModeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  switchModeLink: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: theme.spacing.xxl,
  },
});

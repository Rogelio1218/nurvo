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
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { createUser, createProfile } from '../../lib/api';
import { useUserStore } from '../../store/userStore';
import { useFamilyStore } from '../../store/familyStore';
import { StatusBar } from 'expo-status-bar';

export default function NameScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { setActiveProfile } = useUserStore();
  const { addMember } = useFamilyStore();

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name to continue.');
      return;
    }
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      await createUser(user.id, user.email ?? '', name.trim());

      const profile = await createProfile(user.id, name.trim(), 'Self', true);
      setActiveProfile(profile.id, profile.name);
      addMember(profile);

      router.push('/onboarding/add-med');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not save your name. Please try again.');
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
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Feather name="arrow-left" size={22} color={theme.colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Feather name="user" size={28} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>What's your name?</Text>
        <Text style={styles.subtitle}>
          This personalizes your experience and helps you manage wellness for
          your family.
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        <Text style={styles.hint}>
          You can add family members after setup.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!name.trim() || loading) && styles.buttonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!name.trim() || loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Continue</Text>
              <Feather name="arrow-right" size={20} color={theme.colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  content: {
    flex: 1,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    ...theme.typography.bodyPrimary,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xxl,
  },
  inputWrapper: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    height: 56,
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  input: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  hint: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.sm,
  },
  footer: {
    paddingBottom: theme.spacing.sm,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
  },
});

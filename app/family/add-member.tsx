import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { useFamilyStore } from '../../store/familyStore';
import { createProfile } from '../../lib/api';

const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Other'];

export default function AddMemberScreen() {
  const insets = useSafeAreaInsets();
  const { userId } = useUserStore();
  const { addMember } = useFamilyStore();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [dob, setDob] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter the member\'s name.');
      return;
    }
    if (!userId) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setSaving(true);
    try {
      const profile = await createProfile(
        userId,
        name.trim(),
        relationship || undefined,
        false
      );
      addMember(profile);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not add family member.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add family member</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrapper}>
          <Feather name="user-plus" size={28} color={theme.colors.primary} />
        </View>

        <Text style={styles.title}>Who are you adding?</Text>
        <Text style={styles.subtitle}>
          You can manage medications and wellness info for each family member
          separately.
        </Text>

        {/* Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="Full name or nickname"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoFocus
          />
        </View>

        {/* Relationship */}
        <View style={styles.field}>
          <Text style={styles.label}>Relationship</Text>
          <View style={styles.chipRow}>
            {RELATIONSHIPS.map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, relationship === r && styles.chipActive]}
                onPress={() => {
                  setRelationship(relationship === r ? '' : r);
                  if (Platform.OS !== 'web') Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[styles.chipText, relationship === r && styles.chipTextActive]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date of birth */}
        <View style={styles.field}>
          <Text style={styles.label}>Date of birth (optional)</Text>
          <TextInput
            style={styles.inputBox}
            placeholder="MM/DD/YYYY"
            placeholderTextColor={theme.colors.textTertiary}
            value={dob}
            onChangeText={setDob}
            keyboardType="numbers-and-punctuation"
          />
          <Text style={styles.fieldHint}>
            Optional — helps personalize wellness tips.
          </Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Feather
            name="shield"
            size={14}
            color={theme.colors.textTertiary}
            style={{ marginTop: 1 }}
          />
          <Text style={styles.disclaimerText}>
            All data is stored securely and privately. Nurvo is a wellness
            organizer — not a medical service. Consult healthcare providers for
            medical decisions.
          </Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!name.trim() || saving) && styles.buttonDisabled,
          ]}
          onPress={handleSave}
          disabled={!name.trim() || saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color={theme.colors.surface} />
          ) : (
            <>
              <Feather name="user-plus" size={18} color={theme.colors.surface} />
              <Text style={styles.saveButtonText}>Add {name.trim() || 'member'}</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  scroll: {
    padding: theme.spacing.xl,
    gap: theme.spacing.xl,
    paddingBottom: 40,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...theme.typography.display,
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.typography.bodySecondary,
    color: theme.colors.textSecondary,
  },
  field: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  inputBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    height: 48,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  fieldHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.surface,
  },
  disclaimerBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textTertiary,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
  },
  saveButton: {
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
  saveButtonText: {
    ...theme.typography.button,
    color: theme.colors.surface,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useFamilyStore, FamilyMember } from '../../store/familyStore';
import { useMedStore, Medication } from '../../store/medStore';
import { useUserStore } from '../../store/userStore';
import { getMedications, updateProfile } from '../../lib/api';

export default function MemberDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { members } = useFamilyStore();
  const { setActiveProfile, activeProfileId } = useUserStore();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [meds, setMeds] = useState<Medication[]>([]);
  const [caregiverAlerts, setCaregiverAlerts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const found = members.find((m) => m.id === id);
      setMember(found ?? null);
      loadMemberMeds(id);
    }
  }, [id, members]);

  const loadMemberMeds = async (profileId: string) => {
    try {
      const data = await getMedications(profileId);
      setMeds(data as Medication[]);
    } catch {}
    setLoading(false);
  };

  const handleSwitchTo = () => {
    if (!member) return;
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setActiveProfile(member.id, member.name);
    router.back();
  };

  if (!member) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.notFound}>Profile not found.</Text>
      </View>
    );
  }

  const avatarEmojis = ['🧑', '👩', '👴', '👵', '🧒', '👦', '👧', '🧓'];
  const avatar = avatarEmojis[member.name.charCodeAt(0) % avatarEmojis.length];
  const isActive = member.id === activeProfileId;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{member.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={styles.profileCard}>
          <Text style={styles.profileAvatar}>{avatar}</Text>
          <Text style={styles.profileName}>{member.name}</Text>
          {member.relationship && (
            <Text style={styles.profileRelationship}>{member.relationship}</Text>
          )}
          {member.is_primary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Primary account</Text>
            </View>
          )}
          {!isActive && (
            <TouchableOpacity style={styles.switchButton} onPress={handleSwitchTo}>
              <Feather name="refresh-cw" size={14} color={theme.colors.surface} />
              <Text style={styles.switchButtonText}>
                Switch to {member.name}'s view
              </Text>
            </TouchableOpacity>
          )}
          {isActive && (
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Currently viewing</Text>
            </View>
          )}
        </View>

        {/* Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medications</Text>
            <TouchableOpacity
              onPress={() => router.push('/meds/add')}
            >
              <Text style={styles.addLink}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : meds.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No medications added yet.</Text>
            </View>
          ) : (
            <View style={styles.medsList}>
              {meds.map((med) => (
                <TouchableOpacity
                  key={med.id}
                  style={styles.medRow}
                  onPress={() =>
                    router.push({ pathname: '/meds/detail', params: { id: med.id } })
                  }
                >
                  <Text style={styles.medEmoji}>💊</Text>
                  <View style={styles.medInfo}>
                    <Text style={styles.medName}>{med.name}</Text>
                    {med.dose_strength && (
                      <Text style={styles.medDose}>
                        {med.dose_strength}
                        {med.dose_unit}
                      </Text>
                    )}
                  </View>
                  <Feather
                    name="chevron-right"
                    size={16}
                    color={theme.colors.textTertiary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Caregiver alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caregiver Alerts</Text>
          <View style={styles.alertCard}>
            <View style={styles.alertLeft}>
              <Feather name="bell" size={18} color={theme.colors.primary} />
              <View>
                <Text style={styles.alertLabel}>Missed dose alerts</Text>
                <Text style={styles.alertHint}>
                  Notify you if {member.name} misses a dose
                </Text>
              </View>
            </View>
            <Switch
              value={caregiverAlerts}
              onValueChange={(v) => {
                setCaregiverAlerts(v);
                if (Platform.OS !== 'web') Haptics.selectionAsync();
              }}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
          <Text style={styles.alertDisclaimer}>
            Caregiver alerts are for wellness organization purposes only. They
            are not a substitute for medical supervision.
          </Text>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          Nurvo is a personal wellness organizer. Not a medical service. Always
          consult a qualified healthcare provider for medical decisions.
        </Text>
      </ScrollView>
    </View>
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
    paddingVertical: theme.spacing.md,
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
    paddingBottom: 80,
  },
  profileCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow,
  },
  profileAvatar: {
    fontSize: 52,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  profileRelationship: {
    fontSize: 15,
    color: theme.colors.textSecondary,
  },
  primaryBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 4,
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  switchButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  switchButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  activeText: {
    fontSize: 13,
    color: theme.colors.success,
    fontWeight: '600',
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...theme.typography.sectionHeader,
    color: theme.colors.textSecondary,
  },
  addLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  medsList: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  medRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  medEmoji: {
    fontSize: 20,
    width: 32,
    textAlign: 'center',
  },
  medInfo: {
    flex: 1,
  },
  medName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  medDose: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  alertLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  alertLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  alertHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    marginTop: 2,
  },
  alertDisclaimer: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    lineHeight: 16,
  },
  notFound: {
    fontSize: 16,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 60,
  },
  disclaimer: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

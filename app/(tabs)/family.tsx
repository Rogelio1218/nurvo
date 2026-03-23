import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { useFamilyStore, FamilyMember } from '../../store/familyStore';
import { useMedStore } from '../../store/medStore';
import FamilyCard from '../../components/FamilyCard';
import UpgradePrompt from '../../components/UpgradePrompt';
import {
  getProfiles,
  getMedications,
  deleteProfile,
} from '../../lib/api';

const FREE_MEMBER_LIMIT = 2;

export default function FamilyScreen() {
  const insets = useSafeAreaInsets();
  const { userId, activeProfileId, setActiveProfile, subscriptionTier } =
    useUserStore();
  const { members, setMembers, deleteMember } = useFamilyStore();
  const { setMedications } = useMedStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPremium =
    subscriptionTier === 'premium' || subscriptionTier === 'family';
  const reachedLimit = !isPremium && members.length >= FREE_MEMBER_LIMIT;

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      const profiles = await getProfiles(userId);
      // Add medication count to each profile
      const profilesWithCount = await Promise.all(
        profiles.map(async (p: any) => {
          try {
            const meds = await getMedications(p.id);
            return { ...p, medicationCount: meds.length };
          } catch {
            return { ...p, medicationCount: 0 };
          }
        })
      );
      setMembers(profilesWithCount);
    } catch (err) {
      console.error('Family load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectMember = async (member: FamilyMember) => {
    if (Platform.OS !== 'web') await Haptics.selectionAsync();
    setActiveProfile(member.id, member.name);
    try {
      const meds = await getMedications(member.id);
      setMedications(meds as any);
    } catch {}
  };

  const handleLongPress = (member: FamilyMember) => {
    if (member.is_primary) return; // Can't delete primary

    Alert.alert(
      'Manage member',
      `What would you like to do with ${member.name}'s profile?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View details',
          onPress: () =>
            router.push({
              pathname: '/family/member-detail',
              params: { id: member.id },
            }),
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => confirmDelete(member),
        },
      ]
    );
  };

  const confirmDelete = (member: FamilyMember) => {
    Alert.alert(
      'Remove member',
      `Remove ${member.name} and all their data from Nurvo?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProfile(member.id);
              deleteMember(member.id);
              if (activeProfileId === member.id) {
                const remaining = members.filter((m) => m.id !== member.id);
                if (remaining.length > 0) {
                  setActiveProfile(remaining[0].id, remaining[0].name);
                }
              }
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleAddMember = () => {
    if (reachedLimit) {
      setShowUpgrade(true);
      return;
    }
    router.push('/family/add-member');
  };

  const activeMember = members.find((m) => m.id === activeProfileId);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Family</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
          <Feather name="user-plus" size={18} color={theme.colors.surface} />
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Active profile banner */}
        {activeMember && (
          <View style={styles.activeBanner}>
            <View style={styles.activeBannerLeft}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBannerText}>
                Viewing <Text style={styles.activeName}>{activeMember.name}</Text>'s wellness
              </Text>
            </View>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/family/member-detail',
                  params: { id: activeMember.id },
                })
              }
            >
              <Text style={styles.manageLink}>Manage</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Member scroll */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Members</Text>
          {loading ? (
            <Text style={styles.loadingText}>Loading...</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.membersList}
            >
              {members.map((member) => (
                <FamilyCard
                  key={member.id}
                  member={member}
                  isActive={member.id === activeProfileId}
                  onPress={handleSelectMember}
                  onLongPress={handleLongPress}
                />
              ))}
              {/* Add member card */}
              <TouchableOpacity
                style={styles.addMemberCard}
                onPress={handleAddMember}
              >
                <View style={styles.addMemberIcon}>
                  <Feather
                    name="plus"
                    size={22}
                    color={reachedLimit ? theme.colors.textTertiary : theme.colors.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.addMemberText,
                    reachedLimit && styles.addMemberTextLocked,
                  ]}
                >
                  {reachedLimit ? 'Upgrade' : 'Add member'}
                </Text>
                {reachedLimit && (
                  <Text style={styles.addMemberHint}>Premium</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* Stats for active member */}
        {activeMember && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>
              {activeMember.name}'s overview
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>
                  {activeMember.medicationCount ?? 0}
                </Text>
                <Text style={styles.statLabel}>Medications</Text>
              </View>
              <TouchableOpacity
                style={[styles.statCard, styles.statCardAction]}
                onPress={() => router.push('/meds/add')}
              >
                <Feather
                  name="plus-circle"
                  size={22}
                  color={theme.colors.primary}
                />
                <Text style={[styles.statLabel, { color: theme.colors.primary }]}>
                  Add med
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statCard, styles.statCardAction]}
                onPress={() =>
                  router.push({
                    pathname: '/family/member-detail',
                    params: { id: activeMember.id },
                  })
                }
              >
                <Feather
                  name="edit-2"
                  size={22}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.statLabel}>Edit profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Premium upsell if on free plan */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => setShowUpgrade(true)}
          >
            <View style={styles.premiumLeft}>
              <Text style={styles.premiumEmoji}>⭐</Text>
              <View>
                <Text style={styles.premiumTitle}>Upgrade to Family Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unlimited members, caregiver alerts & more
                </Text>
              </View>
            </View>
            <Feather
              name="chevron-right"
              size={18}
              color={theme.colors.warning}
            />
          </TouchableOpacity>
        )}

        <Text style={styles.disclaimer}>
          Nurvo is a personal wellness organizer. Not a medical service. Always
          consult a qualified healthcare provider for medical decisions.
        </Text>
      </ScrollView>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="unlimited family members"
        reason={`Free plan includes up to ${FREE_MEMBER_LIMIT} members. Upgrade to add unlimited family members.`}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.surface,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 100,
    gap: theme.spacing.xl,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  activeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  activeBannerText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeName: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  manageLink: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  section: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    ...theme.typography.sectionHeader,
    color: theme.colors.textSecondary,
  },
  membersList: {
    gap: theme.spacing.md,
    paddingRight: theme.spacing.lg,
  },
  addMemberCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    width: 100,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    gap: theme.spacing.xs,
  },
  addMemberIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMemberText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  addMemberTextLocked: {
    color: theme.colors.textTertiary,
  },
  addMemberHint: {
    fontSize: 10,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
    ...theme.shadow,
  },
  statCardAction: {
    borderColor: theme.colors.primaryLight,
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textTertiary,
    fontWeight: '500',
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#F5D49A',
  },
  premiumLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  premiumEmoji: {
    fontSize: 24,
  },
  premiumTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  premiumSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  disclaimer: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import { useUserStore } from '../../store/userStore';
import { useMedStore } from '../../store/medStore';
import MedCard from '../../components/MedCard';
import StreakBadge from '../../components/StreakBadge';
import CompletionRitual from '../../components/CompletionRitual';
import {
  getTodaysDoses,
  logDose,
  getStreak,
  upsertStreak,
} from '../../lib/api';

const DAILY_TIPS = [
  'Drinking enough water helps medications absorb properly. Aim for 8 glasses a day.',
  'Taking medications at the same time each day helps build a lasting habit.',
  'Keep a list of all medications — including supplements — to share with your doctor.',
  'Store medications in a cool, dry place away from direct sunlight.',
  'Never stop taking a prescription medication without consulting your healthcare provider.',
  'Check expiration dates regularly. Dispose of expired medications safely.',
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { activeProfileId, activeProfileName } = useUserStore();
  const { todaysDoses, setTodaysDoses, updateDoseStatus } = useMedStore();
  const [streak, setStreak] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [showRitual, setShowRitual] = useState(false);
  const [allTaken, setAllTaken] = useState(false);
  const [loading, setLoading] = useState(true);

  const tip = DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length];

  const loadData = useCallback(async () => {
    if (!activeProfileId) return;
    try {
      const [doses, streakData] = await Promise.all([
        getTodaysDoses(activeProfileId),
        getStreak(activeProfileId),
      ]);
      setTodaysDoses(doses as any);
      setStreak(streakData?.current_streak ?? 0);
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeProfileId]);

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

  const handleTake = async (doseId: string) => {
    const dose = todaysDoses.find((d) => d.id === doseId);
    if (!dose || !activeProfileId) return;

    updateDoseStatus(doseId, 'taken');

    try {
      await logDose(
        dose.medication_id,
        activeProfileId,
        dose.scheduled_time,
        'taken'
      );

      const remainingPending = todaysDoses.filter(
        (d) => d.id !== doseId && d.status === 'pending'
      );
      const isAllTaken = remainingPending.length === 0;
      setAllTaken(isAllTaken);

      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setShowRitual(true);

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const newStreak = streak + (isAllTaken ? 1 : 0);
      if (isAllTaken) {
        setStreak(newStreak);
        await upsertStreak(activeProfileId, {
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, streak),
          last_active_date: today,
        });
      }
    } catch (err) {
      // Revert on error
      updateDoseStatus(doseId, 'pending');
    }
  };

  const handleSkip = async (doseId: string) => {
    const dose = todaysDoses.find((d) => d.id === doseId);
    if (!dose || !activeProfileId) return;
    updateDoseStatus(doseId, 'skipped');
    try {
      await logDose(
        dose.medication_id,
        activeProfileId,
        dose.scheduled_time,
        'skipped'
      );
    } catch {
      updateDoseStatus(doseId, 'pending');
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const pendingCount = todaysDoses.filter((d) => d.status === 'pending').length;
  const takenCount = todaysDoses.filter((d) => d.status === 'taken').length;
  const totalCount = todaysDoses.length;
  const progress = totalCount > 0 ? takenCount / totalCount : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.name}>{activeProfileName || 'there'}</Text>
          </View>
          <View style={styles.headerRight}>
            <StreakBadge streak={streak} size="md" />
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/onboarding/who')}
            >
              <Feather name="settings" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Progress Card */}
        {totalCount > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Today's doses</Text>
              <Text style={styles.progressCount}>
                {takenCount}/{totalCount}
              </Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressSubtext}>
              {pendingCount === 0
                ? '🎉 All doses taken today!'
                : `${pendingCount} dose${pendingCount !== 1 ? 's' : ''} remaining`}
            </Text>
          </View>
        )}

        {/* Today's Medications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/meds')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Loading...</Text>
            </View>
          ) : todaysDoses.length === 0 ? (
            <View style={styles.emptyCard}>
              <Feather name="check-circle" size={24} color={theme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>No doses scheduled</Text>
              <Text style={styles.emptyText}>
                Add medications to see your daily schedule here.
              </Text>
              <TouchableOpacity
                style={styles.addMedButton}
                onPress={() => router.push('/meds/add')}
              >
                <Text style={styles.addMedButtonText}>Add medication</Text>
              </TouchableOpacity>
            </View>
          ) : (
            todaysDoses.map((dose) => (
              <MedCard
                key={dose.id}
                dose={dose}
                onTake={handleTake}
                onSkip={handleSkip}
              />
            ))
          )}
        </View>

        {/* Daily Tip */}
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <Feather name="sun" size={16} color={theme.colors.warning} />
            <Text style={styles.tipLabel}>Wellness Tip</Text>
          </View>
          <Text style={styles.tipText}>{tip}</Text>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Nurvo is a personal wellness organizer. It is not a medical service
            and does not provide medical advice. Always consult a qualified
            healthcare provider for medical decisions.
          </Text>
        </View>
      </ScrollView>

      <CompletionRitual
        visible={showRitual}
        streak={streak}
        allTaken={allTaken}
        onClose={() => setShowRitual(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: 100,
    gap: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: theme.spacing.lg,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  name: {
    ...theme.typography.title,
    color: theme.colors.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  settingsButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
    ...theme.shadow,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  progressCount: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressSubtext: {
    fontSize: 13,
    color: theme.colors.textSecondary,
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
  seeAll: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  addMedButton: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.button,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  addMedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  tipCard: {
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#F5D49A',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 21,
  },
  disclaimerBox: {
    paddingTop: theme.spacing.sm,
  },
  disclaimerText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

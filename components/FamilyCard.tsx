import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { FamilyMember } from '../store/familyStore';

interface FamilyCardProps {
  member: FamilyMember;
  isActive: boolean;
  onPress: (member: FamilyMember) => void;
  onLongPress?: (member: FamilyMember) => void;
}

const AVATARS = ['🧑', '👩', '👴', '👵', '🧒', '👦', '👧', '🧓'];

export default function FamilyCard({
  member,
  isActive,
  onPress,
  onLongPress,
}: FamilyCardProps) {
  const avatarIndex =
    member.name.charCodeAt(0) % AVATARS.length;
  const avatar = AVATARS[avatarIndex];

  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={() => onPress(member)}
      onLongPress={() => onLongPress?.(member)}
      activeOpacity={0.8}
    >
      <View style={[styles.avatarWrapper, isActive && styles.avatarActive]}>
        <Text style={styles.avatarText}>{avatar}</Text>
      </View>

      <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
        {member.name}
      </Text>

      {member.relationship && (
        <Text style={styles.relationship} numberOfLines={1}>
          {member.relationship}
        </Text>
      )}

      {(member.medicationCount ?? 0) > 0 && (
        <View style={[styles.medBadge, isActive && styles.medBadgeActive]}>
          <Text
            style={[styles.medBadgeText, isActive && styles.medBadgeTextActive]}
          >
            {member.medicationCount} med
            {member.medicationCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {isActive && (
        <View style={styles.activeDot} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    width: 100,
    borderWidth: 2,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
    position: 'relative',
  },
  cardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  avatarWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActive: {
    backgroundColor: theme.colors.surface,
  },
  avatarText: {
    fontSize: 28,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  nameActive: {
    color: theme.colors.primary,
  },
  relationship: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },
  medBadge: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  medBadgeActive: {
    backgroundColor: theme.colors.primary,
  },
  medBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  medBadgeTextActive: {
    color: theme.colors.surface,
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
});

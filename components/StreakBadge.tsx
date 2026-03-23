import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function StreakBadge({ streak, size = 'md' }: StreakBadgeProps) {
  const sizes = {
    sm: { icon: 14, text: 12, padding: 6, borderRadius: 10 },
    md: { icon: 16, text: 14, padding: 8, borderRadius: 12 },
    lg: { icon: 20, text: 18, padding: 12, borderRadius: 16 },
  };
  const s = sizes[size];

  const getColor = () => {
    if (streak >= 30) return '#D4820A';
    if (streak >= 7) return theme.colors.primary;
    return theme.colors.textTertiary;
  };

  const getBg = () => {
    if (streak >= 30) return theme.colors.warningLight;
    if (streak >= 7) return theme.colors.primaryLight;
    return theme.colors.border;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBg(),
          paddingHorizontal: s.padding + 4,
          paddingVertical: s.padding - 2,
          borderRadius: s.borderRadius,
        },
      ]}
    >
      <Text style={{ fontSize: s.icon, marginRight: 4 }}>🔥</Text>
      <Text style={[styles.text, { fontSize: s.text, color: getColor() }]}>
        {streak} day{streak !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '700',
  },
});

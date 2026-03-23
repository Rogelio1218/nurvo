import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { InteractionResult } from '../lib/interactions';

interface DrugInteractionAlertProps {
  interactions: InteractionResult[];
  onDismiss: () => void;
}

export default function DrugInteractionAlert({
  interactions,
  onDismiss,
}: DrugInteractionAlertProps) {
  if (interactions.length === 0) return null;

  const hasSevere = interactions.some((i) => i.severity === 'severe');
  const bgColor = hasSevere ? theme.colors.dangerLight : theme.colors.warningLight;
  const borderColor = hasSevere ? theme.colors.danger : theme.colors.warning;
  const textColor = hasSevere ? theme.colors.danger : theme.colors.warning;
  const icon = hasSevere ? 'alert-octagon' : 'alert-triangle';

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.header}>
        <Feather name={icon as any} size={18} color={textColor} />
        <Text style={[styles.title, { color: textColor }]}>
          {hasSevere ? 'Potential interaction detected' : 'Interaction note'}
        </Text>
        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Feather name="x" size={16} color={textColor} />
        </TouchableOpacity>
      </View>

      {interactions.map((interaction, i) => (
        <View key={i} style={styles.interactionItem}>
          <Text style={[styles.meds, { color: textColor }]}>
            {interaction.medication1} + {interaction.medication2}
          </Text>
          <Text style={styles.description}>{interaction.description}</Text>
          <Text style={styles.recommendation}>{interaction.recommendation}</Text>
        </View>
      ))}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          This is general wellness information only. Always consult your
          healthcare provider before changing medications.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.radius.card,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginVertical: theme.spacing.md,
    gap: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  dismissButton: {
    padding: 4,
  },
  interactionItem: {
    gap: theme.spacing.xs,
  },
  meds: {
    fontSize: 13,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  recommendation: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  disclaimer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: theme.spacing.md,
  },
  disclaimerText: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    lineHeight: 16,
  },
});

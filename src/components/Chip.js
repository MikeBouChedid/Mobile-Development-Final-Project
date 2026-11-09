import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

// Small selectable pill, used for filters and options
export default function Chip({ label, selected = false, disabled = false, onPress, style }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled, style]}
    >
      <Text style={[styles.text, selected && styles.selectedText, disabled && styles.disabledText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { backgroundColor: '#F0F1F4' },
  text: { fontSize: 14, color: colors.text, fontWeight: '500' },
  selectedText: { color: colors.white },
  disabledText: { color: '#A3A8B3', textDecorationLine: 'line-through' },
});

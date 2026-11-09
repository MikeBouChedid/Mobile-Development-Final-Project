import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius } from '../theme';

// Reusable button. variant: "primary" | "outline" | "danger" | "light"
export default function AppButton({ title, onPress, variant = 'primary', disabled = false, loading = false, style }) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && styles.outlineText, variant === 'light' && styles.lightText]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.primary },
  danger: { backgroundColor: colors.danger },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.primary },
  light: { backgroundColor: colors.primaryLight },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.45 },
  text: { color: colors.white, fontSize: 16, fontWeight: '700' },
  outlineText: { color: colors.primary },
  lightText: { color: colors.primary },
});

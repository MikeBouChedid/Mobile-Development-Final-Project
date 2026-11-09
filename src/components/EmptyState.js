import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AppButton from './AppButton';
import { colors } from '../theme';

// Shown when a list has nothing to display
export default function EmptyState({ emoji, title, subtitle, actionTitle, onAction }) {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionTitle && <AppButton title={actionTitle} onPress={onAction} style={styles.button} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 40 },
  emoji: { fontSize: 56, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 6 },
  button: { marginTop: 20, alignSelf: 'stretch' },
});

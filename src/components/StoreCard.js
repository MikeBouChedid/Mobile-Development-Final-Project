import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import OpenBadge from './OpenBadge';
import Icon from './Icon';
import { colors, radius, shadow } from '../theme';

export default function StoreCard({ store, open, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      <View style={[styles.logo, { backgroundColor: store.color }]}>
        <Text style={styles.logoText}>{store.logo}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{store.name}</Text>
        <Text style={styles.category}>{store.category}</Text>
        <View style={styles.metaRow}>
          <Icon name="time-outline" size={14} color={colors.muted} />
          <Text style={styles.meta}> ~{store.prepTime} min prep</Text>
          <Text style={styles.meta}>  ·  {store.openingHours.open}–{store.openingHours.close}</Text>
        </View>
      </View>

      <View style={styles.right}>
        <OpenBadge open={open} />
        <Icon name="chevron-forward" size={20} color={colors.muted} style={{ marginTop: 14 }} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    ...shadow,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 30 },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16.5, fontWeight: '700', color: colors.text },
  category: { fontSize: 13, color: colors.primary, fontWeight: '600', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  meta: { fontSize: 12.5, color: colors.muted },
  right: { alignItems: 'flex-end' },
});

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

// Green "Open" / red "Closed" badge
export default function OpenBadge({ open }) {
  return (
    <View style={[styles.badge, open ? styles.open : styles.closed]}>
      <View style={[styles.dot, { backgroundColor: open ? colors.success : colors.danger }]} />
      <Text style={[styles.text, { color: open ? colors.success : colors.danger }]}>{open ? 'Open' : 'Closed'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  open: { backgroundColor: colors.successLight },
  closed: { backgroundColor: colors.dangerLight },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  text: { fontSize: 12, fontWeight: '700' },
});

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { money } from '../utils/pricing';
import { colors, radius } from '../theme';

// One product inside the store menu. Out-of-stock products are shown
// greyed out and the "+" button is replaced by a label.
export default function ProductRow({ product, onPress, onQuickAdd }) {
  const outOfStock = !product.inStock;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}>
      <View style={[styles.image, outOfStock && styles.faded]}>
        <Text style={styles.emoji}>{product.emoji}</Text>
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, outOfStock && styles.mutedText]}>{product.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        <Text style={[styles.price, outOfStock && styles.mutedText]}>{money(product.price)}</Text>
      </View>

      {outOfStock ? (
        <View style={styles.outBadge}>
          <Text style={styles.outText}>Out of stock</Text>
        </View>
      ) : (
        <Pressable onPress={onQuickAdd} style={styles.addButton} hitSlop={8}>
          <Icon name="add" size={22} color={colors.white} />
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
    marginHorizontal: 16,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: '#F6F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faded: { opacity: 0.4 },
  emoji: { fontSize: 32 },
  info: { flex: 1, marginHorizontal: 12 },
  name: { fontSize: 15.5, fontWeight: '700', color: colors.text },
  description: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },
  mutedText: { color: colors.muted },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outBadge: { backgroundColor: colors.dangerLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  outText: { color: colors.danger, fontSize: 11, fontWeight: '700' },
});

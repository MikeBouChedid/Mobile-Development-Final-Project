import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { useApp } from '../context/AppContext';
import { cartCount } from '../utils/pricing';
import { colors } from '../theme';

// Cart icon with a badge showing the number of items (used in headers)
export default function CartButton({ onPress, color = colors.primary }) {
  const { cart } = useApp();
  const count = cartCount(cart.items);

  return (
    <Pressable onPress={onPress} style={styles.button} hitSlop={10}>
      <Icon name="cart-outline" size={26} color={color} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { padding: 4 },
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: '700' },
});

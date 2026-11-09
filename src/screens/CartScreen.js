// Screen 5 (a): Cart – items, quantities and totals
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import AppButton from '../components/AppButton';
import EmptyState from '../components/EmptyState';
import QuantitySelector from '../components/QuantitySelector';
import Icon from '../components/Icon';
import OpenBadge from '../components/OpenBadge';
import { useApp } from '../context/AppContext';
import { allStores } from '../api/campusApi';
import { isStoreOpen } from '../utils/time';
import { cartSubtotal, FREE_DELIVERY_FROM, getDeliveryFee, MIN_ORDER, money, round2 } from '../utils/pricing';
import { confirmAction } from '../utils/dialogs';
import { colors, radius, shadow } from '../theme';

export default function CartScreen({ navigation }) {
  const { cart, changeQty, removeFromCart, clearCart, now } = useApp();

  if (cart.items.length === 0) {
    return (
      <View style={styles.screen}>
        <EmptyState
          emoji="🛒"
          title="Your cart is empty"
          subtitle="Add products from a campus store or order a printing job."
          actionTitle="Browse stores"
          onAction={() => navigation.navigate('Home')}
        />
      </View>
    );
  }

  const store = allStores.find((s) => s.id === cart.storeId);
  const open = isStoreOpen(store, now);
  const subtotal = cartSubtotal(cart.items);
  const fee = getDeliveryFee(subtotal);
  const total = round2(subtotal + fee);
  const belowMinimum = subtotal < MIN_ORDER;
  const missingForFree = round2(FREE_DELIVERY_FROM - subtotal);

  const handleClear = () => {
    confirmAction('Empty cart?', 'All the items will be removed from your cart.', clearCart, 'Empty');
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.itemImage}>
        <Text style={styles.itemEmoji}>{item.emoji}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.name}
        </Text>
        {item.optionsLabel ? <Text style={styles.itemOptions}>{item.optionsLabel}</Text> : null}
        <Text style={styles.itemPrice}>{money(item.unitPrice * item.qty)}</Text>
      </View>
      <View style={styles.itemActions}>
        <Pressable onPress={() => removeFromCart(item.key)} hitSlop={10} style={styles.remove}>
          <Icon name="trash-outline" size={19} color={colors.danger} />
        </Pressable>
        <QuantitySelector small value={item.qty} min={0} max={20} onChange={(v) => changeQty(item.key, v - item.qty)} />
      </View>
    </View>
  );

  const header = (
    <View style={styles.storeRow}>
      <Text style={styles.storeName}>
        {store.logo} {store.name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <OpenBadge open={open} />
        <Pressable onPress={handleClear} hitSlop={8}>
          <Text style={styles.clear}>Clear</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={cart.items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{money(subtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Delivery fee</Text>
          <Text style={[styles.summaryValue, fee === 0 && { color: colors.success }]}>{fee === 0 ? 'FREE' : money(fee)}</Text>
        </View>
        {fee > 0 && (
          <Text style={styles.hint}>Add {money(missingForFree)} more for free delivery.</Text>
        )}
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{money(total)}</Text>
        </View>

        {belowMinimum && <Text style={styles.warning}>Minimum order is {money(MIN_ORDER)}.</Text>}
        {!open && <Text style={styles.warning}>{store.name} is closed now, you cannot check out.</Text>}

        <AppButton
          title="Choose delivery & pay"
          onPress={() => navigation.navigate('Checkout')}
          disabled={belowMinimum || !open}
          style={{ marginTop: 10 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  storeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  storeName: { fontSize: 18, fontWeight: '700', color: colors.text },
  clear: { color: colors.danger, fontWeight: '700', marginLeft: 12 },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    marginBottom: 10,
    ...shadow,
  },
  itemImage: {
    width: 54,
    height: 54,
    borderRadius: radius.sm,
    backgroundColor: '#F6F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: { fontSize: 28 },
  itemInfo: { flex: 1, marginHorizontal: 12 },
  itemName: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemOptions: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 4 },
  itemActions: { alignItems: 'flex-end', justifyContent: 'space-between' },
  remove: { marginBottom: 8 },
  summary: {
    backgroundColor: colors.white,
    padding: 16,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    ...shadow,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { color: colors.muted, fontSize: 14.5 },
  summaryValue: { color: colors.text, fontSize: 14.5, fontWeight: '600' },
  hint: { color: colors.success, fontSize: 12.5, marginBottom: 6 },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 2 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 19, fontWeight: '800', color: colors.primary },
  warning: { color: colors.danger, fontWeight: '600', fontSize: 13, marginTop: 4 },
});

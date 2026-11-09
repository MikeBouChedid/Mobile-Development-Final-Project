// Screen 7 (a): Orders history with filters and reorder
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { allProducts, allStores } from '../api/campusApi';
import { formatDateTime } from '../utils/time';
import { money } from '../utils/pricing';
import { confirmAction, showMessage } from '../utils/dialogs';
import { colors, radius, shadow } from '../theme';

const STATUS_FILTERS = ['All', 'Active', 'Delivered', 'Cancelled'];

const STATUS_COLORS = {
  Received: colors.primary,
  Preparing: colors.warning,
  'On the way': colors.warning,
  Delivered: colors.success,
  Cancelled: colors.danger,
};

export default function OrdersScreen({ navigation }) {
  const { orders, cart, reorder } = useApp();
  const [statusFilter, setStatusFilter] = useState('All');
  const [storeFilter, setStoreFilter] = useState('all');

  const filtered = orders.filter((order) => {
    const isActive = order.status !== 'Delivered' && order.status !== 'Cancelled';
    const statusOk =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && isActive) ||
      order.status === statusFilter;
    const storeOk = storeFilter === 'all' || order.storeId === storeFilter;
    return statusOk && storeOk;
  });

  const handleReorder = (order) => {
    // products that are out of stock today are skipped
    const available = order.items.filter((item) => {
      if (item.productId === 'print') return true;
      const product = allProducts.find((p) => p.id === item.productId);
      return product && product.inStock;
    });
    if (available.length === 0) {
      showMessage('Cannot reorder', 'None of these products is available right now.');
      return;
    }

    const doReorder = () => {
      reorder({ ...order, items: available });
      navigation.navigate('Cart');
      if (available.length < order.items.length) {
        showMessage('Some items skipped', 'Out-of-stock products were not added to the cart.');
      }
    };

    if (cart.items.length > 0) {
      confirmAction('Replace your cart?', 'Your current cart will be emptied and replaced by this order.', doReorder, 'Replace');
    } else {
      doReorder();
    }
  };

  const renderOrder = ({ item: order }) => {
    const itemCount = order.items.reduce((sum, i) => sum + i.qty, 0);
    const statusColor = STATUS_COLORS[order.status];
    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate('Tracking', { orderId: order.id })}>
        <View style={styles.cardTop}>
          <Text style={styles.logo}>{order.storeLogo}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.store}>{order.storeName}</Text>
            <Text style={styles.date}>{formatDateTime(order.createdAt)}</Text>
          </View>
          <View style={[styles.status, { backgroundColor: `${statusColor}1A` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{order.status}</Text>
          </View>
        </View>

        <Text style={styles.items} numberOfLines={1}>
          {order.items.map((i) => `${i.qty}× ${i.name}`).join(', ')}
        </Text>

        <View style={styles.cardBottom}>
          <Text style={styles.total}>
            {money(order.total)} · {itemCount} item{itemCount > 1 ? 's' : ''}
          </Text>
          {order.rating && (
            <Text style={styles.rating}>
              {'★'.repeat(order.rating.stars)}
              {'☆'.repeat(5 - order.rating.stars)}
            </Text>
          )}
          <Pressable style={styles.reorder} onPress={() => handleReorder(order)} hitSlop={6}>
            <Icon name="refresh" size={16} color={colors.primary} />
            <Text style={styles.reorderText}> Reorder</Text>
          </Pressable>
        </View>
      </Pressable>
    );
  };

  const header = (
    <View>
      <FlatList
        horizontal
        data={STATUS_FILTERS}
        keyExtractor={(s) => s}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <Chip label={item} selected={statusFilter === item} onPress={() => setStatusFilter(item)} />}
      />
      <FlatList
        horizontal
        data={[{ id: 'all', name: 'All stores', logo: '🏫' }, ...allStores]}
        keyExtractor={(s) => s.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Chip label={`${item.logo} ${item.name}`} selected={storeFilter === item.id} onPress={() => setStoreFilter(item.id)} />
        )}
      />
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={filtered}
      keyExtractor={(o) => o.id}
      renderItem={renderOrder}
      ListHeaderComponent={header}
      ListEmptyComponent={
        orders.length === 0 ? (
          <EmptyState
            emoji="🧾"
            title="No orders yet"
            subtitle="Your orders will appear here."
            actionTitle="Start ordering"
            onAction={() => navigation.navigate('Home')}
          />
        ) : (
          <EmptyState emoji="🔍" title="No order matches these filters" />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginTop: 4, marginBottom: 10, ...shadow },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  logo: { fontSize: 30, marginRight: 12 },
  store: { fontSize: 16, fontWeight: '700', color: colors.text },
  date: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  status: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontWeight: '700', fontSize: 12 },
  items: { color: colors.text, marginTop: 10, fontSize: 13.5 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  total: { fontWeight: '800', color: colors.primary, fontSize: 15 },
  rating: { color: colors.accent, fontSize: 14 },
  reorder: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  reorderText: { color: colors.primary, fontWeight: '700' },
});

// Screen 6: Order tracking
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import AppButton from '../components/AppButton';
import Section from '../components/Section';
import StarRating from '../components/StarRating';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import { ORDER_STATUSES, useApp } from '../context/AppContext';
import { formatDateTime, formatTime, slotLabel } from '../utils/time';
import { money } from '../utils/pricing';
import { confirmAction, showMessage } from '../utils/dialogs';
import { colors, radius } from '../theme';

const STATUS_ICONS = {
  Received: 'receipt-outline',
  Preparing: 'restaurant-outline',
  'On the way': 'bicycle-outline',
  Delivered: 'checkmark-done-outline',
};

export default function TrackingScreen({ route, navigation }) {
  const { orderId } = route.params;
  const { orders, cancelOrder, rateOrder } = useApp();
  const order = orders.find((o) => o.id === orderId);

  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [secondsAgo, setSecondsAgo] = useState(0);

  const lastUpdate = order ? order.statusHistory[order.statusHistory.length - 1].at : null;

  // "Updated X s ago": a timer that ticks every second while the screen is
  // open. The cleanup function stops the timer when we leave the screen
  // or when the status changes.
  useEffect(() => {
    if (!lastUpdate) return;
    const tick = () => setSecondsAgo(Math.floor((Date.now() - new Date(lastUpdate).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastUpdate]);

  if (!order) {
    return <EmptyState emoji="🤷" title="Order not found" />;
  }

  const cancelled = order.status === 'Cancelled';
  const delivered = order.status === 'Delivered';
  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const destination = `${order.building.name}, Room ${order.room}`;

  // time at which each status was reached (if reached)
  const reachedAt = (status) => {
    const entry = order.statusHistory.find((h) => h.status === status);
    return entry ? formatTime(new Date(entry.at)) : null;
  };

  const handleCancel = () => {
    confirmAction(
      'Cancel order?',
      order.paymentMethod === 'wallet' ? `${money(order.total)} will be refunded to your wallet.` : 'Your order will be cancelled.',
      () => {
        const ok = cancelOrder(order.id);
        if (!ok) showMessage('Too late', 'The store already started preparing your order.');
      },
      'Cancel order'
    );
  };

  const handleRate = () => {
    if (stars === 0) {
      showMessage('Rating', 'Choose between 1 and 5 stars.');
      return;
    }
    rateOrder(order.id, stars, comment);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ---------- Header ---------- */}
      <View style={[styles.hero, cancelled && styles.heroCancelled, delivered && styles.heroDelivered]}>
        <Text style={styles.heroEmoji}>{cancelled ? '❌' : delivered ? '🎉' : order.storeLogo}</Text>
        <Text style={styles.heroTitle}>
          {cancelled ? 'Order cancelled' : delivered ? 'Delivered!' : order.status}
        </Text>
        <Text style={styles.heroSub}>
          Order {order.id} · {order.storeName}
        </Text>
        {!cancelled && !delivered && <Text style={styles.live}>● Live · updated {secondsAgo}s ago</Text>}
      </View>

      {/* ---------- Timeline ---------- */}
      {!cancelled && (
        <Section title="Status">
          {ORDER_STATUSES.map((status, index) => {
            const done = index <= currentIndex;
            const isLast = index === ORDER_STATUSES.length - 1;
            const label = status === 'Delivered' ? `Delivered to ${destination}` : status;
            return (
              <View key={status} style={styles.step}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepIcon, done && styles.stepIconDone, index === currentIndex && styles.stepIconCurrent]}>
                    <Icon name={STATUS_ICONS[status]} size={18} color={done ? colors.white : colors.muted} />
                  </View>
                  {!isLast && <View style={[styles.stepLine, index < currentIndex && styles.stepLineDone]} />}
                </View>
                <View style={styles.stepText}>
                  <Text style={[styles.stepTitle, !done && styles.stepTitleTodo]}>{label}</Text>
                  <Text style={styles.stepTime}>{reachedAt(status) || 'Pending'}</Text>
                </View>
              </View>
            );
          })}
        </Section>
      )}

      {/* ---------- Delivery info ---------- */}
      <Section title="Delivery">
        <InfoRow icon="location-outline" label="Deliver to" value={destination} />
        <InfoRow icon="time-outline" label="Estimated delivery" value={`Break ${slotLabel(order.slot)}`} />
        <InfoRow icon="person-outline" label="Courier" value={order.courier} />
        <InfoRow
          icon={order.paymentMethod === 'wallet' ? 'wallet-outline' : 'cash-outline'}
          label="Payment"
          value={order.paymentMethod === 'wallet' ? 'Campus Wallet (paid)' : `Cash on delivery (${money(order.total)})`}
        />
        <InfoRow icon="calendar-outline" label="Ordered" value={formatDateTime(order.createdAt)} />
      </Section>

      {/* ---------- Items ---------- */}
      <Section title="Items">
        {order.items.map((item) => (
          <View key={item.key} style={styles.itemRow}>
            <Text style={styles.itemName}>
              {item.qty} × {item.name}
              {item.optionsLabel ? <Text style={styles.itemOptions}>{`\n${item.optionsLabel}`}</Text> : null}
            </Text>
            <Text style={styles.itemPrice}>{money(item.unitPrice * item.qty)}</Text>
          </View>
        ))}
        <View style={[styles.itemRow, styles.divider]}>
          <Text style={styles.muted}>Delivery fee</Text>
          <Text style={styles.itemPrice}>{order.deliveryFee === 0 ? 'FREE' : money(order.deliveryFee)}</Text>
        </View>
        <View style={styles.itemRow}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total}>{money(order.total)}</Text>
        </View>
      </Section>

      {/* ---------- Cancel: only while "Received" ---------- */}
      {order.status === 'Received' && (
        <AppButton title="Cancel order" variant="danger" onPress={handleCancel} style={{ marginBottom: 14 }} />
      )}

      {/* ---------- Rating: only after delivery ---------- */}
      {delivered && !order.rating && (
        <Section title="Rate your order">
          <StarRating value={stars} onChange={setStars} size={34} />
          <TextInput
            style={styles.comment}
            placeholder="Leave a comment (optional)"
            placeholderTextColor={colors.muted}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <AppButton title="Submit rating" onPress={handleRate} />
        </Section>
      )}
      {order.rating && (
        <Section title="Your rating">
          <StarRating value={order.rating.stars} size={26} />
          {order.rating.comment ? <Text style={styles.ratingComment}>“{order.rating.comment}”</Text> : null}
        </Section>
      )}

      <AppButton title="Back to home" variant="outline" onPress={() => navigation.navigate('Tabs', { screen: 'Home' }, { pop: true })} />
    </ScrollView>
  );
}

// small component used only in this screen
function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <Icon name={icon} size={20} color={colors.primary} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 20,
    alignItems: 'center',
    marginBottom: 14,
  },
  heroCancelled: { backgroundColor: colors.danger },
  heroDelivered: { backgroundColor: colors.success },
  heroEmoji: { fontSize: 42 },
  heroTitle: { color: colors.white, fontSize: 24, fontWeight: '800', marginTop: 6 },
  heroSub: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  live: { color: colors.accent, marginTop: 8, fontWeight: '700', fontSize: 12.5 },
  step: { flexDirection: 'row' },
  stepLeft: { alignItems: 'center', width: 36 },
  stepIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E8EBF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: { backgroundColor: colors.success },
  stepIconCurrent: { backgroundColor: colors.primary },
  stepLine: { width: 3, flex: 1, minHeight: 22, backgroundColor: '#E8EBF0', marginVertical: 2 },
  stepLineDone: { backgroundColor: colors.success },
  stepText: { flex: 1, marginLeft: 12, paddingBottom: 18, paddingTop: 6 },
  stepTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  stepTitleTodo: { color: colors.muted, fontWeight: '500' },
  stepTime: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoLabel: { fontSize: 12, color: colors.muted },
  infoValue: { fontSize: 15, color: colors.text, fontWeight: '600' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  itemName: { flex: 1, color: colors.text, marginRight: 10 },
  itemOptions: { color: colors.muted, fontSize: 12.5 },
  itemPrice: { color: colors.text, fontWeight: '600' },
  divider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8 },
  muted: { color: colors.muted },
  total: { fontSize: 17, fontWeight: '800', color: colors.primary },
  comment: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    minHeight: 80,
    marginVertical: 12,
    textAlignVertical: 'top',
    color: colors.text,
  },
  ratingComment: { marginTop: 8, color: colors.text, fontStyle: 'italic' },
});

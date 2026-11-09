// Screen 5 (b): Checkout – where, when and how to pay
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import FormInput from '../components/FormInput';
import Section from '../components/Section';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { allStores, getBuildings, getDeliverySlots } from '../api/campusApi';
import { getSlotStatus, slotLabel } from '../utils/time';
import { cartSubtotal, getDeliveryFee, money, round2 } from '../utils/pricing';
import { confirmAction, showMessage } from '../utils/dialogs';
import { colors, radius } from '../theme';

export default function CheckoutScreen({ navigation }) {
  const { cart, wallet, savedLocations, addLocation, placeOrder, now } = useApp();
  const store = allStores.find((s) => s.id === cart.storeId);
  const insets = useSafeAreaInsets();

  const [buildings, setBuildings] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const [buildingId, setBuildingId] = useState(null);
  const [room, setRoom] = useState('');
  const [saveLocation, setSaveLocation] = useState(false);
  const [slot, setSlot] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);

  // load buildings and slots from the (mock) API at the same time
  useEffect(() => {
    const load = async () => {
      const [buildingData, slotData] = await Promise.all([getBuildings(), getDeliverySlots()]);
      setBuildings(buildingData);
      setSlots(slotData);
      setLoading(false);
    };
    load();
  }, []);

  // if the selected slot becomes unavailable while the screen is open, unselect it
  useEffect(() => {
    if (slot && store && !getSlotStatus(slot, now, store.prepTime).available) setSlot(null);
  }, [now]);

  if (!store) {
    // cart was emptied (e.g. after placing the order)
    return null;
  }

  const subtotal = cartSubtotal(cart.items);
  const fee = getDeliveryFee(subtotal);
  const total = round2(subtotal + fee);
  const walletTooLow = wallet.balance < total;
  const building = buildings.find((b) => b.id === buildingId);

  const pickSavedLocation = (location) => {
    setBuildingId(location.buildingId);
    setRoom(location.room);
    setErrors({});
  };

  const validate = () => {
    const e = {};
    if (!buildingId) e.building = 'Choose a building';
    if (!room.trim()) e.room = 'Room number is required';
    if (!slot) e.slot = 'Choose a delivery slot';
    if (paymentMethod === 'wallet' && walletTooLow) e.payment = 'Insufficient wallet balance. Top up or pay cash.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submitOrder = () => {
    setPlacing(true);
    const result = placeOrder({ buildingId, room, slot, paymentMethod });
    setPlacing(false);

    if (result.error) {
      showMessage('Order not placed', result.error);
      return;
    }
    if (saveLocation) {
      const alreadySaved = savedLocations.some((l) => l.buildingId === buildingId && l.room === room.trim());
      if (!alreadySaved) addLocation({ label: `${building.name.split(' – ')[0]}, Room ${room.trim()}`, buildingId, room: room.trim() });
    }
    // replace checkout by tracking, so "back" does not return to an empty checkout
    navigation.replace('Tracking', { orderId: result.order.id });
  };

  const handleConfirm = () => {
    if (!validate()) return;
    confirmAction(
      'Confirm your order',
      `${store.name} · ${money(total)}\n` +
        `Deliver to ${building.name}, Room ${room.trim()}\n` +
        `Break: ${slotLabel(slot)}\n` +
        `Payment: ${paymentMethod === 'wallet' ? 'Campus Wallet' : 'Cash on delivery'}`,
      submitOrder,
      'Place order'
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ---------- Location ---------- */}
        <Section title="📍 Delivery location">
          {savedLocations.length > 0 && (
            <>
              <Text style={styles.label}>Saved locations</Text>
              <View style={styles.chips}>
                {savedLocations.map((l) => (
                  <Chip
                    key={l.id}
                    label={l.label}
                    selected={l.buildingId === buildingId && l.room === room}
                    onPress={() => pickSavedLocation(l)}
                  />
                ))}
              </View>
            </>
          )}

          <Text style={styles.label}>Building</Text>
          <View style={styles.chips}>
            {buildings.map((b) => (
              <Chip key={b.id} label={b.name} selected={buildingId === b.id} onPress={() => setBuildingId(b.id)} />
            ))}
          </View>
          {errors.building && <Text style={styles.error}>{errors.building}</Text>}

          <FormInput
            label="Room number"
            placeholder="e.g. 204"
            value={room}
            onChangeText={setRoom}
            error={errors.room}
            style={{ marginTop: 8 }}
          />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Save this location to my profile</Text>
            <Switch
              value={saveLocation}
              onValueChange={setSaveLocation}
              trackColor={{ true: colors.primary }}
            />
          </View>
        </Section>

        {/* ---------- Time ---------- */}
        <Section title="⏰ Delivery time (class break)">
          <Text style={styles.hint}>
            {store.name} needs ~{store.prepTime} min to prepare your order. Slots that are passed or too close are
            disabled.
          </Text>
          {slots.map((s) => {
            const status = getSlotStatus(s, now, store.prepTime);
            const selected = slot && slot.id === s.id;
            return (
              <Pressable
                key={s.id}
                disabled={!status.available}
                onPress={() => setSlot(s)}
                style={[styles.slot, selected && styles.slotSelected, !status.available && styles.slotDisabled]}
              >
                <Icon
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={status.available ? colors.primary : colors.muted}
                />
                <Text style={[styles.slotText, !status.available && styles.slotTextDisabled]}>{slotLabel(s)}</Text>
                {!status.available && <Text style={styles.slotReason}>{status.reason}</Text>}
              </Pressable>
            );
          })}
          {errors.slot && <Text style={styles.error}>{errors.slot}</Text>}
        </Section>

        {/* ---------- Payment ---------- */}
        <Section title="💳 Payment">
          <Pressable
            style={[styles.payment, paymentMethod === 'wallet' && styles.paymentSelected]}
            onPress={() => setPaymentMethod('wallet')}
          >
            <Icon name="wallet-outline" size={24} color={colors.primary} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Campus Wallet</Text>
              <Text style={[styles.paymentSub, walletTooLow && { color: colors.danger }]}>
                Balance: {money(wallet.balance)}
                {walletTooLow ? ' – not enough' : ''}
              </Text>
            </View>
            <Icon name={paymentMethod === 'wallet' ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={colors.primary} />
          </Pressable>
          <Pressable
            style={[styles.payment, paymentMethod === 'cash' && styles.paymentSelected]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Icon name="cash-outline" size={24} color={colors.primary} />
            <View style={styles.paymentInfo}>
              <Text style={styles.paymentTitle}>Cash on delivery</Text>
              <Text style={styles.paymentSub}>Pay the courier in class</Text>
            </View>
            <Icon name={paymentMethod === 'cash' ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={colors.primary} />
          </Pressable>
          {errors.payment && (
            <View style={styles.paymentError}>
              <Text style={styles.error}>{errors.payment}</Text>
              <Pressable onPress={() => navigation.navigate('Wallet')}>
                <Text style={styles.link}>Top up</Text>
              </Pressable>
            </View>
          )}
        </Section>

        {/* ---------- Summary ---------- */}
        <Section title="🧾 Order summary">
          {cart.items.map((item) => (
            <View key={item.key} style={styles.summaryRow}>
              <Text style={styles.summaryItem} numberOfLines={1}>
                {item.qty} × {item.name}
              </Text>
              <Text style={styles.summaryValue}>{money(item.unitPrice * item.qty)}</Text>
            </View>
          ))}
          <View style={[styles.summaryRow, styles.divider]}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>{money(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={styles.summaryValue}>{fee === 0 ? 'FREE' : money(fee)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.divider]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(total)}</Text>
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <AppButton title={`Place order · ${money(total)}`} onPress={handleConfirm} loading={placing} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 30 },
  label: { fontWeight: '600', color: colors.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  error: { color: colors.danger, fontSize: 12.5, marginBottom: 6 },
  hint: { color: colors.muted, fontSize: 13, marginBottom: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { color: colors.text, flex: 1 },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: 8,
  },
  slotSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  slotDisabled: { backgroundColor: '#F3F4F6' },
  slotText: { marginLeft: 10, fontSize: 15.5, fontWeight: '600', color: colors.text, flex: 1 },
  slotTextDisabled: { color: colors.muted, textDecorationLine: 'line-through' },
  slotReason: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginBottom: 10,
  },
  paymentSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  paymentInfo: { flex: 1, marginLeft: 12 },
  paymentTitle: { fontWeight: '700', fontSize: 15, color: colors.text },
  paymentSub: { color: colors.muted, fontSize: 13, marginTop: 2 },
  paymentError: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  link: { color: colors.primary, fontWeight: '700', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryItem: { flex: 1, color: colors.text, marginRight: 10 },
  summaryLabel: { color: colors.muted },
  summaryValue: { color: colors.text, fontWeight: '600' },
  divider: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 19, fontWeight: '800', color: colors.primary },
  footer: { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
});

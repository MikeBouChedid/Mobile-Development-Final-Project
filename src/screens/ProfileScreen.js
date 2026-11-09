// Screen 7 (b): Profile – personal info, saved locations, wallet shortcut
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import FormInput from '../components/FormInput';
import Section from '../components/Section';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { allBuildings } from '../api/campusApi';
import { money } from '../utils/pricing';
import { confirmAction } from '../utils/dialogs';
import { colors, radius } from '../theme';

// Times offered by the demo clock (useful for the presentation)
const DEMO_TIMES = ['07:45', '09:00', '11:00', '12:30', '15:30', '17:30'];

export default function ProfileScreen({ navigation }) {
  const { user, wallet, orders, savedLocations, addLocation, removeLocation, logout, demoTime, setDemoTime } = useApp();

  const [modalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [buildingId, setBuildingId] = useState(null);
  const [room, setRoom] = useState('');
  const [errors, setErrors] = useState({});

  const initials = user.fullName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

  const openModal = () => {
    setLabel('');
    setBuildingId(null);
    setRoom('');
    setErrors({});
    setModalVisible(true);
  };

  const saveLocation = () => {
    const e = {};
    if (!label.trim()) e.label = 'Give this place a name (e.g. My Lab)';
    if (!buildingId) e.building = 'Choose a building';
    if (!room.trim()) e.room = 'Room number is required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const building = allBuildings.find((b) => b.id === buildingId);
    addLocation({
      label: `${label.trim()} – ${building.name.split(' – ')[0]}, Room ${room.trim()}`,
      buildingId,
      room: room.trim(),
    });
    setModalVisible(false);
  };

  const handleLogout = () => {
    confirmAction('Log out?', 'Your cart, wallet and orders stay saved on this phone.', logout, 'Log out');
  };

  const header = (
    <View>
      {/* ---------- User card ---------- */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      <Section title="My information">
        <InfoRow label="Student / Staff ID" value={user.universityId} />
        <InfoRow label="Faculty" value={user.faculty} />
        <InfoRow label="Phone" value={user.phone} />
        <InfoRow label="Delivered orders" value={String(deliveredCount)} />
      </Section>

      {/* ---------- Wallet shortcut ---------- */}
      <Pressable style={styles.wallet} onPress={() => navigation.navigate('Wallet')}>
        <Icon name="wallet" size={28} color={colors.white} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.walletLabel}>Campus Wallet</Text>
          <Text style={styles.walletBalance}>{money(wallet.balance)}</Text>
        </View>
        <Text style={styles.walletLink}>Top up ›</Text>
      </Pressable>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Saved delivery locations</Text>
        <Pressable onPress={openModal} hitSlop={8}>
          <Text style={styles.link}>+ Add</Text>
        </Pressable>
      </View>
    </View>
  );

  const footer = (
    <View>
      {savedLocations.length === 0 && (
        <Text style={styles.noLocations}>No saved location yet. Add your classroom or lab to check out faster.</Text>
      )}

      {/* ---------- Demo clock ---------- */}
      <Section
        title="🕒 Demo clock"
        style={{ marginTop: 14 }}
        right={
          <Switch
            value={demoTime !== null}
            onValueChange={(on) => setDemoTime(on ? '09:00' : null)}
            trackColor={{ true: colors.primary }}
          />
        }
      >
        <Text style={styles.hint}>
          Simulate the time of day to show opening hours and delivery slots during the presentation.
        </Text>
        {demoTime !== null && (
          <View style={styles.chips}>
            {DEMO_TIMES.map((t) => (
              <Chip key={t} label={t} selected={demoTime === t} onPress={() => setDemoTime(t)} />
            ))}
          </View>
        )}
      </Section>

      <AppButton title="Log out" variant="outline" onPress={handleLogout} />
    </View>
  );

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={savedLocations}
        keyExtractor={(l) => l.id}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        renderItem={({ item }) => (
          <View style={styles.location}>
            <Icon name="location" size={20} color={colors.primary} />
            <Text style={styles.locationText}>{item.label}</Text>
            <Pressable onPress={() => removeLocation(item.id)} hitSlop={10}>
              <Icon name="trash-outline" size={19} color={colors.danger} />
            </Pressable>
          </View>
        )}
      />

      {/* ---------- Add location modal ---------- */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New delivery location</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Icon name="close" size={24} />
              </Pressable>
            </View>
            <FormInput label="Name" placeholder="e.g. My Lab" value={label} onChangeText={setLabel} error={errors.label} />
            <Text style={styles.modalLabel}>Building</Text>
            <View style={styles.chips}>
              {allBuildings.map((b) => (
                <Chip key={b.id} label={b.name} selected={buildingId === b.id} onPress={() => setBuildingId(b.id)} />
              ))}
            </View>
            {errors.building && <Text style={styles.error}>{errors.building}</Text>}
            <FormInput label="Room" placeholder="e.g. 204" value={room} onChangeText={setRoom} error={errors.room} />
            <AppButton title="Save location" onPress={saveLocation} />
          </View>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  userCard: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: '800' },
  name: { fontSize: 21, fontWeight: '800', color: colors.text },
  email: { color: colors.muted, marginTop: 2 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  infoLabel: { color: colors.muted },
  infoValue: { color: colors.text, fontWeight: '600' },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 18,
  },
  walletLabel: { color: 'rgba(255,255,255,0.85)' },
  walletBalance: { color: colors.white, fontSize: 24, fontWeight: '800' },
  walletLink: { color: colors.accent, fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  link: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  noLocations: { color: colors.muted, marginBottom: 4 },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  locationText: { flex: 1, marginLeft: 10, color: colors.text, fontWeight: '600' },
  hint: { color: colors.muted, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  modalLabel: { fontWeight: '600', color: colors.text, marginBottom: 8 },
  error: { color: colors.danger, fontSize: 12.5, marginBottom: 8 },
});

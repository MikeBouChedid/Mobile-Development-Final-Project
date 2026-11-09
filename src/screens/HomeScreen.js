// Screen 2: Home – Campus Stores
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import StoreCard from '../components/StoreCard';
import Chip from '../components/Chip';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { useApp } from '../context/AppContext';
import { allSlots, getStores } from '../api/campusApi';
import { getNextSlot, isStoreOpen, slotLabel } from '../utils/time';
import { money } from '../utils/pricing';
import { colors, radius } from '../theme';

const CATEGORIES = ['All', 'Food', 'Drinks', 'Stationery', 'Printing'];

export default function HomeScreen({ navigation }) {
  const { user, wallet, now, demoTime } = useApp();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const loadStores = async () => {
    try {
      setError(null);
      const data = await getStores();
      setStores(data);
    } catch (e) {
      setError('Could not load the stores. Pull down to try again.');
    }
  };

  // load the stores once, when the screen opens
  useEffect(() => {
    loadStores().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStores();
    setRefreshing(false);
  };

  // search + category filter
  const filteredStores = stores.filter((store) => {
    const matchesCategory = category === 'All' || store.category === category;
    const matchesSearch = store.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // next slot that the fastest OPEN store can still make
  const openStores = stores.filter((s) => isStoreOpen(s, now));
  const fastestPrep = openStores.length > 0 ? Math.min(...openStores.map((s) => s.prepTime)) : 0;
  const nextSlot = openStores.length > 0 ? getNextSlot(allSlots, now, fastestPrep) : null;

  const firstName = user.fullName.split(' ')[0];

  const header = (
    <View>
      <Text style={styles.hello}>Hi {firstName} 👋</Text>
      <Text style={styles.question}>What do you need before your next class?</Text>

      <View style={styles.banner}>
        <View style={styles.bannerItem}>
          <Icon name="time-outline" size={20} color={colors.white} />
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerLabel}>Next delivery slot</Text>
            <Text style={styles.bannerValue}>{nextSlot ? slotLabel(nextSlot) : 'None left today'}</Text>
          </View>
        </View>
        <View style={styles.bannerDivider} />
        <View style={styles.bannerItem}>
          <Icon name="wallet-outline" size={20} color={colors.white} />
          <View style={styles.bannerTextBox}>
            <Text style={styles.bannerLabel}>Wallet</Text>
            <Text style={styles.bannerValue}>{money(wallet.balance)}</Text>
          </View>
        </View>
      </View>
      {demoTime && <Text style={styles.demoNote}>🕒 Demo clock is on: {demoTime} (change it in Profile)</Text>}

      <View style={styles.searchBox}>
        <Icon name="search" size={18} color={colors.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search a store..."
          placeholderTextColor={colors.muted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Icon name="close-circle" size={18} color={colors.muted} />
          </Pressable>
        )}
      </View>

      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => <Chip label={item} selected={category === item} onPress={() => setCategory(item)} />}
        style={styles.chips}
      />
      <Text style={styles.sectionTitle}>Campus stores</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading campus stores...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={filteredStores}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      renderItem={({ item }) => (
        <StoreCard
          store={item}
          open={isStoreOpen(item, now)}
          onPress={() => navigation.navigate('StoreMenu', { storeId: item.id, storeName: item.name })}
        />
      )}
      ListEmptyComponent={
        <EmptyState emoji={error ? '⚠️' : '🔍'} title={error || 'No store found'} subtitle={error ? '' : 'Try another search or category'} />
      }
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: 10, color: colors.muted },
  hello: { fontSize: 24, fontWeight: '800', color: colors.text },
  question: { fontSize: 14.5, color: colors.muted, marginTop: 2, marginBottom: 14 },
  banner: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 16,
  },
  bannerItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  bannerTextBox: { marginLeft: 10 },
  bannerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 12 },
  bannerLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  bannerValue: { color: colors.white, fontSize: 16, fontWeight: '800', marginTop: 2 },
  demoNote: { color: colors.warning, fontSize: 12.5, marginTop: 8, fontWeight: '600' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginTop: 16,
  },
  searchInput: { flex: 1, paddingVertical: 11, paddingHorizontal: 8, fontSize: 15, color: colors.text },
  chips: { marginTop: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 6, marginBottom: 10 },
});

// Screen 3 (a): Store menu – products grouped by category
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import ProductRow from '../components/ProductRow';
import CartButton from '../components/CartButton';
import Chip from '../components/Chip';
import OpenBadge from '../components/OpenBadge';
import Icon from '../components/Icon';
import useAddToCart, { makeItemKey, makeOptionsLabel } from '../hooks/useAddToCart';
import { useApp } from '../context/AppContext';
import { allStores, getProductsByStore } from '../api/campusApi';
import { isStoreOpen } from '../utils/time';
import { cartCount, cartSubtotal, money, productUnitPrice } from '../utils/pricing';
import { showMessage } from '../utils/dialogs';
import { colors, radius } from '../theme';

export default function StoreMenuScreen({ route, navigation }) {
  const { storeId } = route.params;
  const store = allStores.find((s) => s.id === storeId);
  const { cart, now } = useApp();
  const addItem = useAddToCart();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState('');

  const open = isStoreOpen(store, now);
  const goToCart = () => navigation.navigate('Tabs', { screen: 'Cart' }, { pop: true });

  // cart icon with badge in the header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: store.name,
      headerRight: () => <CartButton onPress={goToCart} />,
    });
  }, [navigation, store]);

  useEffect(() => {
    getProductsByStore(storeId)
      .then((data) => setProducts(data))
      .finally(() => setLoading(false));
  }, [storeId]);

  // hide the "Added" message after 1.5 s
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 1500);
    return () => clearTimeout(timer);
  }, [toast]);

  // categories in the order they appear in the JSON file
  const categories = [];
  products.forEach((p) => {
    if (!categories.includes(p.category)) categories.push(p.category);
  });

  // Build one flat list: [header, product, product, header, product, ...]
  const rows = [];
  categories
    .filter((c) => selectedCategory === 'All' || c === selectedCategory)
    .forEach((c) => {
      rows.push({ type: 'header', id: `h-${c}`, title: c });
      products.filter((p) => p.category === c).forEach((p) => rows.push({ type: 'product', id: p.id, product: p }));
    });

  // "+" button: add with the default options (first size, no extras)
  const quickAdd = (product) => {
    if (!open) {
      showMessage('Store closed', `${store.name} opens at ${store.openingHours.open}. You can browse but not order now.`);
      return;
    }
    const size = product.options.sizes[0] || null;
    const item = {
      key: makeItemKey(product.id, size, []),
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      optionsLabel: makeOptionsLabel(size, []),
      unitPrice: productUnitPrice(product, size, []),
      qty: 1,
    };
    addItem(store, item, () => setToast(`${product.name} added to cart`));
  };

  const renderRow = ({ item }) => {
    if (item.type === 'header') {
      return <Text style={styles.categoryTitle}>{item.title}</Text>;
    }
    return (
      <ProductRow
        product={item.product}
        onPress={() => navigation.navigate('ProductDetails', { productId: item.product.id })}
        onQuickAdd={() => quickAdd(item.product)}
      />
    );
  };

  const storeHeader = (
    <View>
      <View style={[styles.storeHeader, { backgroundColor: store.color }]}>
        <Text style={styles.storeLogo}>{store.logo}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.storeName}>{store.name}</Text>
          <Text style={styles.storeDescription}>{store.description}</Text>
          <View style={styles.storeMeta}>
            <OpenBadge open={open} />
            <Text style={styles.metaText}>
              {'  '}
              {store.openingHours.open}–{store.openingHours.close} · ~{store.prepTime} min
            </Text>
          </View>
        </View>
      </View>

      {!open && (
        <View style={styles.closedBanner}>
          <Icon name="lock-closed" size={16} color={colors.danger} />
          <Text style={styles.closedText}> This store is closed. You can browse the menu but not order.</Text>
        </View>
      )}

      {storeId === 'printing' && (
        <Pressable style={styles.printBanner} onPress={() => navigation.navigate('Tabs', { screen: 'Print' }, { pop: true })}>
          <Icon name="print-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.printTitle}>Print a document</Text>
            <Text style={styles.printSubtitle}>Upload, choose options and get it in class</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      )}

      <FlatList
        horizontal
        data={['All', ...categories]}
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        renderItem={({ item }) => (
          <Chip label={item} selected={selectedCategory === item} onPress={() => setSelectedCategory(item)} />
        )}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const itemsInCart = cart.storeId === storeId ? cartCount(cart.items) : 0;

  return (
    <View style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.id}
        renderItem={renderRow}
        ListHeaderComponent={storeHeader}
        contentContainerStyle={{ paddingBottom: itemsInCart > 0 ? 100 : 30 }}
      />

      {toast ? (
        <View style={styles.toast}>
          <Icon name="checkmark-circle" size={18} color={colors.white} />
          <Text style={styles.toastText}> {toast}</Text>
        </View>
      ) : null}

      {itemsInCart > 0 && (
        <Pressable style={styles.cartBar} onPress={goToCart}>
          <View style={styles.cartCount}>
            <Text style={styles.cartCountText}>{itemsInCart}</Text>
          </View>
          <Text style={styles.cartBarText}>View cart</Text>
          <Text style={styles.cartBarText}>{money(cartSubtotal(cart.items))}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  storeHeader: { flexDirection: 'row', padding: 16, alignItems: 'center', marginBottom: 12 },
  storeLogo: { fontSize: 44, marginRight: 14 },
  storeName: { fontSize: 20, fontWeight: '800', color: colors.text },
  storeDescription: { fontSize: 13, color: colors.text, marginTop: 2 },
  storeMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  metaText: { fontSize: 12.5, color: colors.text },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerLight,
    marginHorizontal: 16,
    padding: 10,
    borderRadius: radius.sm,
    marginBottom: 12,
  },
  closedText: { color: colors.danger, fontWeight: '600', flex: 1, fontSize: 13 },
  printBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  printTitle: { fontWeight: '700', color: colors.primary, fontSize: 15 },
  printSubtitle: { color: colors.text, fontSize: 12.5 },
  categoryTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
  },
  toast: {
    position: 'absolute',
    top: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
  },
  toastText: { color: colors.white, fontWeight: '600' },
  cartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  cartCount: {
    backgroundColor: colors.white,
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: { color: colors.primary, fontWeight: '800' },
  cartBarText: { color: colors.white, fontWeight: '700', fontSize: 16 },
});

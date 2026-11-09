// Screen 3 (b): Product details with options and quantity
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import QuantitySelector from '../components/QuantitySelector';
import Section from '../components/Section';
import useAddToCart, { makeItemKey, makeOptionsLabel } from '../hooks/useAddToCart';
import { useApp } from '../context/AppContext';
import { allProducts, allStores } from '../api/campusApi';
import { isStoreOpen } from '../utils/time';
import { money, productUnitPrice, round2 } from '../utils/pricing';
import { colors, radius } from '../theme';

export default function ProductDetailsScreen({ route, navigation }) {
  const { productId } = route.params;
  const product = allProducts.find((p) => p.id === productId);
  const store = allStores.find((s) => s.id === product.storeId);
  const { now } = useApp();
  const addItem = useAddToCart();
  const insets = useSafeAreaInsets();

  const { sizes, extras } = product.options;
  const [size, setSize] = useState(sizes.length > 0 ? sizes[0] : null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [qty, setQty] = useState(1);

  const open = isStoreOpen(store, now);
  const unitPrice = productUnitPrice(product, size, selectedExtras);
  const total = round2(unitPrice * qty);

  // add or remove an extra from the list
  const toggleExtra = (extra) => {
    const isSelected = selectedExtras.some((e) => e.label === extra.label);
    if (isSelected) {
      setSelectedExtras(selectedExtras.filter((e) => e.label !== extra.label));
    } else {
      setSelectedExtras([...selectedExtras, extra]);
    }
  };

  const handleAdd = () => {
    const item = {
      key: makeItemKey(product.id, size, selectedExtras),
      productId: product.id,
      name: product.name,
      emoji: product.emoji,
      optionsLabel: makeOptionsLabel(size, selectedExtras),
      unitPrice,
      qty,
    };
    addItem(store, item, () => navigation.goBack());
  };

  let buttonTitle = `Add ${qty} to cart · ${money(total)}`;
  if (!product.inStock) buttonTitle = 'Out of stock';
  else if (!open) buttonTitle = 'Store closed';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.imageBox, { backgroundColor: store.color }]}>
          <Text style={styles.emoji}>{product.emoji}</Text>
          {!product.inStock && (
            <View style={styles.outBadge}>
              <Text style={styles.outText}>Out of stock</Text>
            </View>
          )}
        </View>

        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.store}>
          {store.logo} {store.name} · {product.category}
        </Text>
        <Text style={styles.price}>{money(product.price)}</Text>
        <Text style={styles.description}>{product.description}</Text>

        {sizes.length > 0 && (
          <Section title="Size">
            <View style={styles.chips}>
              {sizes.map((s) => (
                <Chip
                  key={s.label}
                  label={s.extra > 0 ? `${s.label} (+${money(s.extra)})` : s.label}
                  selected={size && size.label === s.label}
                  onPress={() => setSize(s)}
                />
              ))}
            </View>
          </Section>
        )}

        {extras.length > 0 && (
          <Section title="Extras">
            <View style={styles.chips}>
              {extras.map((e) => (
                <Chip
                  key={e.label}
                  label={e.price > 0 ? `${e.label} (+${money(e.price)})` : e.label}
                  selected={selectedExtras.some((x) => x.label === e.label)}
                  onPress={() => toggleExtra(e)}
                />
              ))}
            </View>
          </Section>
        )}

        <Section title="Quantity" right={<QuantitySelector value={qty} onChange={setQty} min={1} max={20} />}>
          <Text style={styles.unit}>Unit price: {money(unitPrice)}</Text>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
        <AppButton title={buttonTitle} onPress={handleAdd} disabled={!product.inStock || !open} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  imageBox: {
    height: 180,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emoji: { fontSize: 90 },
  outBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  outText: { color: colors.white, fontWeight: '700', fontSize: 12 },
  name: { fontSize: 24, fontWeight: '800', color: colors.text },
  store: { fontSize: 13.5, color: colors.muted, marginTop: 4 },
  price: { fontSize: 20, fontWeight: '800', color: colors.primary, marginTop: 8 },
  description: { fontSize: 14.5, color: colors.text, marginTop: 8, marginBottom: 16, lineHeight: 21 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  unit: { color: colors.muted },
  footer: {
    padding: 16,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

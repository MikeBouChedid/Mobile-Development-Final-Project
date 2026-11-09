// Screen 4: Printing service
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import FormInput from '../components/FormInput';
import Section from '../components/Section';
import Icon from '../components/Icon';
import OpenBadge from '../components/OpenBadge';
import useAddToCart from '../hooks/useAddToCart';
import { useApp } from '../context/AppContext';
import { allStores, printPrices } from '../api/campusApi';
import { calcPrintPrice, money } from '../utils/pricing';
import { validatePrintJob } from '../utils/validation';
import { isStoreOpen } from '../utils/time';
import { colors, radius } from '../theme';

// Files shown in the "upload" window (the upload is simulated)
const SAMPLE_FILES = [
  { name: 'Lab_Report_3.pdf', pages: 12 },
  { name: 'Software_Engineering_Slides.pdf', pages: 48 },
  { name: 'CV_2026.docx', pages: 2 },
  { name: 'Thesis_Draft_v2.pdf', pages: 86 },
  { name: 'Mobile_Dev_Project_Brief.pdf', pages: 5 },
];

const BINDINGS = [
  { id: 'none', label: 'None' },
  { id: 'staple', label: 'Staple' },
  { id: 'spiral', label: 'Spiral' },
];

const emptyJob = {
  documentName: '',
  pages: '',
  copies: '1',
  color: false,
  doubleSided: false,
  binding: 'none',
};

export default function PrintScreen({ navigation }) {
  const store = allStores.find((s) => s.id === 'printing');
  const { now } = useApp();
  const addItem = useAddToCart();
  const insets = useSafeAreaInsets();

  const [job, setJob] = useState(emptyJob);
  const [errors, setErrors] = useState({});
  const [pickerVisible, setPickerVisible] = useState(false);

  const open = isStoreOpen(store, now);
  // live price: recalculated on every render, so on every change
  const price = calcPrintPrice(job, printPrices);

  const update = (field, value) => setJob({ ...job, [field]: value });

  const chooseFile = (file) => {
    setJob({ ...job, documentName: file.name, pages: String(file.pages) });
    setPickerVisible(false);
  };

  const handleAdd = () => {
    const formErrors = validatePrintJob(job, printPrices.maxPages);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    const pages = Number(job.pages);
    const copies = Number(job.copies);
    const options = [
      `${pages} page${pages > 1 ? 's' : ''} × ${copies} cop${copies > 1 ? 'ies' : 'y'}`,
      job.color ? 'Color' : 'B&W',
      job.doubleSided ? 'Double-sided' : 'Single-sided',
    ];
    if (job.binding !== 'none') options.push(`${job.binding === 'spiral' ? 'Spiral' : 'Staple'} binding`);

    const item = {
      key: `print-${Date.now()}`,
      productId: 'print',
      name: `Print: ${job.documentName}`,
      emoji: '🖨️',
      optionsLabel: options.join(' · '),
      unitPrice: price,
      qty: 1,
      printJob: { ...job, pages, copies },
    };

    addItem(store, item, () => {
      setJob(emptyJob);
      setErrors({});
      navigation.navigate('Cart');
    });
  };

  const pagesNumber = Number(job.pages) || 0;
  const copiesNumber = Number(job.copies) || 0;
  const perPage = job.color ? printPrices.colorPerPage : printPrices.blackWhitePerPage;
  const pagesCost = pagesNumber * perPage * (job.doubleSided ? 1 - printPrices.doubleSidedDiscount : 1);

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.storeRow}>
          <Text style={styles.storeName}>
            {store.logo} {store.name}
          </Text>
          <OpenBadge open={open} />
        </View>
        {!open && (
          <Text style={styles.closed}>
            The printing office is closed ({store.openingHours.open}–{store.openingHours.close}). You can prepare your job
            but not order it now.
          </Text>
        )}

        <Section title="Document">
          <Pressable style={[styles.upload, errors.documentName && styles.uploadError]} onPress={() => setPickerVisible(true)}>
            <Icon name={job.documentName ? 'document-text' : 'cloud-upload-outline'} size={26} color={colors.primary} />
            <Text style={styles.uploadText} numberOfLines={1}>
              {job.documentName || 'Tap to upload a document'}
            </Text>
          </Pressable>
          {errors.documentName && <Text style={styles.error}>{errors.documentName}</Text>}

          <View style={styles.row}>
            <FormInput
              label="Pages"
              placeholder="e.g. 10"
              keyboardType="number-pad"
              value={job.pages}
              onChangeText={(v) => update('pages', v.replace(/[^0-9]/g, ''))}
              error={errors.pages}
              style={styles.half}
            />
            <FormInput
              label="Copies"
              placeholder="1"
              keyboardType="number-pad"
              value={job.copies}
              onChangeText={(v) => update('copies', v.replace(/[^0-9]/g, ''))}
              error={errors.copies}
              style={styles.half}
            />
          </View>
          <Text style={styles.hint}>Maximum {printPrices.maxPages} pages per order.</Text>
        </Section>

        <Section title="Options">
          <Text style={styles.optionLabel}>Color</Text>
          <View style={styles.chips}>
            <Chip label={`Black & White (${money(printPrices.blackWhitePerPage)}/page)`} selected={!job.color} onPress={() => update('color', false)} />
            <Chip label={`Color (${money(printPrices.colorPerPage)}/page)`} selected={job.color} onPress={() => update('color', true)} />
          </View>

          <Text style={styles.optionLabel}>Sides</Text>
          <View style={styles.chips}>
            <Chip label="Single-sided" selected={!job.doubleSided} onPress={() => update('doubleSided', false)} />
            <Chip
              label={`Double-sided (-${printPrices.doubleSidedDiscount * 100}%)`}
              selected={job.doubleSided}
              onPress={() => update('doubleSided', true)}
            />
          </View>

          <Text style={styles.optionLabel}>Binding</Text>
          <View style={styles.chips}>
            {BINDINGS.map((b) => {
              const cost = printPrices.binding[b.id];
              return (
                <Chip
                  key={b.id}
                  label={cost > 0 ? `${b.label} (+${money(cost)})` : b.label}
                  selected={job.binding === b.id}
                  onPress={() => update('binding', b.id)}
                />
              );
            })}
          </View>
        </Section>

        <Section title="Price">
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>
              {pagesNumber} pages × {money(perPage)}
              {job.doubleSided ? ` − ${printPrices.doubleSidedDiscount * 100}%` : ''}
            </Text>
            <Text style={styles.priceValue}>{money(pagesCost)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Binding</Text>
            <Text style={styles.priceValue}>{money(printPrices.binding[job.binding])}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Copies</Text>
            <Text style={styles.priceValue}>× {copiesNumber}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{money(price)}</Text>
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 16 }]}>
        <AppButton title={`Add to cart · ${money(price)}`} onPress={handleAdd} disabled={!open} />
      </View>

      {/* Simulated file picker */}
      <Modal visible={pickerVisible} animationType="slide" transparent onRequestClose={() => setPickerVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modal, { paddingBottom: 20 + insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose a document</Text>
              <Pressable onPress={() => setPickerVisible(false)} hitSlop={10}>
                <Icon name="close" size={24} />
              </Pressable>
            </View>
            <Text style={styles.modalSubtitle}>Upload is simulated: pick one of your recent files.</Text>
            <FlatList
              data={SAMPLE_FILES}
              keyExtractor={(f) => f.name}
              renderItem={({ item }) => (
                <Pressable style={styles.fileRow} onPress={() => chooseFile(item)}>
                  <Icon name="document-text-outline" size={24} color={colors.primary} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.fileName}>{item.name}</Text>
                    <Text style={styles.filePages}>{item.pages} pages</Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 30 },
  storeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  storeName: { fontSize: 18, fontWeight: '700', color: colors.text },
  closed: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
    padding: 10,
    borderRadius: radius.sm,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 13,
  },
  upload: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: 16,
    marginBottom: 14,
  },
  uploadError: { borderColor: colors.danger },
  uploadText: { marginLeft: 12, flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary },
  error: { color: colors.danger, fontSize: 12.5, marginTop: -8, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  half: { width: '48%' },
  hint: { color: colors.muted, fontSize: 12.5, marginTop: -4 },
  optionLabel: { fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  priceLabel: { color: colors.muted, fontSize: 14 },
  priceValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 17, fontWeight: '800', color: colors.text },
  totalValue: { fontSize: 20, fontWeight: '800', color: colors.primary },
  footer: { padding: 16, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: 20,
    maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 19, fontWeight: '800', color: colors.text },
  modalSubtitle: { color: colors.muted, marginTop: 4, marginBottom: 12 },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  fileName: { fontSize: 15, fontWeight: '600', color: colors.text },
  filePages: { fontSize: 13, color: colors.muted, marginTop: 2 },
});

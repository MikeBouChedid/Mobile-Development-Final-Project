// Screen 7 (c): Campus Wallet – balance, simulated top-up, transactions
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import FormInput from '../components/FormInput';
import Icon from '../components/Icon';
import EmptyState from '../components/EmptyState';
import { useApp } from '../context/AppContext';
import { formatDateTime } from '../utils/time';
import { money } from '../utils/pricing';
import { confirmAction, showMessage } from '../utils/dialogs';
import { colors, radius, shadow } from '../theme';

const AMOUNTS = [5, 10, 20, 50];
const MAX_TOP_UP = 200;

const TYPE_ICONS = {
  topup: { name: 'arrow-down-circle', color: colors.success },
  payment: { name: 'arrow-up-circle', color: colors.danger },
  refund: { name: 'return-down-back', color: colors.primary },
};

export default function WalletScreen() {
  const { wallet, topUp } = useApp();
  const [amount, setAmount] = useState(10);
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');

  const chosenAmount = custom ? Number(custom) : amount;

  const handleTopUp = () => {
    if (!chosenAmount || chosenAmount <= 0) {
      setError('Enter an amount greater than 0');
      return;
    }
    if (chosenAmount > MAX_TOP_UP) {
      setError(`Maximum top-up is ${money(MAX_TOP_UP)}`);
      return;
    }
    setError('');
    confirmAction('Top up wallet', `Add ${money(chosenAmount)} to your Campus Wallet? (simulated payment)`, () => {
      topUp(chosenAmount);
      setCustom('');
      showMessage('Wallet topped up', `${money(chosenAmount)} added to your wallet.`);
    }, 'Top up');
  };

  const header = (
    <View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current balance</Text>
        <Text style={styles.balance}>{money(wallet.balance)}</Text>
      </View>

      <View style={styles.topUpCard}>
        <Text style={styles.title}>Top up</Text>
        <View style={styles.chips}>
          {AMOUNTS.map((a) => (
            <Chip
              key={a}
              label={`$${a}`}
              selected={!custom && amount === a}
              onPress={() => {
                setAmount(a);
                setCustom('');
                setError('');
              }}
            />
          ))}
        </View>
        <FormInput
          label="Or another amount"
          placeholder="e.g. 15"
          keyboardType="decimal-pad"
          value={custom}
          onChangeText={(v) => setCustom(v.replace(/[^0-9.]/g, ''))}
          error={error}
        />
        <AppButton title={`Top up ${chosenAmount > 0 ? money(chosenAmount) : ''}`} onPress={handleTopUp} />
      </View>

      <Text style={styles.title}>Transactions</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={wallet.transactions}
      keyExtractor={(t) => t.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={<EmptyState emoji="💸" title="No transactions yet" />}
      renderItem={({ item }) => {
        const icon = TYPE_ICONS[item.type];
        return (
          <View style={styles.transaction}>
            <Icon name={icon.name} size={28} color={icon.color} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.tLabel}>{item.label}</Text>
              <Text style={styles.tDate}>{formatDateTime(item.date)}</Text>
            </View>
            <Text style={[styles.tAmount, { color: item.amount >= 0 ? colors.success : colors.danger }]}>
              {item.amount >= 0 ? '+' : '−'}
              {money(Math.abs(item.amount))}
            </Text>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: 22,
    alignItems: 'center',
    marginBottom: 14,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.85)' },
  balance: { color: colors.white, fontSize: 38, fontWeight: '800', marginTop: 4 },
  topUpCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 18, ...shadow },
  title: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: radius.md,
    marginBottom: 8,
  },
  tLabel: { fontWeight: '600', color: colors.text },
  tDate: { color: colors.muted, fontSize: 12.5, marginTop: 2 },
  tAmount: { fontWeight: '800', fontSize: 15 },
});

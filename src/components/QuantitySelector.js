import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Icon from './Icon';
import { colors } from '../theme';

// [ - ]  2  [ + ]
export default function QuantitySelector({ value, onChange, min = 1, max = 20, small = false }) {
  const size = small ? 28 : 38;

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onChange(value - 1)}
        disabled={value <= min}
        style={[styles.button, { width: size, height: size }, value <= min && styles.disabled]}
      >
        <Icon name={value <= 1 && min === 0 ? 'trash-outline' : 'remove'} size={small ? 16 : 20} color={colors.primary} />
      </Pressable>
      <Text style={[styles.value, small && styles.valueSmall]}>{value}</Text>
      <Pressable
        onPress={() => onChange(value + 1)}
        disabled={value >= max}
        style={[styles.button, { width: size, height: size }, value >= max && styles.disabled]}
      >
        <Icon name="add" size={small ? 16 : 20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  button: {
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  value: { minWidth: 40, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text },
  valueSmall: { minWidth: 30, fontSize: 15 },
});

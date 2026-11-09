import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Icon from './Icon';
import { colors } from '../theme';

// 1 to 5 stars. If onChange is not given, the stars are read-only.
export default function StarRating({ value, onChange, size = 30 }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <View style={styles.row}>
      {stars.map((star) => (
        <Pressable
          key={star}
          onPress={() => onChange && onChange(star)}
          disabled={!onChange}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
        >
          <Icon name={star <= value ? 'star' : 'star-outline'} size={size} color={colors.accent} style={styles.star} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  star: { marginRight: 4 },
});

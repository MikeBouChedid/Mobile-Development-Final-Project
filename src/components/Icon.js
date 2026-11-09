// One place for all the icons of the app (Ionicons from @expo/vector-icons).
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

export default function Icon({ name, size = 22, color = colors.text, style }) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

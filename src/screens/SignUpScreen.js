// Screen 1 (b): Sign-up form
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppButton from '../components/AppButton';
import Chip from '../components/Chip';
import FormInput from '../components/FormInput';
import { useApp } from '../context/AppContext';
import { faculties } from '../api/campusApi';
import { validateSignUp } from '../utils/validation';
import { colors, radius } from '../theme';

const emptyForm = {
  fullName: '',
  email: '',
  universityId: '',
  faculty: '',
  phone: '',
  password: '',
  confirmPassword: '',
};

export default function SignUpScreen() {
  const { signUp } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // one function updates any field: updateField('phone', '70...')
  const updateField = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSignUp = async () => {
    const formErrors = validateSignUp(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setLoading(true);
    const error = await signUp(form);
    setLoading(false);
    if (error) setErrors({ form: error });
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>Create your CampusGo account with your Antonine university details.</Text>

        {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

        <FormInput
          label="Full name"
          placeholder="e.g. Maria Khoury"
          value={form.fullName}
          onChangeText={(v) => updateField('fullName', v)}
          error={errors.fullName}
        />
        <FormInput
          label="University email"
          placeholder="name@ua.edu.lb"
          value={form.email}
          onChangeText={(v) => updateField('email', v)}
          autoCapitalize="none"
          keyboardType="email-address"
          error={errors.email}
        />
        <FormInput
          label="Student / Staff ID"
          placeholder="8 digits, e.g. 20241234"
          value={form.universityId}
          onChangeText={(v) => updateField('universityId', v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          maxLength={8}
          error={errors.universityId}
        />

        <Text style={styles.label}>Faculty</Text>
        <View style={styles.chips}>
          {faculties.map((faculty) => (
            <Chip
              key={faculty}
              label={faculty}
              selected={form.faculty === faculty}
              onPress={() => updateField('faculty', faculty)}
            />
          ))}
        </View>
        {errors.faculty && <Text style={styles.error}>{errors.faculty}</Text>}

        <FormInput
          label="Phone number"
          placeholder="e.g. 70123456"
          value={form.phone}
          onChangeText={(v) => updateField('phone', v.replace(/[^0-9]/g, ''))}
          keyboardType="phone-pad"
          maxLength={8}
          error={errors.phone}
          style={{ marginTop: 8 }}
        />
        <FormInput
          label="Password"
          placeholder="At least 6 characters"
          value={form.password}
          onChangeText={(v) => updateField('password', v)}
          secureTextEntry
          error={errors.password}
        />
        <FormInput
          label="Confirm password"
          placeholder="Type the password again"
          value={form.confirmPassword}
          onChangeText={(v) => updateField('confirmPassword', v)}
          secureTextEntry
          error={errors.confirmPassword}
        />

        <AppButton title="Create account" onPress={handleSignUp} loading={loading} style={{ marginTop: 6 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 40 },
  subtitle: { color: colors.muted, fontSize: 14.5, marginBottom: 18 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  error: { color: colors.danger, fontSize: 12.5, marginBottom: 6 },
  formError: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
    padding: 10,
    borderRadius: radius.sm,
    marginBottom: 12,
    fontWeight: '600',
  },
});

// Screen 1: Welcome / Login
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AppButton from '../components/AppButton';
import FormInput from '../components/FormInput';
import { useApp } from '../context/AppContext';
import { demoUser } from '../api/campusApi';
import { validateLogin } from '../utils/validation';
import { colors, radius, shadow } from '../theme';

export default function WelcomeScreen({ navigation }) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const formErrors = validateLogin({ email, password });
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setLoading(true);
    const error = await login(email, password);
    setLoading(false);
    if (error) setErrors({ form: error });
  };

  const fillDemoAccount = () => {
    setEmail(demoUser.email);
    setPassword(demoUser.password);
    setErrors({});
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Image source={require('../../assets/logo.png')} style={styles.logo} />
            <Text style={styles.appName}>CampusGo</Text>
            <Text style={styles.tagline}>Université Antonine campus delivery</Text>
            <Text style={styles.intro}>
              Order from the cafeteria, coffee corner, bookstore or printing office and get it delivered to your
              classroom during your break.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Log in</Text>

            {errors.form && <Text style={styles.formError}>{errors.form}</Text>}

            <FormInput
              label="University email"
              placeholder="firstname.lastname@ua.edu.lb"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />
            <FormInput
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.showPassword}>
              <Text style={styles.link}>{showPassword ? 'Hide password' : 'Show password'}</Text>
            </Pressable>

            <AppButton title="Log in" onPress={handleLogin} loading={loading} />

            <Pressable onPress={fillDemoAccount} style={styles.demo}>
              <Text style={styles.demoText}>Use the demo account</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to CampusGo? </Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.link}>Create an account</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { padding: 20, paddingBottom: 40 },
  hero: { alignItems: 'center', marginTop: 16, marginBottom: 24 },
  logo: { width: 96, height: 96, borderRadius: 24 },
  appName: { fontSize: 32, fontWeight: '800', color: colors.primary, marginTop: 12 },
  tagline: { fontSize: 14, color: colors.muted, fontWeight: '600', marginTop: 2 },
  intro: { fontSize: 14.5, color: colors.text, textAlign: 'center', marginTop: 12, lineHeight: 21 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 20, ...shadow },
  cardTitle: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 14 },
  formError: {
    backgroundColor: colors.dangerLight,
    color: colors.danger,
    padding: 10,
    borderRadius: radius.sm,
    marginBottom: 12,
    fontWeight: '600',
  },
  showPassword: { alignSelf: 'flex-end', marginTop: -6, marginBottom: 14 },
  link: { color: colors.primary, fontWeight: '700' },
  demo: { alignItems: 'center', marginTop: 14 },
  demoText: { color: colors.muted, textDecorationLine: 'underline' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { color: colors.muted },
});

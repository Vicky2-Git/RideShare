// src/screens/Auth/LoginScreen.js
// This screen handles user login with enhanced, responsive styling.

import React, { useState, useContext } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import { authApi } from '../../utils/api';
import { colors, spacing, borderRadius, typography, shadow } from '../../styles/theme'; // Import refined theme

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Email and password are required.');
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      Alert.alert('Success', data.message);
      await signIn(data.token, data.userRole);
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', error.message || 'Network error or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Welcome to RideShare</Text>
          <Text style={styles.subtitle}>Login to continue your journey</Text>

          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Password"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeIcon}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.cardBackground} />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkTextHighlight}>Register Here</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1, // Allows content to grow and enable scrolling
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg, // Consistent padding around the card
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    width: '100%', // Take full width of parent padding
    maxWidth: 400, // Max width for larger screens
    alignItems: 'center',
    ...shadow.default,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.xxl,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  input: {
    width: '100%',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  button: {
    width: '100%',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.button,
  },
  buttonText: {
    color: colors.cardBackground,
    ...typography.h2,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  linkTextHighlight: {
    color: colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  inputWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: spacing.md,
  },
  inputWithIcon: {
    paddingRight: spacing.xl || spacing.lg,
  },
  eyeIcon: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
});

export default LoginScreen;

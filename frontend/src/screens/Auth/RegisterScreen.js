// src/screens/Auth/RegisterScreen.js
// This screen handles user registration with enhanced, responsive styling.

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
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { AuthContext } from '../../context/AuthContext';
import { authApi } from '../../utils/api';
import { colors, spacing, borderRadius, typography, shadow } from '../../styles/theme'; // Import refined theme

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [gender, setGender] = useState('Male');
  const [age, setAge] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useContext(AuthContext);

  const handleRegister = async () => {
    // --- Frontend Validation ---
    if (!name || !email || !password || !confirmPassword || !gender || !age || !mobileNumber) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Validation Error', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Validation Error', 'Password must be at least 6 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        Alert.alert('Validation Error', 'Password must contain at least one uppercase letter, one lowercase letter, and one number.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address.');
      return;
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobileNumber)) {
      Alert.alert('Validation Error', 'Mobile number must be 10 digits.');
      return;
    }

    const parsedAge = parseInt(age);
    if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 100) {
      Alert.alert('Validation Error', 'Age must be a number between 18 and 100.');
      return;
    }
    // --- End Frontend Validation ---

    setLoading(true);
    try {
      const data = await authApi.register({
        name,
        email,
        password,
        gender,
        age: parsedAge,
        mobileNumber,
      });

      Alert.alert('Success', data.message);
      await signIn(data.token, data.userRole);
    } catch (error) {
      console.error('Registration error:', error);
      Alert.alert('Registration Failed', error.message || 'Network error or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Join RideShare</Text>
          <Text style={styles.subtitle}>Create your account to get started</Text>

          <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={colors.placeholder} value={name} onChangeText={setName} />
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
              placeholder="Password (min 6 chars, incl. A-Z, a-z, 0-9)"
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
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Confirm Password"
              placeholderTextColor={colors.placeholder}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              style={styles.eyeIcon}
            >
              <MaterialCommunityIcons
                name={showConfirmPassword ? 'eye-off' : 'eye'}
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Gender:</Text>
            <Picker
              selectedValue={gender}
              style={styles.picker}
              onValueChange={(itemValue) => setGender(itemValue)}
              itemStyle={Platform.OS === 'android' ? { fontSize: typography.body.fontSize, height: 100 } : {}}
            >
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Age (18-100)"
            placeholderTextColor={colors.placeholder}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Mobile Number (10 digits)"
            placeholderTextColor={colors.placeholder}
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            maxLength={10}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.cardBackground} />
            ) : (
              <Text style={styles.buttonText}>Register</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextHighlight}>Login Here</Text></Text>
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
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    width: '100%',
    maxWidth: 400,
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
  pickerContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    height: 50,
  },
  pickerLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  picker: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
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

export default RegisterScreen;

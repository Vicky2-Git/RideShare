// src/screens/Rides/CreateRideScreen.js
// Screen for providers to create new rides

import React, { useState, useContext, useEffect } from 'react';
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
  Switch,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext } from '../../context/AuthContext';
import { rideApi } from '../../utils/api';
import { colors, spacing, borderRadius, typography, shadow } from '../../styles/theme';

const CreateRideScreen = ({ navigation }) => {
  const { userToken, userRole } = useContext(AuthContext);

  const [vehicleCategory, setVehicleCategory] = useState('Car');
  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [breakLocations, setBreakLocations] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [rideCost, setRideCost] = useState('');
  const [womenOnly, setWomenOnly] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  // Android-only: two-step pickers (date then time)
  const [startPickerMode, setStartPickerMode] = useState('date'); // 'date' | 'time'
  const [endPickerMode, setEndPickerMode] = useState('date'); // 'date' | 'time'
  const [pendingStartDate, setPendingStartDate] = useState(null);
  const [pendingEndDate, setPendingEndDate] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default end time to 1 hour after start time
    const defaultEndTime = new Date(startTime);
    defaultEndTime.setHours(defaultEndTime.getHours() + 1);
    setEndTime(defaultEndTime);
  }, [startTime]);

  const handleStartTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      if (event && event.type === 'dismissed') {
        setShowStartTimePicker(false);
        setStartPickerMode('date');
        setPendingStartDate(null);
        return;
      }
      if (startPickerMode === 'date') {
        // Save the selected date, then open time picker
        const dateOnly = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
        setPendingStartDate(dateOnly);
        setStartPickerMode('time');
        setShowStartTimePicker(true);
        return;
      }
      // Time selected; combine with pending date
      setShowStartTimePicker(false);
      setStartPickerMode('date');
      const timePart = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      const base = pendingStartDate || new Date();
      const combined = new Date(base);
      combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
      const now = new Date();
      const safeStart = combined < now ? now : combined;
      setPendingStartDate(null);
      setStartTime(safeStart);
      // Ensure end time after start
      const candidateEnd = new Date(safeStart);
      candidateEnd.setHours(candidateEnd.getHours() + 1);
      setEndTime((prev) => {
        const prevEnd = prev instanceof Date ? prev : new Date(prev);
        return prevEnd > safeStart ? prevEnd : candidateEnd;
      });
      return;
    }
    // iOS or other platforms: single-step
    setShowStartTimePicker(false);
    if (!selectedDate) return;
    const newStart = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    const now = new Date();
    const safeStart = newStart < now ? now : newStart;
    setStartTime(safeStart);
    const candidateEnd = new Date(safeStart);
    candidateEnd.setHours(candidateEnd.getHours() + 1);
    setEndTime((prev) => {
      const prevEnd = prev instanceof Date ? prev : new Date(prev);
      return prevEnd > safeStart ? prevEnd : candidateEnd;
    });
  };

  const handleEndTimeChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      if (event && event.type === 'dismissed') {
        setShowEndTimePicker(false);
        setEndPickerMode('date');
        setPendingEndDate(null);
        return;
      }
      if (endPickerMode === 'date') {
        const dateOnly = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
        setPendingEndDate(dateOnly);
        setEndPickerMode('time');
        setShowEndTimePicker(true);
        return;
      }
      setShowEndTimePicker(false);
      setEndPickerMode('date');
      const timePart = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      const base = pendingEndDate || (startTime instanceof Date ? startTime : new Date(startTime));
      const combined = new Date(base);
      combined.setHours(timePart.getHours(), timePart.getMinutes(), 0, 0);
      const safeStart = startTime instanceof Date ? startTime : new Date(startTime);
      const minEnd = new Date(safeStart.getTime() + 60 * 1000);
      setPendingEndDate(null);
      setEndTime(combined >= minEnd ? combined : minEnd);
      return;
    }
    // iOS or other platforms
    setShowEndTimePicker(false);
    if (!selectedDate) return;
    const newEnd = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
    const safeStart = startTime instanceof Date ? startTime : new Date(startTime);
    const minEnd = new Date(safeStart.getTime() + 60 * 1000);
    setEndTime(newEnd >= minEnd ? newEnd : minEnd);
  };

  const formatTime = (date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCreateRide = async () => {
    // Validation
    if (!startPoint.trim()) {
      Alert.alert('Error', 'Please enter a start point.');
      return;
    }
    if (!destination.trim()) {
      Alert.alert('Error', 'Please enter a destination.');
      return;
    }
    if (!rideCost || parseFloat(rideCost) <= 0) {
      Alert.alert('Error', 'Please enter a valid ride cost.');
      return;
    }
    if (startTime >= endTime) {
      Alert.alert('Error', 'End time must be after start time.');
      return;
    }

    setLoading(true);
    try {
      const rideData = {
        vehicleCategory,
        startPoint: startPoint.trim(),
        destination: destination.trim(),
        breakLocations: breakLocations.trim() ? breakLocations.trim().split(',').map(loc => loc.trim()) : [],
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        rideCost: parseFloat(rideCost),
        womenOnly,
      };

      const response = await rideApi.createRide(rideData, userToken);
      
      Alert.alert(
        'Success!',
        'Ride created successfully!',
        [
          {
            text: 'View My Rides',
            onPress: () => navigation.navigate('Rides'),
          },
          {
            text: 'Create Another',
            onPress: () => {
              // Reset form
              setStartPoint('');
              setDestination('');
              setBreakLocations('');
              setRideCost('');
              setWomenOnly(false);
            },
          },
        ]
      );
    } catch (error) {
      console.error('Create ride error:', error);
      Alert.alert('Error', error.message || 'Failed to create ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.title}>Create New Ride</Text>
          <Text style={styles.subtitle}>Fill in the details for your ride offering</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Vehicle Category</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={vehicleCategory}
                style={styles.picker}
                onValueChange={(itemValue) => setVehicleCategory(itemValue)}
              >
                <Picker.Item label="Car" value="Car" />
                <Picker.Item label="Bike" value="Bike" />
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Point *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter start location"
              placeholderTextColor={colors.placeholder}
              value={startPoint}
              onChangeText={setStartPoint}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Destination *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter destination"
              placeholderTextColor={colors.placeholder}
              value={destination}
              onChangeText={setDestination}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Break Locations (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter break locations separated by commas"
              placeholderTextColor={colors.placeholder}
              value={breakLocations}
              onChangeText={setBreakLocations}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Time *</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Time *</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ride Cost (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter ride cost"
              placeholderTextColor={colors.placeholder}
              value={rideCost}
              onChangeText={setRideCost}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.label}>Women Only Ride</Text>
            <Switch
              value={womenOnly}
              onValueChange={setWomenOnly}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={womenOnly ? colors.cardBackground : colors.textSecondary}
            />
          </View>

          <TouchableOpacity
            style={[styles.createButton, loading && styles.disabledButton]}
            onPress={handleCreateRide}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.cardBackground} />
            ) : (
              <Text style={styles.createButtonText}>Create Ride</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode={Platform.OS === 'android' ? startPickerMode : 'datetime'}
          display={Platform.OS === 'android' ? 'default' : 'spinner'}
          onChange={handleStartTimeChange}
          minimumDate={new Date()}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode={Platform.OS === 'android' ? endPickerMode : 'datetime'}
          display={Platform.OS === 'android' ? 'default' : 'spinner'}
          onChange={handleEndTimeChange}
          minimumDate={new Date((startTime instanceof Date ? startTime : new Date(startTime)).getTime() + 60 * 1000)}
        />
      )}
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
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
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
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.h4,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  input: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  picker: {
    height: 50,
  },
  timeButton: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
  },
  timeButtonText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  createButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.button,
  },
  createButtonText: {
    color: colors.cardBackground,
    ...typography.h2,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    ...typography.h2,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CreateRideScreen;

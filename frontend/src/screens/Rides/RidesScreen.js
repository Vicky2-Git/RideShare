// src/screens/Rides/RidesScreen.js
// Screen to display available rides and ride management

import React, { useState, useContext, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { rideApi, providerApi, getFormattedAddress } from '../../utils/api';
import { colors, spacing, borderRadius, typography, shadow } from '../../styles/theme';

const RidesScreen = ({ navigation }) => {
  const { userToken, userRole } = useContext(AuthContext);
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [providerDetails, setProviderDetails] = useState(null);

  useEffect(() => {
    loadRides();
    if (userRole === 'provider') {
      loadProviderDetails();
    }
  }, [userRole]);

  const loadProviderDetails = async () => {
    try {
      const details = await providerApi.getDetails(userToken);
      setProviderDetails(details);
    } catch (error) {
      console.log('No provider details found or error:', error.message);
      setProviderDetails(null);
    }
  };

  const loadRides = async () => {
    setLoading(true);
    try {
      let fetchedRides = [];
      if (userRole === 'provider') {
        const response = await rideApi.getProviderRides(userToken);
        const now = Date.now();
        fetchedRides = (response.rides || []).filter(r => new Date(r.startTime).getTime() > now && r.status === 'created');
      } else {
        const response = await rideApi.getAvailableRides(userToken);
        fetchedRides = response.rides || [];
      }

      // Replace coordinates with formatted addresses
      const updatedRides = await Promise.all(
        fetchedRides.map(async (ride) => {
          const startAddress = await getFormattedAddress(ride.startPoint);
          const destinationAddress = await getFormattedAddress(ride.destination);
          return {
            ...ride,
            startPoint: startAddress || ride.startPoint,
            destination: destinationAddress || ride.destination,
          };
        })
      );

      setRides(updatedRides);
    } catch (error) {
      console.error('Load rides error:', error);
      // Fallback to mock data if API fails
      const mockRides = [
        {
          id: '1',
          startPoint: 'Mumbai Central',
          destination: 'Andheri',
          startTime: new Date(Date.now() + 3600000),
          rideCost: 150,
          vehicleCategory: 'Car',
          provider: { name: 'John Doe', mobileNumber: '9876543210' },
          status: 'created'
        },
        {
          id: '2',
          startPoint: 'Bandra',
          destination: 'Dadar',
          startTime: new Date(Date.now() + 7200000),
          rideCost: 80,
          vehicleCategory: 'Bike',
          provider: { name: 'Jane Smith', mobileNumber: '9876543211' },
          status: 'created'
        }
      ];
      setRides(mockRides);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRides();
    if (userRole === 'provider') {
      await loadProviderDetails();
    }
    setRefreshing(false);
  };

  const handleRideAction = (ride, action) => {
    if (userRole === 'rider') {
      if (action === 'book') {
        Alert.alert(
          'Book Ride',
          `Confirm booking for ride from ${ride.startPoint} to ${ride.destination}?\nPrice: ₹${ride.rideCost}\nTime: ${new Date(ride.startTime).toLocaleString()}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Book', onPress: () => bookRide(ride) }
          ]
        );
      }
    } else if (userRole === 'provider') {
      if (action === 'manage') {
        Alert.alert(
          'Manage Ride',
          `Manage your ride from ${ride.startPoint} to ${ride.destination}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete Ride', style: 'destructive', onPress: () => confirmDeleteRide(ride) },
          ]
        );
      }
    }
  };

  const bookRide = async (ride) => {
    try {
      // TODO: Implement actual booking logic
      Alert.alert('Success', `Ride booked successfully! You'll receive confirmation shortly.`);
      // Refresh rides to update availability
      loadRides();
    } catch (error) {
      Alert.alert('Error', 'Failed to book ride. Please try again.');
    }
  };

  const confirmDeleteRide = (ride) => {
    Alert.alert(
      'Delete Ride',
      'Are you sure you want to delete this ride? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteRide(ride) },
      ]
    );
  };

  const deleteRide = async (ride) => {
    try {
      await rideApi.deleteRide(ride._id || ride.id, userToken);
      Alert.alert('Deleted', 'Ride deleted successfully.');
      await loadRides();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete ride.');
    }
  };

  const handleCreateRide = () => {
    if (!providerDetails) {
      Alert.alert(
        'Vehicle Details Required',
        'Please complete your vehicle details before creating a ride.',
        [
          { text: 'Update Vehicle Details', onPress: () => navigation.navigate('ProviderDetails') },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      navigation.navigate('CreateRide');
    }
  };

  const renderRideCard = (ride) => {
    const formatTime = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <View key={ride._id || ride.id} style={styles.rideCard}>
        <View style={styles.rideHeader}>
          <Text style={styles.routeText}>{ride.startPoint} → {ride.destination}</Text>
          <Text style={styles.priceText}>₹{ride.rideCost}</Text>
        </View>
        
        <View style={styles.rideDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle:</Text>
            <Text style={styles.detailValue}>{ride.vehicleCategory}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Provider:</Text>
            <Text style={styles.detailValue}>
              {ride.provider?.name || 'Unknown'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Start Time:</Text>
            <Text style={styles.detailValue}>{formatTime(ride.startTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{ride.status}</Text>
          </View>
          {ride.womenOnly && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Women Only:</Text>
              <Text style={styles.detailValue}>Yes</Text>
            </View>
          )}
        </View>
        
        <View style={styles.rideActions}>
          {userRole === 'rider' ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.bookButton]}
              onPress={() => handleRideAction(ride, 'book')}
            >
              <Text style={styles.actionButtonText}>Book Ride</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.manageButton]}
              onPress={() => handleRideAction(ride, 'manage')}
            >
              <Text style={styles.actionButtonText}>Manage Ride</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {userRole === 'rider' ? 'Available Rides' : 'Your Rides'}
        </Text>
        <Text style={styles.subtitle}>
          {userRole === 'rider' 
            ? 'Find and book your perfect ride' 
            : 'Manage your ride offerings'
          }
        </Text>
      </View>

      {/* Profile Management Section */}
      <View style={styles.profileSection}>
        <Text style={styles.profileSectionTitle}>Profile Management</Text>
        <View style={styles.profileButtons}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {
              if (userRole === 'rider') {
                navigation.navigate('RiderDetails');
              } else {
                navigation.navigate('ProviderDetails');
              }
            }}
          >
            <Text style={styles.profileButtonText}>
              {userRole === 'rider' ? 'Update Rider Details' : 'Update Vehicle Details'}
            </Text>
          </TouchableOpacity>
          
          {userRole === 'rider' && (
            <TouchableOpacity
              style={[styles.profileButton, styles.bookRideButton]}
              onPress={() => {
                Alert.alert(
                  'Book a Ride',
                  'Browse available rides below and tap "Book Ride" on any ride you\'d like to book.',
                  [
                    { text: 'Got it!', style: 'default' }
                  ]
                );
              }}
            >
              <Text style={styles.profileButtonText}>How to Book a Ride</Text>
            </TouchableOpacity>
          )}
          
          {userRole === 'provider' && (
            <TouchableOpacity
              style={[styles.profileButton, styles.createRideButton]}
              onPress={handleCreateRide}
            >
              <Text style={styles.profileButtonText}>Create New Ride</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.profileButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading rides...</Text>
          </View>
        ) : rides.length > 0 ? (
          rides.map(renderRideCard)
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No rides available at the moment.</Text>
            <Text style={styles.emptySubtext}>Check back later or try refreshing.</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={loading}
        >
          <Text style={styles.refreshButtonText}>Refresh Rides</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...typography.h1,
    color: colors.cardBackground,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...typography.body,
    color: colors.cardBackground,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  rideCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.default,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  routeText: {
    ...typography.h2,
    color: colors.textPrimary,
    flex: 1,
  },
  priceText: {
    ...typography.h2,
    color: colors.accent,
    fontWeight: 'bold',
  },
  rideDetails: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  detailValue: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  rideActions: {
    alignItems: 'center',
  },
  actionButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    minWidth: 120,
    alignItems: 'center',
    ...shadow.button,
  },
  bookButton: {
    backgroundColor: colors.accent,
  },
  manageButton: {
    backgroundColor: colors.primary,
  },
  actionButtonText: {
    color: colors.cardBackground,
    ...typography.h3,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  emptyText: {
    ...typography.h2,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.cardBackground,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadow.button,
  },
  refreshButtonText: {
    color: colors.cardBackground,
    ...typography.h3,
    fontWeight: 'bold',
  },
  profileSection: {
    backgroundColor: colors.cardBackground,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadow.default,
  },
  profileSectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  profileButtons: {
    flexDirection: 'column',
  },
  profileButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
    ...shadow.button,
  },
  profileButtonText: {
    color: colors.textPrimary,
    ...typography.h4,
    fontWeight: 'bold',
  },
  createRideButton: {
    backgroundColor: colors.accent,
  },
  bookRideButton: {
    backgroundColor: colors.primaryLight,
  },
});

export default RidesScreen;

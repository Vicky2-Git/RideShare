import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Dimensions, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '../../config/visionConfig';

const INITIAL_REGION = {
  latitude: 11.0168, // Coimbatore
  longitude: 76.9558,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MapScreen = ({ onSelectLocation, mode, onCancel }) => {
  const [startLocation, setStartLocation] = useState(null);
  const [endLocation, setEndLocation] = useState(null);
  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  const [mapRegion, setMapRegion] = useState(INITIAL_REGION); // Add state for map region

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasPermission(true);
      } else {
        console.error('Location permission not granted');
      }
    };

    requestPermissions();
  }, []);

  const fetchAddress = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return data.results[0].formatted_address;
      } else {
        console.warn('No address found for the location');
        return 'Unknown Address';
      }
    } catch (error) {
      console.error('Failed to fetch address:', error);
      return 'Error fetching address';
    }
  };

  const handlePress = async (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    if (!startLocation) {
      setStartLocation({ latitude, longitude });
      const address = await fetchAddress(latitude, longitude);
      setStartAddress(address);
      onSelectLocation({ latitude, longitude, address });
    } else if (!endLocation) {
      setEndLocation({ latitude, longitude });
      const address = await fetchAddress(latitude, longitude);
      setEndAddress(address);
      onSelectLocation({ latitude, longitude, address });
    }

    // Update the UI to show the place names instead of numbers
    console.log('Start Address:', startAddress);
    console.log('End Address:', endAddress);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider="google"
        region={mapRegion} // Use region instead of initialRegion
        onRegionChangeComplete={(region) => setMapRegion(region)} // Update region state on map movement
        onPress={handlePress} // Handle map press to select location
      >
        {startLocation && (
          <Marker
            coordinate={startLocation}
            title="Start Location"
            description={startAddress || 'Fetching address...'}
            pinColor="green"
          />
        )}
        {endLocation && (
          <Marker
            coordinate={endLocation}
            title="End Location"
            description={endAddress || 'Fetching address...'}
            pinColor="red"
          />
        )}
      </MapView>

      <View style={styles.addressContainer}>
        {startAddress && <Text style={styles.addressText}>Start Location: {startAddress}</Text>}
        {endAddress && <Text style={styles.addressText}>End Location: {endAddress}</Text>}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  addressContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  addressText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
  },
  cancelButton: {
    backgroundColor: 'red',
    padding: 10,
    borderRadius: 5,
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MapScreen;
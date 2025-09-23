// src/utils/api.js
// Centralized API utility for making requests to the backend.

import AsyncStorage from '@react-native-async-storage/async-storage';

// --- API Base URL ---
// IMPORTANT: Adjust this based on your development environment.
// - For Android Emulator: 'http://10.0.2.2:5000/api'
// - For Physical Android Device: 'http://YOUR_LOCAL_IP_ADDRESS:5000/api' (e.g., 'http://192.168.1.100:5000/api')
// - For iOS Simulator/Device: 'http://localhost:5000/api' (or your local IP)
// - For Web (if you ever build a web version with Expo): 'http://localhost:5000/api'
// - For Expo Go app: Use your machine's IP address
const API_BASE_URL = 'http://192.168.29.117:5000/api'; // Updated for current network

// Generic function to make API calls
export const apiCall = async (endpoint, method = 'GET', data = null, token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  // Add authorization token if provided
  if (token) {
    headers['x-auth-token'] = token;
  }

  const config = {
    method,
    headers,
  };

  // Add request body for POST/PUT methods
  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    let responseData;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        // Handle non-JSON responses (like HTML error pages)
        const textResponse = await response.text();
        console.error('Non-JSON response received:', textResponse.substring(0, 200));
        
        if (response.status >= 400) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}. Please check if the backend server is running.`);
        } else {
          throw new Error('Server returned an invalid response format. Please try again.');
        }
      }
    } catch (parseError) {
      console.error('Response parsing error:', parseError);
      if (response.status >= 400) {
        throw new Error(`Server error (${response.status}): Unable to parse response. Please check if the backend server is running.`);
      } else {
        throw new Error('Invalid response from server. Please try again.');
      }
    }

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        throw new Error('Token is invalid or expired. Please login again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      } else if (response.status === 404) {
        throw new Error('Resource not found.');
      } else if (response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw new Error(responseData.message || `Request failed with status ${response.status}`);
      }
    }

    return responseData;
  } catch (error) {
    console.error(`API Call Error (${endpoint}):`, error.message);
    
    // If it's a token error, we should clear the token
    if (error.message.includes('Token is invalid') || error.message.includes('expired')) {
      // Clear token from storage - this will trigger logout
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userRole');
      } catch (storageError) {
        console.error('Failed to clear invalid token:', storageError);
      }
    }
    
    throw error;
  }
};

// Auth API functions
export const authApi = {
  register: (userData) => apiCall('/auth/register', 'POST', userData),
  login: (credentials) => apiCall('/auth/login', 'POST', credentials),
  getProfile: (token) => apiCall('/auth/me', 'GET', null, token),
  updateRole: (role, token) => apiCall('/auth/role', 'PUT', { role }, token),
};

// MODIFIED: Ensure these are correctly exported
export const providerApi = {
  saveDetails: (details, token) => apiCall('/provider/details', 'POST', details, token),
  getDetails: (token) => apiCall('/provider/details', 'GET', null, token),
};

// MODIFIED: Ensure these are correctly exported
export const riderApi = {
  saveDetails: (details, token) => apiCall('/rider/details', 'POST', details, token),
  getDetails: (token) => apiCall('/rider/details', 'GET', null, token),
};

// Ride API functions
export const rideApi = {
  createRide: (rideData, token) => apiCall('/ride', 'POST', rideData, token),
  getAvailableRides: (token) => apiCall('/rides', 'GET', null, token),
  getProviderRides: (token) => apiCall('/provider/rides', 'GET', null, token),
  bookRide: (rideId, token) => apiCall(`/rides/book/${rideId}`, 'POST', null, token),
  deleteRide: (rideId, token) => apiCall(`/provider/rides/${rideId}`, 'DELETE', null, token),
};

// Updated API key for Google Maps Geocoding API
export const getFormattedAddress = async (coordinates) => {
  const GOOGLE_MAPS_API_KEY = 'AIzaSyCAgmdjzn-ANlzIcc8UKhP0IHQtgGiesXg'; // Updated API key

  // Validate coordinates
  if (!coordinates || typeof coordinates !== 'string' || !coordinates.includes(',')) {
    console.error('Invalid coordinates format:', coordinates);
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates}&key=${GOOGLE_MAPS_API_KEY}`;

  console.log('Fetching address for coordinates:', coordinates);
  console.log('Geocoding API URL:', url);

  try {
    const response = await fetch(url);
    const data = await response.json();

    console.log('Geocoding API response:', data);

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    } else {
      console.error('Geocoding API error:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Failed to fetch address:', error);
    return null;
  }
};

// src/context/AuthContext.js
// This file defines the AuthContext and AuthProvider for managing user authentication state.

import React, { useState, useEffect, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For storing JWT token and user role

// Create the AuthContext
export const AuthContext = createContext();

// AuthProvider component to wrap your application and provide authentication state
export const AuthProvider = ({ children }) => {
  const [userToken, setUserToken] = useState(null); // Stores the JWT token
  const [userRole, setUserRole] = useState(null);   // Stores the user's role (rider/provider)
  const [isLoading, setIsLoading] = useState(true); // Indicates if authentication state is being loaded

  // Function to sign in the user: stores token and role in AsyncStorage and updates state
  const signIn = async (token, role) => {
    try {
      if (!token) {
        throw new Error('Token is required for sign-in');
      }
      if (!role) {
        throw new Error('User role is required for sign-in');
      }
      
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userRole', role);
      setUserToken(token);
      setUserRole(role);
    } catch (e) {
      console.error('AuthContext: Failed to store token/role during sign-in', e);
      // Optionally, show an alert to the user
    }
  };

  // Function to sign out the user: removes token and role from AsyncStorage and clears state
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      setUserToken(null);
      setUserRole(null);
    } catch (e) {
      console.error('AuthContext: Failed to remove token/role during sign-out', e);
      // Optionally, show an alert to the user
    }
  };

  // Function to restore token and role from AsyncStorage on app start
  const restoreToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const role = await AsyncStorage.getItem('userRole');
      setUserToken(token);
      setUserRole(role);
    } catch (e) {
      console.error('AuthContext: Failed to restore token from AsyncStorage', e);
    } finally {
      setIsLoading(false); // Authentication state has been checked
    }
  };

  // useEffect hook to run restoreToken once when the component mounts
  useEffect(() => {
    restoreToken();
  }, []);

  // Provide the authentication state and functions to children components
  return (
    <AuthContext.Provider value={{ userToken, userRole, signIn, signOut, setUserRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

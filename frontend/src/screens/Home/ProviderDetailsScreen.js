// src/screens/Home/ProviderDetailsScreen.js
// Final fix for camera and upload permissions and graceful error handling for new users.

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
  Image,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../../context/AuthContext';
import { providerApi } from '../../utils/api';
import { visionApi } from '../../services/visionApi';
import { colors, spacing, borderRadius, typography, shadow } from '../../styles/theme';
import { matchAadhaar, matchRcNumber, matchLicenseNumber } from '../../utils/fuzzyMatch';

const ProviderDetailsScreen = ({ navigation }) => {
  const { userToken, userRole } = useContext(AuthContext);

  const [vehicleCategory, setVehicleCategory] = useState('Car');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [rcNumber, setRcNumber] = useState('');
  const [insuranceNumber, setInsuranceNumber] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [aadharNumber, setAadharNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Sedan');
  const [isPreviouslyUsedVehicle, setIsPreviouslyUsedVehicle] = useState(false);

  const [vehiclePhoto, setVehiclePhoto] = useState(null);
  const [rcPhoto, setRcPhoto] = useState(null);
  const [licensePhoto, setLicensePhoto] = useState(null);
  const [aadharPhoto, setAadharPhoto] = useState(null);

  const [rcVerified, setRcVerified] = useState(false);
  const [insuranceVerified, setInsuranceVerified] = useState(false);
  const [licenseVerified, setLicenseVerified] = useState(false);
  const [aadharVerified, setAadharVerified] = useState(false);
  const [ocrDetails, setOcrDetails] = useState({});
  const [extractedRc, setExtractedRc] = useState('');
  const [extractedAadhaar, setExtractedAadhaar] = useState('');

  const [loading, setLoading] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(true);

  // New state to hold permission statuses
  const [mediaLibraryPermission, setMediaLibraryPermission] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);

  useEffect(() => {
    // FIX: Request both permissions when the component mounts
    const requestPermissions = async () => {
      try {
        console.log('Requesting permissions...');
      const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('Media library permission status:', mediaStatus.status);
      setMediaLibraryPermission(mediaStatus.status === 'granted');
        
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
        console.log('Camera permission status:', cameraStatus.status);
      setCameraPermission(cameraStatus.status === 'granted');
      } catch (error) {
        console.error('Error requesting permissions:', error);
        Alert.alert('Permission Error', 'Failed to request permissions. Please try again.');
      }
    };
    requestPermissions();

    const fetchDetails = async () => {
      if (userToken && userRole === 'provider') {
        try {
          const existingDetails = await providerApi.getDetails(userToken);
          if (existingDetails) {
            // Only set vehicle category and type, don't auto-fill text fields
            setVehicleCategory(existingDetails.vehicleCategory || 'Car');
            setVehicleType(existingDetails.vehicleType || 'Sedan');
            setIsPreviouslyUsedVehicle(existingDetails.isPreviouslyUsedVehicle || false);

            // Set photos if they exist
            setVehiclePhoto(existingDetails.vehiclePhotoUrl ? { uri: existingDetails.vehiclePhotoUrl } : null);
            setRcPhoto(existingDetails.rcPhotoUrl ? { uri: existingDetails.rcPhotoUrl } : null);
            setLicensePhoto(existingDetails.licensePhotoUrl ? { uri: existingDetails.licensePhotoUrl } : null);
            setAadharPhoto(existingDetails.aadharPhotoUrl ? { uri: existingDetails.aadharPhotoUrl } : null);

            // Set verification statuses
            setRcVerified(existingDetails.rcVerified);
            setInsuranceVerified(existingDetails.insuranceVerified);
            setLicenseVerified(existingDetails.licenseVerified);
            setAadharVerified(existingDetails.aadharVerified);
            
            // Set OCR details if available
            setOcrDetails({
              name: existingDetails.ocrExtractedName,
              licenseNumber: existingDetails.ocrExtractedLicenseNumber,
              dob: existingDetails.ocrExtractedDob,
              validity: existingDetails.ocrExtractedValidity,
            });
            setExtractedRc(existingDetails.ocrExtractedRcNumber || '');
            setExtractedAadhaar(existingDetails.ocrExtractedAadhaarNumber || '');
            
            // Don't auto-fill text input fields - let users enter them manually
            // setVehicleNumber, setRcNumber, setInsuranceNumber, setLicenseNumber, setAadharNumber
          }
        } catch (error) {
          console.error('Failed to fetch provider details:', error);
          // FIX: Only show an alert for a real error (not a 404 Not Found)
          if (error.message !== 'Provider details not found.') {
             Alert.alert('Error', 'Could not load existing details. Please try again.');
          }
        } finally {
          setFetchingDetails(false);
        }
      } else {
        setFetchingDetails(false);
      }
    };
    fetchDetails();
  }, [userToken, userRole]);

  const pickImage = async (setImageFunction, documentType = null) => {
    console.log('pickImage called, mediaLibraryPermission:', mediaLibraryPermission);
    console.log('Document type:', documentType);
    
    if (!mediaLibraryPermission) {
      console.log('No media library permission, requesting...');
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        console.log('New media library permission status:', status);
        setMediaLibraryPermission(status === 'granted');
        
        if (status !== 'granted') {
      Alert.alert('Permission required', 'Media library permission is required to upload photos!');
      return;
    }
      } catch (error) {
        console.error('Error requesting media library permission:', error);
        Alert.alert('Permission Error', 'Failed to request media library permission.');
        return;
      }
    }

    try {
      console.log('Launching image picker...');
      console.log('ImagePicker object:', ImagePicker);
      console.log('ImagePicker methods:', Object.keys(ImagePicker));
      
    let result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });
      
      console.log('Image picker result:', result);
      console.log('Result canceled:', result.canceled);
      console.log('Result assets:', result.assets);
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log('Image selected, setting image...');
        const imageData = { uri: result.assets[0].uri, base64: result.assets[0].base64 };
        console.log('Image data URI length:', imageData.uri ? imageData.uri.length : 'No URI');
        console.log('Image data base64 length:', imageData.base64 ? imageData.base64.length : 'No base64');
        setImageFunction(imageData);
        
        // Perform OCR verification if document type is specified
        if (documentType && imageData.base64) {
          try {
            console.log(`Performing OCR verification for ${documentType}...`);
            
            // Check if Vision API is configured
            if (!visionApi.isConfigured()) {
              Alert.alert(
                'OCR Not Available', 
                'Document analysis is not configured. Please contact support to enable this feature.\n\nFor now, you can manually enter the document details.',
                [{ text: 'OK', style: 'default' }]
              );
              return;
            }
            
            // Show OCR progress
            Alert.alert('OCR Processing', 'Analyzing document... Please wait.');
            
            switch (documentType) {
              case 'license':
                const licenseInfo = await visionApi.extractLicenseInfo(imageData.base64);
                if (licenseInfo) {
                  setOcrDetails(licenseInfo);
                  // Auto-fill license number if found
                  if (licenseInfo.licenseNumber) {
                    setLicenseNumber(licenseInfo.licenseNumber);
                    // Show data matching result
                    Alert.alert(
                      'OCR Success - License', 
                      `✅ Document Successfully Analyzed!\n\n📋 Extracted Data:\n• Name: ${licenseInfo.name || 'Not found'}\n• License: ${licenseInfo.licenseNumber}\n• DOB: ${licenseInfo.dob || 'Not found'}\n• Validity: ${licenseInfo.validity || 'Not found'}\n\n🔍 Auto-fill Status:\n• License number has been auto-filled\n\n⚠️ Please verify the extracted data matches your document exactly.`
                    );
                  }
                } else {
                  Alert.alert('OCR Warning', 'Could not extract license information. Please ensure the image is clear and contains readable text.');
                }
                break;
                
              case 'rc':
                const rcInfo = await visionApi.extractRCInfo(imageData.base64);
                if (rcInfo && rcInfo.rcNumber) {
                  setRcNumber(rcInfo.rcNumber);
                  setExtractedRc(rcInfo.rcNumber);
                  Alert.alert(
                    'OCR Success - RC', 
                    `✅ Document Successfully Analyzed!\n\n📋 Extracted Data:\n• RC Number: ${rcInfo.rcNumber}\n\n🔍 Auto-fill Status:\n• RC number has been auto-filled\n\n⚠️ Please verify the extracted RC number matches your document exactly.`
                  );
                } else {
                  Alert.alert('OCR Warning', 'Could not extract RC number. Please ensure the image is clear and contains readable text.');
                }
                break;
                
              case 'aadhar':
                const aadharInfo = await visionApi.extractAadharInfo(imageData.base64);
                if (aadharInfo && aadharInfo.aadhaarNumber) {
                  setAadharNumber(aadharInfo.aadhaarNumber);
                  setExtractedAadhaar(aadharInfo.aadhaarNumber);
                  Alert.alert(
                    'OCR Success - Aadhaar', 
                    `✅ Document Successfully Analyzed!\n\n📋 Extracted Data:\n• Aadhaar Number: ${aadharInfo.aadhaarNumber}\n\n🔍 Auto-fill Status:\n• Aadhaar number has been auto-filled\n\n⚠️ Please verify the extracted Aadhaar number matches your document exactly.`
                  );
                } else {
                  Alert.alert('OCR Warning', 'Could not extract Aadhaar number. Please ensure the image is clear and contains readable text.');
                }
                break;
                
              default:
                break;
            }
          } catch (ocrError) {
            console.error('OCR verification failed:', ocrError);
            
            // Handle specific OCR errors
            if (ocrError.message.includes('API key not configured')) {
              Alert.alert(
                'OCR Not Configured', 
                'Document analysis is not properly configured. Please contact support.\n\nFor now, you can manually enter the document details.',
                [{ text: 'OK', style: 'default' }]
              );
            } else if (ocrError.message.includes('Failed to extract text')) {
              Alert.alert(
                'OCR Failed', 
                'Could not read text from the image. Please ensure:\n• Image is clear and well-lit\n• Text is readable\n• Document is not damaged\n\nYou can still manually enter the details.',
                [{ text: 'OK', style: 'default' }]
              );
            } else {
              Alert.alert(
                'OCR Error', 
                'Document analysis failed. Please try again with a clearer image or enter details manually.',
                [{ text: 'OK', style: 'default' }]
              );
            }
          }
        }
      } else {
        console.log('Image selection canceled or no assets');
      }
    } catch (error) {
      console.error('Error in pickImage:', error);
      // Try fallback approach if the first method fails
      try {
        console.log('Trying fallback image picker method...');
        let fallbackResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
        
        if (!fallbackResult.canceled && fallbackResult.assets && fallbackResult.assets.length > 0) {
          console.log('Fallback image picker successful');
          const imageData = { uri: fallbackResult.assets[0].uri, base64: fallbackResult.assets[0].base64 };
          setImageFunction(imageData);
          
          // Perform OCR verification if document type is specified
          if (documentType && imageData.base64) {
            // ... OCR logic would go here (same as above)
            console.log('OCR verification would proceed with fallback method');
          }
        }
      } catch (fallbackError) {
        console.error('Fallback image picker also failed:', fallbackError);
        Alert.alert('Error', 'Failed to pick image. Please try again or restart the app.');
      }
    }
  };

  const takeLivePhoto = async (setImageFunction) => {
    if (!cameraPermission) {
      Alert.alert('Permission required', 'Camera permission is required to take photos!');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (!result.canceled) {
      setImageFunction({ uri: result.assets[0].uri, base64: result.assets[0].base64 });
    }
  };

  const handleSaveDetails = async () => {
    // Check mismatches before save
    const rcMismatch = extractedRc && rcNumber && !matchRcNumber(rcNumber, extractedRc).isMatch;
    const licMismatch = ocrDetails?.licenseNumber && licenseNumber && !matchLicenseNumber(licenseNumber, ocrDetails.licenseNumber).isMatch;
    const aadMismatch = extractedAadhaar && aadharNumber && !matchAadhaar(aadharNumber, extractedAadhaar).isMatch;
    if (rcMismatch || licMismatch || aadMismatch) {
      Alert.alert('Mismatch detected', 'Your entered values do not match the extracted document data. Please review the highlighted mismatches shown below and correct them before continuing.');
      return;
    }
    setLoading(true);
    try {
      const details = {
        vehicleCategory, vehicleNumber, rcNumber, insuranceNumber, licenseNumber, aadharNumber,
        vehicleType: vehicleCategory === 'Car' ? vehicleType : undefined,
        isPreviouslyUsedVehicle,
        vehiclePhotoUrl: vehiclePhoto ? `data:image/jpeg;base64,${vehiclePhoto.base64}` : null,
        rcPhotoUrl: rcPhoto ? `data:image/jpeg;base64,${rcPhoto.base64}` : null,
        licensePhotoUrl: licensePhoto ? `data:image/jpeg;base64,${licensePhoto.base64}` : null,
        aadharPhotoUrl: aadharPhoto ? `data:image/jpeg;base64,${aadharPhoto.base64}` : null,
      };
      
      const data = await providerApi.saveDetails(details, userToken);
      
      // Show success with OCR verification summary
      let ocrSummary = '';
      if (ocrDetails.name || ocrDetails.licenseNumber || ocrDetails.dob || ocrDetails.validity) {
        ocrSummary = '\n\nOCR Verification Summary:\n';
        if (ocrDetails.name) ocrSummary += `• Name: ${ocrDetails.name}\n`;
        if (ocrDetails.licenseNumber) ocrSummary += `• License: ${ocrDetails.licenseNumber}\n`;
        if (ocrDetails.dob) ocrSummary += `• DOB: ${ocrDetails.dob}\n`;
        if (ocrDetails.validity) ocrSummary += `• Validity: ${ocrDetails.validity}\n`;
      }
      
      Alert.alert(
        'Success!', 
        `${data.message}${ocrSummary}\n\nAll details have been saved successfully. You can now provide rides!`,
        [
          {
            text: 'Continue to Rides',
            onPress: () => {
              // Navigate to rides page or show available rides
              navigation.navigate('Rides');
            }
          },
          {
            text: 'Stay Here',
            style: 'cancel'
          }
        ]
      );
      
      setRcVerified(data.providerDetails.rcVerified);
      setInsuranceVerified(data.providerDetails.insuranceVerified);
      setLicenseVerified(data.providerDetails.licenseVerified);
      setAadharVerified(data.providerDetails.aadharVerified);
      setOcrDetails({
        name: data.providerDetails.ocrExtractedName, 
        licenseNumber: data.providerDetails.ocrExtractedLicenseNumber,
        dob: data.providerDetails.ocrExtractedDob, 
        validity: data.providerDetails.ocrExtractedValidity,
      });
    } catch (error) {
      console.error('Save provider details error:', error);
      Alert.alert('Error', error.message || 'Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingDetails) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading provider details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Vehicle & Driver Details</Text>
          <Text style={styles.subtitle}>Complete your profile to start providing rides</Text>

          {/* Quick Navigation Section */}
          <View style={styles.navigationSection}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigation.navigate('Rides')}
            >
              <Text style={styles.navButtonText}>← Back to Rides</Text>
            </TouchableOpacity>
          </View>

          {/* Vehicle Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
            <Text style={styles.sectionSubtitle}>Tell us about your vehicle</Text>
            
            <View style={styles.vehicleTypeRow}>
              <View style={styles.pickerGroup}>
                <Text style={styles.inputLabel}>Vehicle Category</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={vehicleCategory}
              style={styles.picker}
              onValueChange={(itemValue) => setVehicleCategory(itemValue)}
                    itemStyle={Platform.OS === 'android' ? { fontSize: 16, height: 50 } : {}}
            >
              <Picker.Item label="Car" value="Car" />
              <Picker.Item label="Bike" value="Bike" />
            </Picker>
          </View>
              </View>

          {vehicleCategory === 'Car' && (
                <View style={styles.pickerGroup}>
                  <Text style={styles.inputLabel}>Vehicle Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={vehicleType}
                  style={styles.picker}
                  onValueChange={(itemValue) => setVehicleType(itemValue)}
                      itemStyle={Platform.OS === 'android' ? { fontSize: 16, height: 50 } : {}}
                >
                  <Picker.Item label="Sedan (4-seater)" value="Sedan" />
                  <Picker.Item label="SUV (4-seater)" value="SUV" />
                  <Picker.Item label="Mini Van (6-seater)" value="Mini Van" />
                  <Picker.Item label="Luxury Car (4-seater)" value="Luxury Car" />
                </Picker>
              </View>
                </View>
          )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Number</Text>
          <TextInput
            style={styles.input}
                placeholder="Enter vehicle number"
            placeholderTextColor={colors.placeholder}
            value={vehicleNumber}
            onChangeText={setVehicleNumber}
            autoCapitalize="characters"
          />
            </View>

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsPreviouslyUsedVehicle(!isPreviouslyUsedVehicle)}
              >
                <Text style={styles.checkboxIcon}>
                  {isPreviouslyUsedVehicle ? '✓' : ''}
                </Text>
              </TouchableOpacity>
              <Text style={styles.checkboxText}>This is a previously used vehicle</Text>
            </View>
          </View>

          {/* Document Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Verification</Text>
            <Text style={styles.sectionSubtitle}>Upload required documents for verification</Text>
            
            {/* OCR Status Message */}
            {!visionApi.isConfigured() && (
              <View style={styles.ocrStatusMessage}>
                <Text style={styles.ocrStatusText}>
                  📝 <Text style={styles.ocrStatusBold}>Document Analysis:</Text> Currently unavailable. 
                  Please manually enter your document details below.
                </Text>
              </View>
            )}

            <View style={styles.documentGrid}>
              <View style={styles.documentItem}>
                <Text style={styles.documentLabel}>RC Book</Text>
                <View style={styles.uploadContainer}>
            <TextInput
                    style={styles.documentInput}
              placeholder="RC Number"
              placeholderTextColor={colors.placeholder}
              value={rcNumber}
              onChangeText={setRcNumber}
            />
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={() => pickImage(setRcPhoto, 'rc')}
                  >
                    <Text style={styles.uploadIcon}>📷</Text>
            </TouchableOpacity>
                </View>
                {rcPhoto && <Image source={{ uri: rcPhoto.uri }} style={styles.documentThumbnail} />}
                {extractedRc ? (
                  <Text style={styles.extractedText}>Extracted: {extractedRc}{rcNumber && !matchRcNumber(rcNumber, extractedRc).isMatch ? ' • Mismatch' : ''}</Text>
                ) : null}
                {rcVerified && <Text style={[styles.verifiedBadge, styles.verifiedBadgeText]}>✓ Verified</Text>}
          </View>

              <View style={styles.documentItem}>
                <Text style={styles.documentLabel}>Insurance</Text>
                <View style={styles.uploadContainer}>
            <TextInput
                    style={styles.documentInput}
              placeholder="Insurance Number"
              placeholderTextColor={colors.placeholder}
              value={insuranceNumber}
              onChangeText={setInsuranceNumber}
            />
                </View>
                {insuranceVerified && <Text style={[styles.verifiedBadge, styles.verifiedBadgeText]}>✓ Verified</Text>}
          </View>

              <View style={styles.documentItem}>
                <Text style={styles.documentLabel}>Driving License</Text>
                <View style={styles.uploadContainer}>
            <TextInput
                    style={styles.documentInput}
              placeholder="License Number"
              placeholderTextColor={colors.placeholder}
              value={licenseNumber}
              onChangeText={setLicenseNumber}
            />
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={() => pickImage(setLicensePhoto, 'license')}
                  >
                    <Text style={styles.uploadIcon}>📷</Text>
            </TouchableOpacity>
              </View>
                {licensePhoto && <Image source={{ uri: licensePhoto.uri }} style={styles.documentThumbnail} />}
                {ocrDetails?.licenseNumber ? (
                  <Text style={styles.extractedText}>Extracted: {ocrDetails.licenseNumber}{licenseNumber && !matchLicenseNumber(licenseNumber, ocrDetails.licenseNumber).isMatch ? ' • Mismatch' : ''}</Text>
                ) : null}
                {licenseVerified && <Text style={[styles.verifiedBadge, styles.verifiedBadgeText]}>✓ Verified</Text>}
          </View>

              <View style={styles.documentItem}>
                <Text style={styles.documentLabel}>Aadhaar Card</Text>
                <View style={styles.uploadContainer}>
            <TextInput
                    style={styles.documentInput}
              placeholder="Aadhaar Number"
              placeholderTextColor={colors.placeholder}
              value={aadharNumber}
              onChangeText={setAadharNumber}
              keyboardType="numeric"
              maxLength={12}
            />
                  <TouchableOpacity 
                    style={styles.uploadButton} 
                    onPress={() => pickImage(setAadharPhoto, 'aadhar')}
                  >
                    <Text style={styles.uploadIcon}>📷</Text>
            </TouchableOpacity>
                </View>
                {aadharPhoto && <Image source={{ uri: aadharPhoto.uri }} style={styles.documentThumbnail} />}
                {extractedAadhaar ? (
                  <Text style={styles.extractedText}>Extracted: {extractedAadhaar}{aadharNumber && !matchAadhaar(aadharNumber, extractedAadhaar).isMatch ? ' • Mismatch' : ''}</Text>
                ) : null}
                {aadharVerified && <Text style={[styles.verifiedBadge, styles.verifiedBadgeText]}>✓ Verified</Text>}
              </View>
            </View>

            {/* OCR Details Display */}
            {ocrDetails.name && (
              <View style={styles.ocrSection}>
                <Text style={styles.ocrTitle}>Document Analysis Results</Text>
                <View style={styles.ocrGrid}>
                  <View style={styles.ocrItem}>
                    <Text style={styles.ocrLabel}>Name</Text>
                    <Text style={styles.ocrValue}>{ocrDetails.name}</Text>
                  </View>
                  <View style={styles.ocrItem}>
                    <Text style={styles.ocrLabel}>License</Text>
                    <Text style={styles.ocrValue}>{ocrDetails.licenseNumber}</Text>
                  </View>
                  <View style={styles.ocrItem}>
                    <Text style={styles.ocrLabel}>DOB</Text>
                    <Text style={styles.ocrValue}>{ocrDetails.dob}</Text>
                  </View>
                  <View style={styles.ocrItem}>
                    <Text style={styles.ocrLabel}>Validity</Text>
                    <Text style={styles.ocrValue}>{ocrDetails.validity}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <View style={styles.actionRow}>
          <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  // Reset form for new vehicle
                  setVehicleNumber('');
                  setRcNumber('');
                  setInsuranceNumber('');
                  setLicenseNumber('');
                  setAadharNumber('');
                  setVehiclePhoto(null);
                  setRcPhoto(null);
                  setLicensePhoto(null);
                  setAadharPhoto(null);
                  setRcVerified(false);
                  setInsuranceVerified(false);
                  setLicenseVerified(false);
                  setAadharVerified(false);
                  setOcrDetails({});
                  Alert.alert('New Vehicle', 'Form cleared for new vehicle details. Please fill in the information below.');
                }}
              >
                <Text style={styles.secondaryButtonText}>Add New Vehicle</Text>
          </TouchableOpacity>

          <TouchableOpacity
                style={styles.secondaryButton}
            onPress={() => {
              Alert.alert(
                'Clear Form',
                    'Are you sure you want to clear all form data?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: () => {
                      setVehicleNumber('');
                      setRcNumber('');
                      setInsuranceNumber('');
                      setLicenseNumber('');
                      setAadharNumber('');
                      setVehiclePhoto(null);
                      setRcPhoto(null);
                      setLicensePhoto(null);
                      setAadharPhoto(null);
                      setRcVerified(false);
                      setInsuranceVerified(false);
                      setLicenseVerified(false);
                      setAadharVerified(false);
                      setOcrDetails({});
                    }
                  }
                ]
              );
            }}
          >
                <Text style={styles.secondaryButtonText}>Clear Form</Text>
            </TouchableOpacity>
            </View>

          <TouchableOpacity
              style={styles.primaryButton}
            onPress={handleSaveDetails}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.cardBackground} />
            ) : (
                <Text style={styles.primaryButtonText}>Save & Continue</Text>
            )}
          </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Remove old unused styles and keep only the new ones
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
    maxWidth: 500,
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
    marginBottom: spacing.lg,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 20,
    marginBottom: spacing.sm,
    width: '100%',
    textAlign: 'left',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.body,
    marginBottom: spacing.md,
    width: '100%',
    textAlign: 'left',
    color: colors.textSecondary,
  },
  inputGroup: {
    width: '100%',
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    height: 50,
  },
  picker: {
    flex: 1,
    height: '100%',
    color: colors.textPrimary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
    justifyContent: 'flex-start',
    paddingVertical: spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    borderRadius: borderRadius.xs,
    backgroundColor: colors.background,
    fontSize: 16,
    color: colors.primary,
  },
  checkboxText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  checkboxIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  // New styles for the redesigned layout
  navigationSection: {
    width: '100%',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  navButton: {
    backgroundColor: colors.primaryDark,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadow.button,
  },
  navButtonText: {
    color: colors.cardBackground,
    ...typography.h4,
    fontWeight: '700',
  },
  section: {
    width: '100%',
    marginBottom: spacing.xl,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    ...typography.h2,
    fontSize: 20,
    marginBottom: spacing.sm,
    width: '100%',
    textAlign: 'left',
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.body,
    marginBottom: spacing.md,
    width: '100%',
    textAlign: 'left',
    color: colors.textSecondary,
  },
  vehicleTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: spacing.md,
  },
  pickerGroup: {
    width: '48%',
  },
  inputLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  documentGrid: {
    flexDirection: 'column',
    width: '100%',
    marginBottom: spacing.md,
  },
  documentItem: {
    width: '100%',
    marginBottom: spacing.md,
    alignItems: 'stretch',
  },
  documentLabel: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'left',
  },
  uploadContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    height: 56,
  },
  documentInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
  },
  uploadButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accent,
    ...shadow.button,
    shadowColor: colors.accent,
  },
  uploadIcon: {
    color: colors.cardBackground,
    fontSize: 20,
    fontWeight: '600',
  },
  documentThumbnail: {
    width: '100%',
    height: 100,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
    resizeMode: 'contain',
    backgroundColor: colors.border,
  },
  verifiedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    ...shadow.button,
    shadowColor: colors.success,
  },
  verifiedBadgeText: {
    color: colors.cardBackground,
    fontSize: 12,
    fontWeight: 'bold',
  },
  ocrSection: {
    width: '100%',
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ocrTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  ocrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  ocrItem: {
    width: '48%',
    marginBottom: spacing.xs,
  },
  ocrLabel: {
    ...typography.small,
    color: colors.textSecondary,
  },
  ocrValue: {
    ...typography.body,
    color: colors.textPrimary,
  },
  extractedText: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  actionSection: {
    width: '100%',
    marginTop: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.md,
  },
  secondaryButton: {
    backgroundColor: colors.warningDark,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    ...shadow.button,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    ...typography.body,
    fontWeight: 'bold',
  },
  primaryButton: {
    width: '100%',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    ...shadow.button,
  },
  primaryButtonText: {
    color: colors.cardBackground,
    ...typography.h2,
    fontWeight: 'bold',
  },
  ocrStatusMessage: {
    backgroundColor: colors.warningLight,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  ocrStatusText: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  ocrStatusBold: {
    fontWeight: 'bold',
  },
});

export default ProviderDetailsScreen;

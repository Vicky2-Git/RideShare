// test-vision-config.js
// Simple test script to verify Google Cloud Vision API configuration

import { GOOGLE_CLOUD_VISION_API_KEY } from './src/config/visionConfig.js';

console.log('=== Google Cloud Vision API Configuration Test ===');
console.log('');

// Check if API key is configured
if (GOOGLE_CLOUD_VISION_API_KEY === 'YOUR_ACTUAL_API_KEY_HERE') {
  console.log('❌ ERROR: API key not configured!');
  console.log('Please update src/config/visionConfig.js with your actual API key');
  console.log('');
  console.log('Current value:', GOOGLE_CLOUD_VISION_API_KEY);
  console.log('');
  console.log('Steps to fix:');
  console.log('1. Go to Google Cloud Console');
  console.log('2. Create/get your API key');
  console.log('3. Replace "YOUR_ACTUAL_API_KEY_HERE" with your actual key');
  console.log('4. Save the file');
} else if (GOOGLE_CLOUD_VISION_API_KEY === 'GOOGLE_CLOUD_VISION_API_KEY') {
  console.log('❌ ERROR: API key still has placeholder value!');
  console.log('Please replace "GOOGLE_CLOUD_VISION_API_KEY" with your actual API key');
} else if (GOOGLE_CLOUD_VISION_API_KEY.length === 0) {
  console.log('❌ ERROR: API key is empty!');
  console.log('Please add your API key to the configuration file');
} else {
  console.log('✅ API key appears to be configured!');
  console.log('Key length:', GOOGLE_CLOUD_VISION_API_KEY.length, 'characters');
  console.log('Key starts with:', GOOGLE_CLOUD_VISION_API_KEY.substring(0, 10) + '...');
  console.log('');
  console.log('Note: This only checks the configuration format.');
  console.log('The actual API key validity will be tested when you use the app.');
}

console.log('');
console.log('=== Test Complete ===');

// src/config/visionConfig.js
// Configuration file for Google Cloud Vision API

// IMPORTANT: Replace this with your actual Google Cloud Vision API key
// You can get this from the Google Cloud Console: https://console.cloud.google.com/
// Option 1: Direct key (for development)
export const GOOGLE_CLOUD_VISION_API_KEY = 'AIzaSyCx0hS3vR5C7vk6tefCNyB8PsxLfReZwOM'; // Replace with your actual key

// Option 2: Environment variable (recommended for production)
// export const GOOGLE_CLOUD_VISION_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY || 'YOUR_ACTUAL_API_KEY_HERE';

// Instructions to get the API key:
// 1. Go to Google Cloud Console: https://console.cloud.google.com/
// 2. Create a new project or select an existing one
// 3. Enable the Cloud Vision API
// 4. Go to Credentials
// 5. Create an API key
// 6. Copy the API key and paste it above (replace 'YOUR_ACTUAL_API_KEY_HERE')
// 7. Restrict the API key to only Cloud Vision API for security
// 
// Example of what it should look like:
// export const GOOGLE_CLOUD_VISION_API_KEY = 'AIzaSyC...'; // Your actual key here

export const VISION_API_CONFIG = {
  apiKey: GOOGLE_CLOUD_VISION_API_KEY,
  apiUrl: 'https://vision.googleapis.com/v1/images:annotate',
  maxResults: 1,
  features: ['DOCUMENT_TEXT_DETECTION'],
  languageHints: ['en', 'hi']
};

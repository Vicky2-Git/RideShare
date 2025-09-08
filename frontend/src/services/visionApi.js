// src/services/visionApi.js
// Google Cloud Vision API service for document verification

import { GOOGLE_CLOUD_VISION_API_KEY, VISION_API_CONFIG } from '../config/visionConfig';

export const visionApi = {
  // Check if API key is properly configured
  isConfigured: () => {
    return GOOGLE_CLOUD_VISION_API_KEY !== 'AIzaSyCx0hS3vR5C7vk6tefCNyB8PsxLfReZwOM' && 
           GOOGLE_CLOUD_VISION_API_KEY !== 'GOOGLE_CLOUD_VISION_API_KEY' &&
           GOOGLE_CLOUD_VISION_API_KEY.length > 0;
  },

  // Get configuration status message
  getConfigStatus: () => {
    if (!visionApi.isConfigured()) {
      return {
        configured: false,
        message: 'Google Cloud Vision API key not configured. Please update the config file.',
        instructions: [
          '1. Go to Google Cloud Console: https://console.cloud.google.com/',
          '2. Create a new project or select an existing one',
          '3. Enable the Cloud Vision API',
          '4. Go to Credentials',
          '5. Create an API key',
          '6. Copy the API key and paste it in src/config/visionConfig.js',
          '7. Restrict the API key to only Cloud Vision API for security'
        ]
      };
    }
    return {
      configured: true,
      message: 'Google Cloud Vision API is properly configured.',
      instructions: []
    };
  },

  // Extract text from image using Google Cloud Vision API
  extractTextFromImage: async (base64Image) => {
    try {
      // Check if API key is configured
      if (GOOGLE_CLOUD_VISION_API_KEY === 'AIzaSyCx0hS3vR5C7vk6tefCNyB8PsxLfReZwOM' || 
          GOOGLE_CLOUD_VISION_API_KEY === 'GOOGLE_CLOUD_VISION_API_KEY') {
        throw new Error('Google Cloud Vision API key not configured. Please update the config file.');
      }
      
      // Remove the data:image/jpeg;base64, prefix if present
      const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const requestBody = {
        requests: [
          {
            image: {
              content: base64Data
            },
            features: [
              {
                type: VISION_API_CONFIG.features?.[0] || 'DOCUMENT_TEXT_DETECTION',
                maxResults: VISION_API_CONFIG.maxResults
              }
            ],
            imageContext: VISION_API_CONFIG.languageHints ? { languageHints: VISION_API_CONFIG.languageHints } : undefined
          }
        ]
      };

      const response = await fetch(`${VISION_API_CONFIG.apiUrl}?key=${GOOGLE_CLOUD_VISION_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vision API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      
      if (result.responses && result.responses[0]) {
        const resp = result.responses[0];
        // Prefer fullTextAnnotation for DOCUMENT_TEXT_DETECTION
        if (resp.fullTextAnnotation && resp.fullTextAnnotation.text) {
          return resp.fullTextAnnotation.text;
        }
        if (resp.textAnnotations && resp.textAnnotations[0] && resp.textAnnotations[0].text) {
          return resp.textAnnotations[0].text;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error(`Failed to extract text from image: ${error.message}`);
    }
  },

  // Extract specific information from license document
  extractLicenseInfo: async (base64Image) => {
    try {
      const extractedText = await visionApi.extractTextFromImage(base64Image);
      
      if (!extractedText) {
        return null;
      }

      // Parse the extracted text to find license information
      const lines = extractedText.split('\n');
      let licenseInfo = {
        name: '',
        licenseNumber: '',
        dob: '',
        validity: ''
      };

      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Extract name (usually appears after "Name:" or "NAME:")
        if (lowerLine.includes('name:') || lowerLine.includes('name')) {
          const nameMatch = line.match(/name:?\s*(.+)/i);
          if (nameMatch) {
            licenseInfo.name = nameMatch[1].trim();
          }
        }
        
        // Extract license number (usually contains alphanumeric characters)
        if (lowerLine.includes('license') || lowerLine.includes('lic')) {
          const licenseMatch = line.match(/license:?\s*([a-zA-Z0-9]+)/i);
          if (licenseMatch) {
            licenseInfo.licenseNumber = licenseMatch[1].trim();
          }
        }
        
        // Extract date of birth
        if (lowerLine.includes('dob') || lowerLine.includes('birth') || lowerLine.includes('date')) {
          const dobMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
          if (dobMatch) {
            licenseInfo.dob = dobMatch[1].trim();
          }
        }
        
        // Extract validity date
        if (lowerLine.includes('valid') || lowerLine.includes('expiry') || lowerLine.includes('exp')) {
          const validityMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
          if (validityMatch) {
            licenseInfo.validity = validityMatch[1].trim();
          }
        }
      }

      return licenseInfo;
    } catch (error) {
      console.error('Error extracting license info:', error);
      throw error;
    }
  },

  // Extract Aadhaar number from Aadhaar card
  extractAadhaarInfo: async (base64Image) => {
    try {
      const extractedText = await visionApi.extractTextFromImage(base64Image);
      
      if (!extractedText) {
        return null;
      }

      // Find Aadhaar number (12 digits)
      const aadhaarMatch = extractedText.match(/\b\d{4}\s?\d{4}\s?\d{4}\b/);
      if (aadhaarMatch) {
        return {
          aadhaarNumber: aadhaarMatch[0].replace(/\s/g, ''),
          extractedText: extractedText
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting Aadhaar info:', error);
      throw error;
    }
  },

  // Extract RC number from RC document
  extractRCInfo: async (base64Image) => {
    try {
      const extractedText = await visionApi.extractTextFromImage(base64Image);
      
      if (!extractedText) {
        return null;
      }

      // Find RC number (usually contains alphanumeric characters)
      const rcMatch = extractedText.match(/\b[A-Z]{2}\d{2}[A-Z]{2}\d{4}\b/);
      if (rcMatch) {
        return {
          rcNumber: rcMatch[0],
          extractedText: extractedText
        };
      }

      return null;
    } catch (error) {
      console.error('Error extracting RC info:', error);
      throw error;
    }
  }
};

# Google Cloud Vision API Setup Guide

This guide will help you set up Google Cloud Vision API for document verification in your RideShare app.

## Prerequisites
- A Google account
- Access to Google Cloud Console

## Step-by-Step Setup

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top
3. Click "New Project"
4. Enter a project name (e.g., "RideShare Vision API")
5. Click "Create"

### 2. Enable the Cloud Vision API
1. In your project, go to "APIs & Services" > "Library"
2. Search for "Cloud Vision API"
3. Click on "Cloud Vision API"
4. Click "Enable"

### 3. Create an API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. Click "Restrict Key" for security

### 4. Restrict the API Key (Recommended)
1. In the API key settings, click "Restrict Key"
2. Under "API restrictions", select "Restrict key"
3. Choose "Cloud Vision API" from the dropdown
4. Click "Save"

### 5. Update Your App Configuration
1. Open `frontend/src/config/visionConfig.js`
2. Replace `'YOUR_ACTUAL_API_KEY_HERE'` with your actual API key
3. **Important**: Make sure to replace the entire placeholder text, not just add your key
4. **Example**: Change `'YOUR_ACTUAL_API_KEY_HERE'` to `'AIzaSyC...'` (your actual key)
5. Save the file

### 6. Test the Configuration
1. Run your app
2. Go to either "Request a Ride" or "Provide a Ride" screen
3. Click "Check Vision API Config" button
4. You should see "Google Cloud Vision API is properly configured"

## Security Notes
- Never commit your API key to version control
- Restrict the API key to only Cloud Vision API
- Monitor your API usage in Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## Troubleshooting

### "API key not configured" Error
- Make sure you've updated `visionConfig.js` with your actual API key
- **Check that you replaced the entire placeholder**: `'YOUR_ACTUAL_API_KEY_HERE'` → `'YOUR_ACTUAL_KEY'`
- **Common mistake**: Don't just add your key, replace the placeholder completely
- Check that the API key is not wrapped in extra quotes
- Verify the file path is correct
- Make sure you saved the file after making changes

### "API key is invalid" Error
- Verify your API key is correct
- Check that the Cloud Vision API is enabled
- Ensure the API key has the necessary permissions

### "Quota exceeded" Error
- Check your Google Cloud billing
- Monitor API usage in the console
- Consider upgrading your plan if needed

## API Usage
The app will automatically use the Vision API to:
- Extract text from uploaded documents
- Auto-fill form fields based on extracted data
- Verify document authenticity

## Support
If you encounter issues:
1. Check the Google Cloud Console for error details
2. Verify your API key and project settings
3. Check the app console for detailed error logs

// src/styles/theme.js
// Defines the consistent styling theme for the RideShare app.

export const colors = {
  primary: '#007bff', // A vibrant blue for main actions
  primaryDark: '#0056b3', // Darker shade for pressed states
  primaryLight: '#e3f2fd', // Light blue for secondary buttons
  accent: '#28a745', // Green for success/active states
  accentDark: '#1e7e34',
  success: '#28a745', // Green for success states
  warning: '#ffc107', // Yellow for warning states
  warningDark: '#e0a800', // Darker yellow for better contrast
  warningLight: '#fff3cd', // Light yellow for backgrounds
  secondary: '#6c757d', // Gray for secondary actions
  danger: '#dc3545', // Red for errors/logout
  dangerDark: '#bd2130',
  info: '#17a2b8', // Blue for info/debug elements
  infoDark: '#138496', // Darker info for better contrast
  background: '#f8f9fa', // Light grey background
  cardBackground: '#ffffff', // White for cards/containers
  lightGray: '#f1f3f4', // Light gray for secondary backgrounds
  textPrimary: '#343a40', // Dark grey for main text
  textSecondary: '#6c757d', // Medium grey for secondary text
  border: '#ced4da', // Light grey for borders
  placeholder: '#adb5bd', // Light grey for input placeholders
};

export const spacing = {
  xs: 5,
  sm: 10,
  md: 15,
  lg: 20,
  xl: 25,
  xxl: 30,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999, // For perfectly round elements
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  small: {
    fontSize: 14,
    color: colors.textSecondary,
  },
};

export const shadow = {
  // Standard shadow for cards/elevated elements
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5, // For Android
  },
  // Stronger shadow for interactive elements like buttons
  button: {
    shadowColor: colors.primary, // Primary color shadow
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8, // For Android
  },
};

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  ScrollView,
  StyleSheet, 
  Alert,
  Dimensions,
  Modal,
  Platform,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import apiClient, { ApiError } from '../services/api';
import WelcomeModal from '../components/WelcomeModal';
import { useCustomAlert } from '../hooks/useCustomAlert';
import themeService from '../services/themeService';

const { width } = Dimensions.get('window');

// Dynamic styles function based on theme colors
const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
    backgroundColor: colors.background,
    paddingBottom: 80,
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  logo: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    letterSpacing: 1.2,
    marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 17,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '500',
    lineHeight: 24,
    letterSpacing: 0.4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 6,
    marginBottom: 35,
    borderWidth: 2,
    borderColor: colors.primaryLight,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
    marginHorizontal: 3,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: colors.text,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: colors.surface,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  genderText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  genderTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  userTypeContainer: {
    marginBottom: 25,
  },
  userTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  userTypeCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: 16,
    position: 'relative',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  userTypeLabel: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  userTypeDescription: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  authButtonText: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.buttonText,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  infoContainer: {
    backgroundColor: colors.primary === '#05A5B5' ? 'rgba(5, 165, 181, 0.1)' : 
                     colors.primary === '#42C4D6' ? 'rgba(66, 196, 214, 0.1)' : 
                     'rgba(5, 165, 181, 0.1)', // fallback to adult teal
    padding: 20,
    borderRadius: 16,
    borderLeftWidth: 6,
    borderLeftColor: colors.primary,
    marginTop: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    fontSize: 15,
    color: colors.textSecondary,
    lineHeight: 22,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerRow: {
    flexDirection: 'row',
    height: 200,
    marginBottom: 20,
  },
  datePickerColumn: {
    flex: 1,
    marginHorizontal: 5,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  datePickerScrollView: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  datePickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  datePickerOptionSelected: {
    backgroundColor: colors.primary,
  },
  datePickerOptionText: {
    fontSize: 16,
    color: colors.text,
  },
  datePickerOptionTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  datePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  datePickerCancelButton: {
    flex: 1,
    backgroundColor: colors.border,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 10,
  },
  datePickerCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textLight,
  },
  datePickerSelectButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  datePickerSelectButtonDisabled: {
    backgroundColor: colors.textLight,
  },
  datePickerSelectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

// Helper functions for user registry management
const storeUserInRegistry = async (user) => {
  try {
    // Get existing registry
    const existingRegistry = await SecureStore.getItemAsync('userRegistry');
    let registry = existingRegistry ? JSON.parse(existingRegistry) : {};
    
    // Add user to registry (use email as key)
    registry[user.email] = user;
    
    // Save back to registry
    await SecureStore.setItemAsync('userRegistry', JSON.stringify(registry));
    console.log(`User ${user.email} added to registry`);
  } catch (error) {
    console.error('Error storing user in registry:', error);
  }
};

const getUserFromRegistry = async (email) => {
  try {
    const existingRegistry = await SecureStore.getItemAsync('userRegistry');
    if (existingRegistry) {
      const registry = JSON.parse(existingRegistry);
      return registry[email] || null;
    }
    return null;
  } catch (error) {
    console.error('Error getting user from registry:', error);
    return null;
  }
};

// Offline sign-in checks the password against a salted SHA-256 hash saved on
// this device after the last successful sign-in or registration. The password
// itself is never stored.
const OFFLINE_CREDENTIALS_KEY = 'offlineCredentials';

const hashPassword = (salt, password) =>
  Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);

const saveOfflineCredential = async (email, password) => {
  try {
    const stored = await SecureStore.getItemAsync(OFFLINE_CREDENTIALS_KEY);
    const credentials = stored ? JSON.parse(stored) : {};
    const salt = Crypto.randomUUID();
    credentials[email.toLowerCase().trim()] = { salt, hash: await hashPassword(salt, password) };
    await SecureStore.setItemAsync(OFFLINE_CREDENTIALS_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Error saving offline credential:', error);
  }
};

const checkOfflineCredential = async (email, password) => {
  try {
    const stored = await SecureStore.getItemAsync(OFFLINE_CREDENTIALS_KEY);
    const credential = stored ? JSON.parse(stored)[email.toLowerCase().trim()] : null;
    if (!credential) {
      return false;
    }
    return (await hashPassword(credential.salt, password)) === credential.hash;
  } catch (error) {
    console.error('Error checking offline credential:', error);
    return false;
  }
};

export default function AuthScreen({ navigation, route, onAuthSuccess }) {
  // Get onAuthSuccess from props (preferred) or route params (fallback)
  const authSuccessCallback = onAuthSuccess || (route?.params?.onAuthSuccess);
  const { showAlert } = useCustomAlert();
  // Set initial mode based on route params, default to login
  const [isLogin, setIsLogin] = useState(route?.params?.mode !== 'signup');
  // Theme state for dynamic updates
  const [currentTheme, setCurrentTheme] = useState(themeService.getCurrentTheme());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeData, setWelcomeData] = useState({ userName: '', isAdmin: false });
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    sex: '',
    birthday: '',
    userType: 'buyer'
  });
  const [selectedDate, setSelectedDate] = useState({
    day: '',
    month: '',
    year: ''
  });

  const userTypes = [
    { 
      key: 'buyer', 
      label: 'Buyer', 
      description: 'Shop and purchase products\n(Can also sell products later)',
      icon: 'bag',
      color: '#3B82F6'
    },
    { 
      key: 'seller', 
      label: 'Seller', 
      description: 'Sell products on the marketplace\n(Can also buy products)',
      icon: 'storefront',
      color: '#10B981'
    }
  ];

  // Pre-defined admin credentials (only one admin allowed)
  const ADMIN_CREDENTIALS = {
    email: 'admin@tlbdiamond.com',
    password: 'TLBAdmin2024!',
    firstName: 'System',
    lastName: 'Administrator',
    phoneNumber: '+1-800-TLB-ADMIN',
    sex: 'other',
    birthday: '01/01/1990',
    userType: 'admin'
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getCurrentYear = () => new Date().getFullYear();
  const getYears = () => {
    const currentYear = getCurrentYear();
    const years = [];
    for (let i = currentYear; i >= currentYear - 100; i--) {
      years.push(i.toString());
    }
    return years;
  };

  const getDaysInMonth = (month, year) => {
    if (!month || !year) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };

  const handleDateSelection = () => {
    if (selectedDate.day && selectedDate.month && selectedDate.year) {
      const formattedDate = `${selectedDate.month.padStart(2, '0')}/${selectedDate.day.padStart(2, '0')}/${selectedDate.year}`;
      setFormData(prev => ({
        ...prev,
        birthday: formattedDate
      }));
      setShowDatePicker(false);
      
      // Update theme based on age when birthday is selected
      const age = themeService.calculateAge(formattedDate);
      if (age !== null) {
        themeService.setUserAge(age);
        setCurrentTheme(themeService.getCurrentTheme());
        console.log(`Age detected: ${age}, Theme: ${themeService.getCurrentTheme().name}`);
      }
    }
  };

  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
    // Now trigger the authentication success callback to navigate to main app
    console.log('Welcome modal closed, triggering auth success callback...');
    if (authSuccessCallback) {
      authSuccessCallback();
    } else {
      console.error('No auth success callback provided');
    }
  };

  const validateForm = () => {
    const { email, password, confirmPassword, firstName, lastName, phoneNumber, sex } = formData;

    if (!email.trim()) {
      showAlert({
        type: 'error',
        title: 'Validation Error',
        message: 'Email is required',
        buttons: [{ text: 'OK', onPress: () => {} }]
      });
      return false;
    }

    if (!email.includes('@') || !email.includes('.')) {
      showAlert({
        type: 'error',
        title: 'Validation Error',
        message: 'Please enter a valid email address',
        buttons: [{ text: 'OK', onPress: () => {} }]
      });
      return false;
    }

    if (password.length < 6) {
      showAlert({
        type: 'error',
        title: 'Validation Error',
        message: 'Password must be at least 6 characters',
        buttons: [{ text: 'OK', onPress: () => {} }]
      });
      return false;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        showAlert({
          type: 'error',
          title: 'Validation Error',
          message: 'Passwords do not match',
          buttons: [{ text: 'OK', onPress: () => {} }]
        });
        return false;
      }

      if (!firstName.trim() || !lastName.trim()) {
        showAlert({
          type: 'error',
          title: 'Validation Error',
          message: 'First name and last name are required',
          buttons: [{ text: 'OK', onPress: () => {} }]
        });
        return false;
      }

      if (!phoneNumber.trim()) {
        showAlert({
          type: 'error',
          title: 'Validation Error',
          message: 'Phone number is required',
          buttons: [{ text: 'OK', onPress: () => {} }]
        });
        return false;
      }

      if (!sex) {
        showAlert({
          type: 'error',
          title: 'Validation Error',
          message: 'Please select your gender',
          buttons: [{ text: 'OK', onPress: () => {} }]
        });
        return false;
      }

      if (!formData.birthday.trim()) {
        showAlert({
          type: 'error',
          title: 'Validation Error',
          message: 'Birthday is required',
          buttons: [{ text: 'OK', onPress: () => {} }]
        });
        return false;
      }
    }

    return true;
  };

  const handleAuth = async () => {
    console.log('handleAuth called', { isLogin, email: formData.email, passwordLength: formData.password.length });
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }

    setIsLoading(true);

    try {
      const { email, password, ...profileData } = formData;
      console.log('Starting API authentication process', { isLogin, email });

      if (isLogin) {
        // Try real API for login first, with fallback to local authentication
        console.log('Attempting API login...');
        
        try {
          const response = await apiClient.login(email, password);
          
          console.log('API login response:', response);
          
          if (response.user && response.token) {
            // Store user in registry for future offline access
            await storeUserInRegistry(response.user);
            await saveOfflineCredential(email, password);
            
            // Store current session using the API response
            await SecureStore.setItemAsync('currentUser', JSON.stringify(response.user));
            
            // Show success message with beautiful welcome modal
            const isAdmin = response.user.role === 'admin' || response.user.email === 'admin@tlbdiamond.com';
            const userName = response.user.first_name || response.user.email;
            
            // Set welcome modal data and show it
            setWelcomeData({ userName, isAdmin });
            setShowWelcomeModal(true);
            
            // Don't call authSuccessCallback immediately - wait for modal to close
            console.log('API login successful, showing welcome modal first...');
          } else {
            showAlert({
              type: 'error',
              title: 'Login Failed',
              message: 'Invalid response from server',
              buttons: [{ text: 'OK', onPress: () => {} }]
            });
          }
        } catch (apiError) {
          // Use the accounts on this device only when the server cannot be
          // reached. When it answered (wrong password, suspended account),
          // show its answer instead of signing in locally.
          if (!(apiError instanceof ApiError && apiError.isNetworkError())) {
            throw apiError;
          }
          console.log('API unreachable, attempting local fallback...');
          
          // Check for admin credentials first
          if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
            console.log('Admin login detected, using local admin account');
            
            const adminUser = {
              id: 'admin_001',
              email: ADMIN_CREDENTIALS.email,
              first_name: ADMIN_CREDENTIALS.firstName,
              last_name: ADMIN_CREDENTIALS.lastName,
              phone: ADMIN_CREDENTIALS.phoneNumber,
              gender: ADMIN_CREDENTIALS.sex,
              birthday: ADMIN_CREDENTIALS.birthday,
              account_type: 'admin',
              role: 'admin',
              created_at: new Date().toISOString(),
              balance: 999999
            };
            
            await SecureStore.setItemAsync('currentUser', JSON.stringify(adminUser));
            await SecureStore.setItemAsync('auth_token', `admin_token_${adminUser.id}`);
            
            setWelcomeData({ userName: adminUser.firstName, isAdmin: true });
            setShowWelcomeModal(true);
            
            console.log('Local admin login successful');
            return;
          }
          
          // For regular users, check the user registry and the saved password hash
          const registeredUser = await getUserFromRegistry(email);
          if (registeredUser && !(await checkOfflineCredential(email, password))) {
            showAlert({
              type: 'error',
              title: 'Login Failed',
              message: 'Could not verify this password offline. Check the password, or connect to the internet and sign in once on this device.',
              buttons: [{ text: 'OK', onPress: () => {} }]
            });
            return;
          }
          if (registeredUser) {
            // User exists in registry and the password matches, log them in
            await SecureStore.setItemAsync('currentUser', JSON.stringify(registeredUser));
            await SecureStore.setItemAsync('auth_token', `local_token_${registeredUser.id}`);
            
            const userName = registeredUser.first_name || registeredUser.email;
            const isAdmin = registeredUser.role === 'admin';
            setWelcomeData({ userName, isAdmin });
            setShowWelcomeModal(true);
            
            console.log('Registry user login successful:', registeredUser.email);
            return;
          }
          
          // If no user found in registry, show error
          showAlert({
            type: 'error',
            title: 'Login Failed',
            message: 'No account found for this email. Please register first or check your internet connection.',
            buttons: [{ text: 'OK', onPress: () => {} }]
          });
        }

      } else {
        // Use real API for registration, with fallback to local storage
        console.log('Attempting API registration...');
        
        const registrationData = {
          email,
          password,
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          phone: profileData.phoneNumber,
          gender: profileData.sex,
          birthday: profileData.birthday,
          account_type: profileData.userType === 'seller' ? 'business' : 'individual'
        };
        
        try {
          const response = await apiClient.register(registrationData);
          
          console.log('API registration response:', response);
          
          if (response.user && response.token) {
            // Store user in registry for future offline access
            await storeUserInRegistry(response.user);
            await saveOfflineCredential(email, password);
            
            // Store current session using the API response
            await SecureStore.setItemAsync('currentUser', JSON.stringify(response.user));
            
            // Show success message with beautiful welcome modal
            const userName = response.user.first_name || response.user.email;
            setWelcomeData({ userName, isAdmin: false }); // New registrations are never admin
            setShowWelcomeModal(true);
            
            // Don't call authSuccessCallback immediately - wait for modal to close
            console.log('API registration successful, showing welcome modal first...');
          } else {
            showAlert({
              type: 'error',
              title: 'Registration Failed',
              message: 'Invalid response from server',
              buttons: [{ text: 'OK', onPress: () => {} }]
            });
          }
        } catch (apiError) {
          // Create a local account only when the server cannot be reached.
          // When it answered (email already registered, invalid data), show that.
          if (!(apiError instanceof ApiError && apiError.isNetworkError())) {
            throw apiError;
          }
          console.log('API unreachable, attempting local fallback...');
          
          // Fallback to local storage when API is unavailable
          console.log('Creating local user from registration data:', {
            formData,
            profileData,
            email,
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            phoneNumber: profileData.phoneNumber
          });
          
          const localUser = {
            id: Date.now().toString(),
            email: email,
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            phone: profileData.phoneNumber,
            gender: profileData.sex,
            birthday: profileData.birthday,
            account_type: profileData.userType === 'seller' ? 'business' : 'individual',
            role: 'user',
            created_at: new Date().toISOString(),
            balance: 0
          };
          
          console.log('Local user object created:', localUser);
          
          // Store user in persistent registry (survives logout)
          await storeUserInRegistry(localUser);
          await saveOfflineCredential(email, password);
          
          // Store current session
          await SecureStore.setItemAsync('currentUser', JSON.stringify(localUser));
          await SecureStore.setItemAsync('auth_token', `local_token_${localUser.id}`);
          
          console.log('Local registration successful:', localUser);
          
          // Show success message with beautiful welcome modal
          const userName = localUser.first_name || localUser.email;
          setWelcomeData({ userName, isAdmin: false });
          setShowWelcomeModal(true);
          
          console.log('Local registration complete, showing welcome modal...');
        }
      }

    } catch (error) {
      console.error('Auth error:', error);
      
      if (error instanceof ApiError) {
        if (error.isNetworkError()) {
          showAlert({
            type: 'error',
            title: 'Network Error',
            message: 'Please check your internet connection and try again.',
            buttons: [{ text: 'OK', onPress: () => {} }]
          });
        } else if (error.isValidationError()) {
          showAlert({
            type: 'error',
            title: 'Validation Error',
            message: error.message,
            buttons: [{ text: 'OK', onPress: () => {} }]
          });
        } else if (error.isAuthError()) {
          showAlert({
            type: 'error',
            title: isLogin ? 'Login Failed' : 'Registration Failed',
            message: error.message,
            buttons: [{ text: 'OK', onPress: () => {} }]
          });
        } else {
          showAlert({
            type: 'error',
            title: 'Error',
            message: error.message || 'An error occurred. Please try again.',
            buttons: [{ text: 'OK', onPress: () => {} }]
          });
        }
      } else {
        showAlert({
          type: 'error',
          title: 'Error',
          message: 'An unexpected error occurred. Please try again.',
          buttons: [{ text: 'OK', onPress: () => {} }]
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderUserTypeSelector = () => (
    <View style={styles.userTypeContainer}>
      <Text style={styles.label}>Account Type</Text>
      <View style={styles.userTypeGrid}>
        {userTypes.map(type => (
          <TouchableOpacity
            key={type.key}
            style={[
              styles.userTypeCard,
              { borderColor: type.color },
              formData.userType === type.key && { backgroundColor: `${type.color}15`, borderWidth: 2 }
            ]}
            onPress={() => handleInputChange('userType', type.key)}
          >
            <Ionicons name={type.icon} size={32} color={type.color} />
            <Text style={[styles.userTypeLabel, { color: type.color }]}>{type.label}</Text>
            <Text style={styles.userTypeDescription}>{type.description}</Text>
            {formData.userType === type.key && (
              <View style={[styles.selectedIndicator, { backgroundColor: type.color }]}>
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Generate dynamic styles based on current theme
  const styles = getStyles(currentTheme.colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>TLB Diamond</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Welcome Back' : 'Create Your Account'}
        </Text>
      </View>

      {/* Auth Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, isLogin && styles.toggleButtonActive]}
          onPress={() => setIsLogin(true)}
        >
          <Text style={[styles.toggleButtonText, isLogin && styles.toggleButtonTextActive]}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !isLogin && styles.toggleButtonActive]}
          onPress={() => setIsLogin(false)}
        >
          <Text style={[styles.toggleButtonText, !isLogin && styles.toggleButtonTextActive]}>Register</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <View style={styles.formContainer}>
        {/* Email */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={formData.email}
            onChangeText={(value) => handleInputChange('email', value)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={formData.password}
            onChangeText={(value) => handleInputChange('password', value)}
            secureTextEntry
          />
        </View>

        {/* Registration Fields */}
        {!isLogin && (
          <>
            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(value) => handleInputChange('confirmPassword', value)}
                secureTextEntry
              />
            </View>

            {/* Name */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, { flex: 1, marginRight: 6 }]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  value={formData.firstName}
                  onChangeText={(value) => handleInputChange('firstName', value)}
                />
              </View>
              <View style={[styles.inputContainer, { flex: 1, marginLeft: 6 }]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  value={formData.lastName}
                  onChangeText={(value) => handleInputChange('lastName', value)}
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={formData.phoneNumber}
                onChangeText={(value) => handleInputChange('phoneNumber', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* Sex */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                {['male', 'female', 'other'].map(gender => (
                  <TouchableOpacity
                    key={gender}
                    style={[
                      styles.genderButton,
                      formData.sex === gender && styles.genderButtonActive
                    ]}
                    onPress={() => handleInputChange('sex', gender)}
                  >
                    <Text style={[
                      styles.genderText,
                      formData.sex === gender && styles.genderTextActive
                    ]}>
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Birthday */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Birthday *</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>
                  {formData.birthday || 'Select your birthday'}
                </Text>
                <Ionicons name="calendar" size={20} color="#D4AF37" />
              </TouchableOpacity>
            </View>

            {/* User Type Selector */}
            {renderUserTypeSelector()}
          </>
        )}

        {/* Auth Button */}
        <TouchableOpacity 
          style={styles.authButton} 
          onPress={() => {
            console.log('Button pressed!');
            handleAuth();
          }}
        >
          <Text style={styles.authButtonText}>
            {isLogin ? 'Login' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        {/* Additional Info */}
        {!isLogin && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              ℹ️ Note: Buyers can also sell products after registration.
              Sellers have additional marketplace tools available.{'\n\n'}
              🔒 Administrator access is restricted and not available through public registration.
            </Text>
          </View>
        )}
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <Modal transparent animationType="slide">
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <Text style={styles.datePickerTitle}>Select Birthday</Text>
              
              <View style={styles.datePickerRow}>
                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Month</Text>
                  <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                    {months.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        style={[
                          styles.datePickerOption,
                          selectedDate.month === (index + 1).toString() && styles.datePickerOptionSelected
                        ]}
                        onPress={() => setSelectedDate(prev => ({ ...prev, month: (index + 1).toString() }))}
                      >
                        <Text style={[
                          styles.datePickerOptionText,
                          selectedDate.month === (index + 1).toString() && styles.datePickerOptionTextSelected
                        ]}>
                          {month}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Day</Text>
                  <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: getDaysInMonth(selectedDate.month, selectedDate.year) }, (_, i) => i + 1).map(day => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.datePickerOption,
                          selectedDate.day === day.toString() && styles.datePickerOptionSelected
                        ]}
                        onPress={() => setSelectedDate(prev => ({ ...prev, day: day.toString() }))}
                      >
                        <Text style={[
                          styles.datePickerOptionText,
                          selectedDate.day === day.toString() && styles.datePickerOptionTextSelected
                        ]}>
                          {day}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.datePickerColumn}>
                  <Text style={styles.datePickerLabel}>Year</Text>
                  <ScrollView style={styles.datePickerScrollView} showsVerticalScrollIndicator={false}>
                    {getYears().map(year => (
                      <TouchableOpacity
                        key={year}
                        style={[
                          styles.datePickerOption,
                          selectedDate.year === year && styles.datePickerOptionSelected
                        ]}
                        onPress={() => setSelectedDate(prev => ({ ...prev, year }))}
                      >
                        <Text style={[
                          styles.datePickerOptionText,
                          selectedDate.year === year && styles.datePickerOptionTextSelected
                        ]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.datePickerButtons}>
                <TouchableOpacity
                  style={styles.datePickerCancelButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.datePickerSelectButton,
                    (!selectedDate.day || !selectedDate.month || !selectedDate.year) && styles.datePickerSelectButtonDisabled
                  ]}
                  onPress={handleDateSelection}
                  disabled={!selectedDate.day || !selectedDate.month || !selectedDate.year}
                >
                  <Text style={styles.datePickerSelectButtonText}>Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Welcome Modal */}
      <WelcomeModal
        visible={showWelcomeModal}
        onClose={handleWelcomeModalClose}
        userName={welcomeData.userName}
        isAdmin={welcomeData.isAdmin}
      />
      
      {/* Custom Alert - render last so it appears on top */}
    </ScrollView>
  );
}


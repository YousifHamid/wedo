import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import useAuthStore from '../store/useAuthStore';
import { connectSocket, disconnectSocket } from '../services/socket';

// Auth Screens
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import FastIntroScreen from '../screens/Auth/FastIntroScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ProfileScreen from '../screens/Auth/ProfileScreen';

// Rider Screens
import UserHomeScreen from '../screens/User/UserHomeScreen';
import ZoneSelectScreen from '../screens/User/ZoneSelectScreen';
import SearchingScreen from '../screens/User/SearchingScreen';
import TripStatusScreen from '../screens/User/TripStatusScreen';
import TripCompleteScreen from '../screens/User/TripCompleteScreen';

// Driver Screens
import DriverHomeScreen from '../screens/Driver/DriverHomeScreen';
import DriverWalletScreen from '../screens/Driver/DriverWalletScreen';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const { user, token } = useAuthStore();

  // Auto-connect socket when logged in, disconnect on logout
  useEffect(() => {
    if (token && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }
    return () => disconnectSocket();
  }, [token, user]);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token || !user ? (
        <>
          <Stack.Screen name="Intro" component={FastIntroScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      ) : (
        <>
          {user?.role === 'driver' ? (
            <>
              <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
              <Stack.Screen name="DriverWallet" component={DriverWalletScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="UserHome" component={UserHomeScreen} />
              <Stack.Screen name="ZoneSelect" component={ZoneSelectScreen} />
              <Stack.Screen name="Searching" component={SearchingScreen} />
              <Stack.Screen name="TripStatus" component={TripStatusScreen} />
              <Stack.Screen name="TripComplete" component={TripCompleteScreen} />
            </>
          )}
          <Stack.Screen name="Profile" component={ProfileScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

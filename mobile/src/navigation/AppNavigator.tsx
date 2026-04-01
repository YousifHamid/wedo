import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import useAuthStore from '../store/useAuthStore';

// Auth Screens
import WelcomeScreen from '../screens/Auth/WelcomeScreen';
import FastIntroScreen from '../screens/Auth/FastIntroScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import SignUpScreen from '../screens/Auth/SignUpScreen';
import ProfileScreen from '../screens/Auth/ProfileScreen';
import DemoScreen from '../screens/Auth/DemoScreen';

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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!token || !user ? (
        <>
          <Stack.Screen name="Intro" component={FastIntroScreen} />
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="Demo" component={DemoScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Demo" component={DemoScreen} />
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

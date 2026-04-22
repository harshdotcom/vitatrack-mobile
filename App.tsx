import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import 'react-native-reanimated';

import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import VerifyOtpScreen from './src/screens/auth/VerifyOtpScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/auth/ResetPasswordScreen';
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import DocumentDetailsScreen from './src/screens/dashboard/DocumentDetailsScreen';
import { useAuthStore } from './src/store/authStore';
import { darkColors } from './src/theme/colors';
import { fontFamily } from './src/theme/typography';
import type { MainTabParamList, RootStackParamList } from './src/navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: darkColors.tabActive,
        tabBarInactiveTintColor: darkColors.tabInactive,
        tabBarStyle: {
          backgroundColor: darkColors.tabBar,
          borderTopColor: darkColors.borderSubtle,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.medium,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const hydrateFromStorage = useAuthStore(state => state.hydrateFromStorage);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    hydrateFromStorage().finally(() => setBootstrapped(true));
  }, [hydrateFromStorage]);

  if (!bootstrapped) {
    return (
      <View style={styles.loader}>
        <StatusBar barStyle="light-content" backgroundColor={darkColors.background} />
        <ActivityIndicator color={darkColors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={darkColors.background} />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={isAuthenticated ? 'MainTabs' : 'Welcome'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="DocumentDetails" component={DocumentDetailsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.background,
  },
});

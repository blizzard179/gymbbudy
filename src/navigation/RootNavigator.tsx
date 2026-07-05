import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ProgramProvider } from '../context/ProgramContext';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { AppNavigator } from './AppNavigator';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';

function AuthScreens() {
  const [screen, setScreen] = useState<'login' | 'register'>('login');

  if (screen === 'register') {
    return <RegisterScreen onGoToLogin={() => setScreen('login')} />;
  }
  return <LoginScreen onGoToRegister={() => setScreen('register')} />;
}

export function RootNavigator() {
  const { user, loading } = useAuth();

  const isAuthenticated = !isSupabaseConfigured || user !== null;

  return (
    <NavigationContainer>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#f5c842" />
        </View>
      ) : isAuthenticated ? (
        <ProgramProvider>
          <AppNavigator />
        </ProgramProvider>
      ) : (
        <AuthScreens />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { ExerciseLibraryScreen } from '../screens/ExerciseLibraryScreen';
import { ProgramCreationScreen } from '../screens/ProgramCreationScreen';
import { ProgramProvider } from '../context/ProgramContext';

const Tab = createBottomTabNavigator();

function TabIcon({ label, active }: { label: string; active: boolean }) {
  return <Text style={{ fontSize: 20, opacity: active ? 1 : 0.4 }}>{label}</Text>;
}

export function AppNavigator() {
  return (
    <ProgramProvider>
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#111',
            borderTopColor: '#1c1c1e',
            borderTopWidth: 1,
            height: 60,
            paddingBottom: 8,
          },
          tabBarActiveTintColor: '#f5c842',
          tabBarInactiveTintColor: '#444',
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}
      >
        <Tab.Screen
          name="Library"
          component={ExerciseLibraryScreen}
          options={{
            tabBarLabel: 'Exercices',
            tabBarIcon: ({ focused }) => <TabIcon label="◎" active={focused} />,
          }}
        />
        <Tab.Screen
          name="Program"
          component={ProgramCreationScreen}
          options={{
            tabBarLabel: 'Programme',
            tabBarIcon: ({ focused }) => <TabIcon label="≡" active={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
    </ProgramProvider>
  );
}

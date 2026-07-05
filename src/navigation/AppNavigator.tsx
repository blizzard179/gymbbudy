import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { ExerciseLibraryScreen } from '../screens/ExerciseLibraryScreen';
import { ProgramCreationScreen } from '../screens/ProgramCreationScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ProgressScreen } from '../screens/ProgressScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 22, color }}>{label}</Text>;
}

export function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#111',
          borderTopColor: '#1c1c1e',
          borderTopWidth: 1,
          height: 62,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#FF6224',
        tabBarInactiveTintColor: '#666',
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
          tabBarIcon: ({ color }) => <TabIcon label="◎" color={color} />,
        }}
      />
      <Tab.Screen
        name="Program"
        component={ProgramCreationScreen}
        options={{
          tabBarLabel: 'Programme',
          tabBarIcon: ({ color }) => <TabIcon label="≡" color={color} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarLabel: 'Historique',
          tabBarIcon: ({ color }) => <TabIcon label="↺" color={color} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Progrès',
          tabBarIcon: ({ color }) => <TabIcon label="↗" color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

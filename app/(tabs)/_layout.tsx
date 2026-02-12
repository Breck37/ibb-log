import { Tabs } from 'expo-router';
import { House, PlusCircle, Trophy, UsersThree } from 'phosphor-react-native';
import { useColorScheme } from 'react-native';

import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => (
            <House size={24} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => (
            <UsersThree size={24} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarIcon: ({ color }) => (
            <PlusCircle size={24} color={color} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => (
            <Trophy size={24} color={color} weight="fill" />
          ),
        }}
      />
    </Tabs>
  );
}

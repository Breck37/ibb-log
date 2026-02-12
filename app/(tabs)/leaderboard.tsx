import { User } from 'phosphor-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  useLeaderboard,
  useWeeklyCompliance,
  type LeaderboardEntry,
} from '@/lib/hooks/use-compliance';
import { useMyGroups } from '@/lib/hooks/use-groups';

const PERIODS = ['weekly', 'monthly', 'yearly', 'all-time'] as const;

const PERIOD_LABELS: Record<(typeof PERIODS)[number], string> = {
  weekly: 'Week',
  monthly: 'Month',
  yearly: 'Year',
  'all-time': 'All Time',
};

export default function LeaderboardScreen() {
  const { data: groups } = useMyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('weekly');
  const [view, setView] = useState<'leaderboard' | 'compliance'>('leaderboard');

  const groupId = selectedGroupId ?? groups?.[0]?.id ?? '';

  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard(
    groupId,
    period,
  );
  const { data: compliance, isLoading: compLoading } =
    useWeeklyCompliance(groupId);

  if (!groups?.length) {
    return (
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-center text-base text-gray-500">
          Join a group to see leaderboards
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Group selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4 py-3"
      >
        {groups.map((item) => (
          <Pressable
            key={item.id}
            className={`rounded-full px-4 py-2 ${
              groupId === item.id
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onPress={() => setSelectedGroupId(item.id)}
          >
            <Text
              className={`text-sm font-medium ${
                groupId === item.id ? 'text-white' : 'dark:text-white'
              }`}
            >
              {item.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Segmented control */}
      <View className="mx-4 mb-3 flex-row rounded-xl bg-gray-200 p-1 dark:bg-gray-700">
        <Pressable
          className={`flex-1 rounded-lg py-2.5 ${view === 'leaderboard' ? 'bg-white shadow-sm dark:bg-gray-600' : ''}`}
          onPress={() => setView('leaderboard')}
        >
          <Text
            className={`text-center text-sm font-semibold ${view === 'leaderboard' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Leaderboard
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 rounded-lg py-2.5 ${view === 'compliance' ? 'bg-white shadow-sm dark:bg-gray-600' : ''}`}
          onPress={() => setView('compliance')}
        >
          <Text
            className={`text-center text-sm font-semibold ${view === 'compliance' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
          >
            Compliance
          </Text>
        </Pressable>
      </View>

      {view === 'leaderboard' ? (
        <>
          {/* Period pills */}
          <View className="mx-4 mb-3 flex-row gap-2">
            {PERIODS.map((item) => (
              <Pressable
                key={item}
                className={`rounded-full px-3.5 py-1.5 ${
                  period === item
                    ? 'bg-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
                onPress={() => setPeriod(item)}
              >
                <Text
                  className={`text-xs font-medium ${
                    period === item
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {PERIOD_LABELS[item]}
                </Text>
              </Pressable>
            ))}
          </View>

          {lbLoading ? (
            <ActivityIndicator className="mt-8" />
          ) : (
            <FlatList
              data={leaderboard}
              keyExtractor={(item) => item.userId}
              contentContainerClassName="px-4 pb-4"
              ListEmptyComponent={
                <View className="items-center py-16">
                  <Text className="text-base text-gray-500">
                    No workouts logged yet
                  </Text>
                </View>
              }
              renderItem={({ item, index }) => (
                <LeaderboardRow entry={item} rank={index + 1} />
              )}
              ItemSeparatorComponent={() => <View className="h-2" />}
            />
          )}
        </>
      ) : compLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <FlatList
          data={compliance}
          keyExtractor={(item) => item.userId}
          contentContainerClassName="px-4 pb-4"
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="text-base text-gray-500">No members found</Text>
            </View>
          }
          renderItem={({ item }) => <ComplianceRow entry={item} />}
          ItemSeparatorComponent={() => <View className="h-2" />}
        />
      )}
    </View>
  );
}

function LeaderboardRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const medals = ['🥇', '🥈', '🥉'];
  const isTop3 = rank <= 3;

  return (
    <View className="flex-row items-center rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-800">
      <View className="mr-3 w-9 items-center">
        {isTop3 ? (
          <Text className="text-xl">{medals[rank - 1]}</Text>
        ) : (
          <Text className="text-base font-bold text-gray-400">{rank}</Text>
        )}
      </View>
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
        <User size={16} color="#3b82f6" weight="fill" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold dark:text-white">
          {entry.displayName ?? entry.username}
        </Text>
        <Text className="mt-0.5 text-xs text-gray-500">
          {entry.totalQualifiedWorkouts} qualified &middot; {entry.totalMinutes}{' '}
          min &middot; avg {entry.avgMinutes} min
        </Text>
      </View>
    </View>
  );
}

function ComplianceRow({
  entry,
}: {
  entry: {
    userId: string;
    username: string;
    displayName: string | null;
    qualifiedCount: number;
    required: number;
    isCompliant: boolean;
  };
}) {
  const progress = Math.min(
    entry.qualifiedCount / Math.max(entry.required, 1),
    1,
  );

  return (
    <View className="flex-row items-center rounded-xl bg-white p-3.5 shadow-sm dark:bg-gray-800">
      <View
        className={`mr-3 h-3 w-3 rounded-full ${entry.isCompliant ? 'bg-green-500' : 'bg-red-400'}`}
      />
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
        <User size={16} color="#3b82f6" weight="fill" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold dark:text-white">
          {entry.displayName ?? entry.username}
        </Text>
        {/* Mini progress bar */}
        <View className="mt-1.5 h-1.5 rounded-full bg-gray-200 dark:bg-gray-600">
          <View
            className={`h-1.5 rounded-full ${entry.isCompliant ? 'bg-green-500' : 'bg-red-400'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>
      <Text className="ml-3 text-base font-semibold dark:text-white">
        {entry.qualifiedCount}
        <Text className="text-sm font-normal text-gray-400">
          /{entry.required}
        </Text>
      </Text>
    </View>
  );
}

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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Forge } from '@/constants/Colors';
import { useMyGroups } from '@/lib/hooks/use-groups';
import {
  useLeaderboard,
  useWeeklyCompliance,
  type LeaderboardEntry,
} from '@/lib/hooks/use-compliance';

const PERIODS = ['weekly', 'monthly', 'yearly', 'all-time'] as const;

const PERIOD_LABELS: Record<(typeof PERIODS)[number], string> = {
  weekly: 'Week',
  monthly: 'Month',
  yearly: 'Year',
  'all-time': 'All Time',
};

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const { data: groups } = useMyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('weekly');
  const [view, setView] = useState<'leaderboard' | 'compliance'>('leaderboard');

  const groupId = selectedGroupId ?? groups?.[0]?.id ?? '';
  const selectedGroup = groups?.find((g) => g.id === groupId);

  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard(
    groupId,
    period,
  );
  const { data: compliance, isLoading: compLoading } =
    useWeeklyCompliance(groupId);

  if (!groups?.length) {
    return (
      <View className="flex-1 items-center justify-center bg-forge-bg px-8">
        <Text className="mb-2 font-bold tracking-widest text-forge-text">
          JOIN A GROUP
        </Text>
        <Text className="text-center text-sm text-forge-muted">
          Join a group to see leaderboards
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-forge-bg">
      {/* Branded header */}
      <View style={{ paddingTop: insets.top + 20 }} className="mb-5 gap-5 px-4">
        <View className="flex-row items-center gap-3">
          <View className="h-6 w-[2px] bg-primary" />
          <View>
            <Text
              className="text-2xl font-bold text-forge-text"
              style={{ letterSpacing: 4 }}
            >
              RANK
            </Text>
            <Text className="text-xs text-forge-muted">
              {selectedGroup?.name ?? 'Group standings'}
            </Text>
          </View>
        </View>
      </View>

      {/* Group selector — only show when there are multiple groups */}
      {groups.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 12,
            gap: 8,
            flexDirection: 'row',
            alignItems: 'flex-start',
          }}
        >
          {groups.map((item) => (
            <Pressable
              key={item.id}
              className={`rounded-full px-4 py-2 ${
                groupId === item.id
                  ? 'bg-primary'
                  : 'border border-forge-border bg-forge-elevated'
              }`}
              onPress={() => setSelectedGroupId(item.id)}
            >
              <Text
                className={`text-sm font-medium ${
                  groupId === item.id ? 'text-white' : 'text-forge-muted'
                }`}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {lbLoading || compLoading ? (
        <ActivityIndicator className="mt-8" color={Forge.primary} />
      ) : (leaderboard?.length ?? 0) === 0 &&
        (compliance?.length ?? 0) === 0 ? (
        /* Empty state — hide all controls until there's data */
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 font-bold tracking-widest text-forge-text">
            NOTHING HERE YET
          </Text>
          <Text className="text-center text-sm text-forge-muted">
            Log workouts to start competing with your group.
          </Text>
        </View>
      ) : (
        <>
          {/* Segmented control */}
          <View className="mx-4 mb-3 flex-row rounded-xl border border-forge-border bg-forge-surface p-1">
            <Pressable
              className={`flex-1 rounded-lg ${view === 'leaderboard' ? 'bg-forge-elevated' : ''}`}
              onPress={() => setView('leaderboard')}
            >
              <Text
                className={`py-2.5 text-center text-sm ${
                  view === 'leaderboard'
                    ? 'font-semibold text-forge-text'
                    : 'text-forge-muted'
                }`}
              >
                Leaderboard
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 rounded-lg ${view === 'compliance' ? 'bg-forge-elevated' : ''}`}
              onPress={() => setView('compliance')}
            >
              <Text
                className={`py-2.5 text-center text-sm ${
                  view === 'compliance'
                    ? 'font-semibold text-forge-text'
                    : 'text-forge-muted'
                }`}
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
                        ? 'bg-primary'
                        : 'border border-forge-border bg-forge-elevated'
                    }`}
                    onPress={() => setPeriod(item)}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        period === item ? 'text-white' : 'text-forge-muted'
                      }`}
                    >
                      {PERIOD_LABELS[item]}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <FlatList
                data={leaderboard}
                keyExtractor={(item) => item.userId}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: insets.bottom + 24,
                }}
                renderItem={({ item, index }) => (
                  <LeaderboardRow entry={item} rank={index + 1} />
                )}
                ItemSeparatorComponent={() => <View className="h-2" />}
              />
            </>
          ) : (
            <FlatList
              data={compliance}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: insets.bottom + 24,
              }}
              renderItem={({ item }) => <ComplianceRow entry={item} />}
              ItemSeparatorComponent={() => <View className="h-2" />}
            />
          )}
        </>
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
  return (
    <View className="flex-row items-center rounded-xl border border-forge-border bg-forge-surface p-3.5">
      <View className="mr-3 w-9 items-center">
        {rank === 1 ? (
          <Text className="text-base font-bold text-primary">{rank}</Text>
        ) : rank <= 3 ? (
          <Text className="text-base font-bold text-forge-text">{rank}</Text>
        ) : (
          <Text className="text-base font-bold text-forge-muted">{rank}</Text>
        )}
      </View>
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-forge-elevated">
        <User size={16} color={Forge.primary} weight="regular" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-forge-text">
          {entry.displayName ?? entry.username}
        </Text>
        <Text className="mt-0.5 text-xs text-forge-muted">
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
    <View className="flex-row items-center rounded-xl border border-forge-border bg-forge-surface p-3.5">
      <View
        className={`mr-3 h-3 w-3 rounded-full ${entry.isCompliant ? 'bg-primary' : 'bg-red-500'}`}
      />
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-forge-elevated">
        <User size={16} color={Forge.primary} weight="regular" />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-forge-text">
          {entry.displayName ?? entry.username}
        </Text>
        {/* Mini progress bar */}
        <View className="mt-1.5 h-1.5 rounded-full bg-forge-elevated">
          <View
            className={`h-1.5 rounded-full ${entry.isCompliant ? 'bg-primary' : 'bg-red-500'}`}
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>
      <Text className="ml-3 text-base font-semibold text-forge-text">
        {entry.qualifiedCount}
        <Text className="text-sm font-normal text-forge-muted">
          /{entry.required}
        </Text>
      </Text>
    </View>
  );
}

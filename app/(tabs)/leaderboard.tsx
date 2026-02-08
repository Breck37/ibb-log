import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

import { useMyGroups } from "@/lib/hooks/use-groups";
import {
  useLeaderboard,
  useWeeklyCompliance,
  type LeaderboardEntry,
} from "@/lib/hooks/use-compliance";

const PERIODS = ["weekly", "monthly", "yearly", "all-time"] as const;

export default function LeaderboardScreen() {
  const { data: groups } = useMyGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [period, setPeriod] =
    useState<(typeof PERIODS)[number]>("weekly");
  const [view, setView] = useState<"leaderboard" | "compliance">(
    "leaderboard",
  );

  const groupId = selectedGroupId ?? groups?.[0]?.id ?? "";

  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard(
    groupId,
    period,
  );
  const { data: compliance, isLoading: compLoading } =
    useWeeklyCompliance(groupId);

  if (!groups?.length) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-gray-500">Join a group to see leaderboards</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Group selector */}
      <FlatList
        horizontal
        data={groups}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-4 py-2"
        renderItem={({ item }) => (
          <Pressable
            className={`rounded-full px-4 py-2 ${
              groupId === item.id
                ? "bg-blue-600"
                : "bg-gray-200 dark:bg-gray-700"
            }`}
            onPress={() => setSelectedGroupId(item.id)}
          >
            <Text
              className={`text-sm font-medium ${
                groupId === item.id ? "text-white" : "dark:text-white"
              }`}
            >
              {item.name}
            </Text>
          </Pressable>
        )}
      />

      {/* View toggle */}
      <View className="flex-row border-b border-gray-200 dark:border-gray-700">
        <Pressable
          className={`flex-1 py-3 ${view === "leaderboard" ? "border-b-2 border-blue-600" : ""}`}
          onPress={() => setView("leaderboard")}
        >
          <Text
            className={`text-center font-medium ${view === "leaderboard" ? "text-blue-600" : "text-gray-500"}`}
          >
            Leaderboard
          </Text>
        </Pressable>
        <Pressable
          className={`flex-1 py-3 ${view === "compliance" ? "border-b-2 border-blue-600" : ""}`}
          onPress={() => setView("compliance")}
        >
          <Text
            className={`text-center font-medium ${view === "compliance" ? "text-blue-600" : "text-gray-500"}`}
          >
            Compliance
          </Text>
        </Pressable>
      </View>

      {view === "leaderboard" ? (
        <>
          {/* Period selector */}
          <FlatList
            horizontal
            data={PERIODS}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-4 py-2"
            renderItem={({ item }) => (
              <Pressable
                className={`rounded-full px-3 py-1.5 ${
                  period === item
                    ? "bg-blue-600"
                    : "bg-gray-100 dark:bg-gray-700"
                }`}
                onPress={() => setPeriod(item)}
              >
                <Text
                  className={`text-xs font-medium capitalize ${
                    period === item ? "text-white" : "dark:text-white"
                  }`}
                >
                  {item}
                </Text>
              </Pressable>
            )}
          />

          {lbLoading ? (
            <ActivityIndicator className="mt-8" />
          ) : (
            <FlatList
              data={leaderboard}
              keyExtractor={(item) => item.userId}
              contentContainerClassName="p-4"
              ListEmptyComponent={
                <Text className="text-center text-gray-500">
                  No workouts logged yet
                </Text>
              }
              renderItem={({ item, index }) => (
                <LeaderboardRow entry={item} rank={index + 1} />
              )}
            />
          )}
        </>
      ) : compLoading ? (
        <ActivityIndicator className="mt-8" />
      ) : (
        <FlatList
          data={compliance}
          keyExtractor={(item) => item.userId}
          contentContainerClassName="p-4"
          renderItem={({ item }) => (
            <View className="mb-2 flex-row items-center rounded-lg bg-white p-3 dark:bg-gray-800">
              <View
                className={`mr-3 h-3 w-3 rounded-full ${item.isCompliant ? "bg-green-500" : "bg-red-500"}`}
              />
              <View className="flex-1">
                <Text className="font-medium dark:text-white">
                  {item.displayName ?? item.username}
                </Text>
              </View>
              <Text className="text-sm text-gray-500">
                {item.qualifiedCount}/{item.required}
              </Text>
            </View>
          )}
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
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <View className="mb-2 flex-row items-center rounded-lg bg-white p-3 dark:bg-gray-800">
      <Text className="mr-3 w-8 text-center text-lg font-bold">
        {rank <= 3 ? medals[rank - 1] : rank}
      </Text>
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
        <FontAwesome name="user" size={16} color="#3b82f6" />
      </View>
      <View className="flex-1">
        <Text className="font-medium dark:text-white">
          {entry.displayName ?? entry.username}
        </Text>
        <Text className="text-xs text-gray-500">
          {entry.totalQualifiedWorkouts} qualified &middot;{" "}
          {entry.totalMinutes} min total &middot; avg {entry.avgMinutes} min
        </Text>
      </View>
    </View>
  );
}

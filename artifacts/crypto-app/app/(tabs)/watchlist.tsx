import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CoinRow from "@/components/CoinRow";
import { CoinRowSkeleton } from "@/components/SkeletonLoader";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";
import { useCryptoMarkets } from "@/hooks/useCryptoMarkets";

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { watchlist } = usePortfolio();
  const { data: markets, isLoading, refetch, isRefetching } = useCryptoMarkets();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const watchedCoins = useMemo(() => {
    if (!markets) return [];
    return markets.filter((c) => watchlist.includes(c.id));
  }, [markets, watchlist]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 16, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Watchlist</Text>
      </View>

      {isLoading ? (
        <View>
          {Array.from({ length: 6 }).map((_, i) => (
            <CoinRowSkeleton key={i} />
          ))}
        </View>
      ) : watchlist.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="star" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Nothing here yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Tap a coin and star it to track it here
          </Text>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/")}
          >
            <Text style={[styles.ctaBtnText, { color: colors.primaryForeground }]}>
              Browse Markets
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={watchedCoins}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CoinRow coin={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                Your watched coins aren't in our top 50 list right now.
              </Text>
            </View>
          }
          contentContainerStyle={{
            paddingBottom: Platform.OS === "web" ? 100 : 90,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  ctaBtn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  ctaBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});

import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import SparklineChart from "@/components/SparklineChart";
import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";
import { useCoinDetail } from "@/hooks/useCryptoMarkets";

function formatCurrency(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1000) return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (v >= 1) return `$${v.toFixed(2)}`;
  if (v >= 0.01) return `$${v.toFixed(4)}`;
  return `$${v.toFixed(6)}`;
}

interface StatCardProps {
  label: string;
  value: string;
}

function StatCard({ label, value }: StatCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

export default function CoinDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: coin, isLoading, isError } = useCoinDetail(id);
  const { isWatched, addToWatchlist, removeFromWatchlist } = usePortfolio();

  const watched = isWatched(id);
  const positive = (coin?.market_data?.price_change_percentage_24h ?? 0) >= 0;

  const sparkData: number[] = useMemo(() => {
    return coin?.market_data?.sparkline_7d?.price ?? [];
  }, [coin]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  function toggleWatch() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (watched) removeFromWatchlist(id);
    else addToWatchlist(id);
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (isError || !coin) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Feather name="alert-circle" size={40} color={colors.negative} />
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Failed to load coin data
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backLink, { color: colors.primary }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const md = coin.market_data;
  const price = md?.current_price?.usd ?? 0;
  const change24h = md?.price_change_percentage_24h ?? 0;
  const changeColor = change24h >= 0 ? colors.positive : colors.negative;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.navBar, { paddingTop: topInset + 8, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.navTitle}>
          <Image
            source={{ uri: coin.image?.small }}
            style={styles.navLogo}
            contentFit="contain"
          />
          <Text style={[styles.navName, { color: colors.foreground }]}>
            {coin.name}
          </Text>
          <Text style={[styles.navSymbol, { color: colors.mutedForeground }]}>
            {coin.symbol?.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity onPress={toggleWatch} style={styles.navBtn} activeOpacity={0.7}>
          <Feather
            name="star"
            size={22}
            color={watched ? "#F9C519" : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: Platform.OS === "web" ? 60 : 40,
        }}
      >
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: colors.foreground }]}>
            {formatCurrency(price)}
          </Text>
          <View style={[styles.changeBadge, { backgroundColor: changeColor + "22" }]}>
            <Feather
              name={change24h >= 0 ? "trending-up" : "trending-down"}
              size={13}
              color={changeColor}
            />
            <Text style={[styles.changeText, { color: changeColor }]}>
              {" "}{change24h >= 0 ? "+" : ""}{change24h.toFixed(2)}% (24h)
            </Text>
          </View>
        </View>

        {sparkData.length > 2 && (
          <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.chartLabel, { color: colors.mutedForeground }]}>7-Day Chart</Text>
            <SparklineChart
              data={sparkData}
              width={320}
              height={100}
              positive={positive}
              showGradient
            />
          </View>
        )}

        <View style={styles.statsGrid}>
          <StatCard label="Market Cap" value={formatCurrency(md?.market_cap?.usd ?? 0)} />
          <StatCard label="Rank" value={`#${coin.market_cap_rank}`} />
          <StatCard label="24h High" value={formatCurrency(md?.high_24h?.usd ?? 0)} />
          <StatCard label="24h Low" value={formatCurrency(md?.low_24h?.usd ?? 0)} />
          <StatCard label="Volume (24h)" value={formatCurrency(md?.total_volume?.usd ?? 0)} />
          <StatCard
            label="All-Time High"
            value={formatCurrency(md?.ath?.usd ?? 0)}
          />
        </View>

        {coin.description?.en && (
          <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.descTitle, { color: colors.foreground }]}>About</Text>
            <Text style={[styles.descText, { color: colors.mutedForeground }]} numberOfLines={6}>
              {coin.description.en.replace(/<[^>]*>/g, "")}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.tradeBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/exchange")}
          activeOpacity={0.8}
        >
          <Feather name="refresh-cw" size={16} color={colors.primaryForeground} />
          <Text style={[styles.tradeBtnText, { color: colors.primaryForeground }]}>
            Trade {coin.symbol?.toUpperCase()}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  navTitle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  navLogo: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  navName: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  navSymbol: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  priceSection: {
    paddingVertical: 20,
    gap: 10,
  },
  price: {
    fontSize: 42,
    fontFamily: "Inter_700Bold",
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  chartCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  chartLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  descCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  descTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  descText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  tradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  tradeBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  backLink: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

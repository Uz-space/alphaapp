import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";
import { useCryptoMarkets } from "@/hooks/useCryptoMarkets";

function formatCurrency(v: number) {
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  return `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function PortfolioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { holdings, removeHolding } = usePortfolio();
  const { data: markets } = useCryptoMarkets();

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const enriched = useMemo(() => {
    if (!markets) return [];
    return holdings.map((h) => {
      const market = markets.find((m) => m.id === h.coinId);
      const price = market?.current_price ?? 0;
      const value = price * h.amount;
      const change24h = market?.price_change_percentage_24h ?? 0;
      return { ...h, price, value, change24h };
    });
  }, [holdings, markets]);

  const totalValue = useMemo(
    () => enriched.reduce((sum, h) => sum + h.value, 0),
    [enriched]
  );

  const totalChange = useMemo(() => {
    if (enriched.length === 0) return 0;
    const weighted = enriched.reduce(
      (sum, h) => sum + h.change24h * (h.value / (totalValue || 1)),
      0
    );
    return weighted;
  }, [enriched, totalValue]);

  const isPositive = totalChange >= 0;

  function confirmRemove(coinId: string, name: string) {
    Alert.alert(
      "Remove Holding",
      `Remove ${name} from your portfolio?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeHolding(coinId);
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 16, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Portfolio</Text>
        {holdings.length > 0 && (
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
              Total Value
            </Text>
            <Text style={[styles.summaryValue, { color: colors.foreground }]}>
              {formatCurrency(totalValue)}
            </Text>
            <View style={styles.changeRow}>
              <Feather
                name={isPositive ? "trending-up" : "trending-down"}
                size={14}
                color={isPositive ? colors.positive : colors.negative}
              />
              <Text
                style={[
                  styles.changeText,
                  { color: isPositive ? colors.positive : colors.negative },
                ]}
              >
                {" "}{Math.abs(totalChange).toFixed(2)}% (24h)
              </Text>
            </View>
          </View>
        )}
      </View>

      {holdings.length === 0 ? (
        <View style={styles.emptyState}>
          <Feather name="pie-chart" size={52} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No holdings yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
            Use the Exchange tab to start trading
          </Text>
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/exchange")}
          >
            <Text style={[styles.ctaBtnText, { color: colors.primaryForeground }]}>
              Go to Exchange
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={enriched}
          keyExtractor={(item) => item.coinId}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.push(`/coin/${item.coinId}` as any)}
              onLongPress={() => confirmRemove(item.coinId, item.name)}
              style={[
                styles.holdingRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Image source={{ uri: item.image }} style={styles.logo} />
              <View style={styles.info}>
                <Text style={[styles.coinName, { color: colors.foreground }]}>
                  {item.name}
                </Text>
                <Text style={[styles.coinAmount, { color: colors.mutedForeground }]}>
                  {item.amount.toFixed(6)} {item.symbol.toUpperCase()}
                </Text>
              </View>
              <View style={styles.rightInfo}>
                <Text style={[styles.coinValue, { color: colors.foreground }]}>
                  {formatCurrency(item.value)}
                </Text>
                <Text
                  style={[
                    styles.coinChange,
                    {
                      color:
                        item.change24h >= 0 ? colors.positive : colors.negative,
                    },
                  ]}
                >
                  {item.change24h >= 0 ? "+" : ""}
                  {item.change24h.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={{
            padding: 16,
            gap: 10,
            paddingBottom: Platform.OS === "web" ? 100 : 90,
          }}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <Text style={[styles.hint, { color: colors.mutedForeground }]}>
              Long press to remove a holding
            </Text>
          }
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
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 4,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 36,
    fontFamily: "Inter_700Bold",
  },
  changeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  changeText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
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
  holdingRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  info: { flex: 1 },
  coinName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  coinAmount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  rightInfo: { alignItems: "flex-end" },
  coinValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  coinChange: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 3,
  },
  hint: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 16,
    marginBottom: 8,
  },
});

import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";
import { CoinMarket } from "@/hooks/useCryptoMarkets";
import SparklineChart from "./SparklineChart";

interface Props {
  coin: CoinMarket;
  showRank?: boolean;
}

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

function formatMarketCap(cap: number): string {
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${cap.toLocaleString()}`;
}

export default function CoinRow({ coin, showRank }: Props) {
  const colors = useColors();
  const positive = coin.price_change_percentage_24h >= 0;
  const changeColor = positive ? colors.positive : colors.negative;
  const sparkData = coin.sparkline_in_7d?.price ?? [];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={() => router.push(`/coin/${coin.id}` as any)}
    >
      <View style={styles.left}>
        {showRank && (
          <Text style={[styles.rank, { color: colors.mutedForeground }]}>
            {coin.market_cap_rank}
          </Text>
        )}
        <Image
          source={{ uri: coin.image }}
          style={styles.logo}
          contentFit="contain"
        />
        <View>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {coin.name}
          </Text>
          <Text style={[styles.symbol, { color: colors.mutedForeground }]}>
            {coin.symbol.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.middle}>
        {sparkData.length > 2 && (
          <SparklineChart
            data={sparkData.slice(-48)}
            width={64}
            height={32}
            positive={positive}
          />
        )}
      </View>

      <View style={styles.right}>
        <Text style={[styles.price, { color: colors.foreground }]}>
          {formatPrice(coin.current_price)}
        </Text>
        <View style={[styles.badge, { backgroundColor: changeColor + "22" }]}>
          <Feather
            name={positive ? "trending-up" : "trending-down"}
            size={10}
            color={changeColor}
          />
          <Text style={[styles.change, { color: changeColor }]}>
            {" "}{Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  rank: {
    fontSize: 12,
    width: 20,
    textAlign: "center",
  },
  logo: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  symbol: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  middle: {
    width: 64,
    alignItems: "center",
    marginHorizontal: 8,
  },
  right: {
    alignItems: "flex-end",
    minWidth: 90,
  },
  price: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  change: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});

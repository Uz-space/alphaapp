import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePortfolio } from "@/context/PortfolioContext";
import { useColors } from "@/hooks/useColors";
import { CoinMarket, useCryptoMarkets } from "@/hooks/useCryptoMarkets";

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

interface CoinPickerModalProps {
  visible: boolean;
  coins: CoinMarket[];
  onSelect: (coin: CoinMarket) => void;
  onClose: () => void;
  exclude?: string;
}

function CoinPickerModal({
  visible,
  coins,
  onSelect,
  onClose,
  exclude,
}: CoinPickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = exclude ? coins.filter((c) => c.id !== exclude) : coins;
    if (!q) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [coins, search, exclude]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Coin</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
        </View>
        <View style={[styles.modalSearch, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={15} color={colors.mutedForeground} />
          <TextInput
            style={[styles.modalSearchInput, { color: colors.foreground }]}
            placeholder="Search..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="none"
            autoFocus
          />
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.coinOption, { borderBottomColor: colors.border }]}
              onPress={() => {
                onSelect(item);
                setSearch("");
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Image source={{ uri: item.image }} style={styles.coinOptionLogo} contentFit="contain" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.coinOptionName, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.coinOptionSymbol, { color: colors.mutedForeground }]}>
                  {item.symbol.toUpperCase()} · ${formatPrice(item.current_price)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
}

export default function ExchangeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: markets, isLoading } = useCryptoMarkets();
  const { holdings, addHolding, updateHolding } = usePortfolio();

  const [fromCoin, setFromCoin] = useState<CoinMarket | null>(null);
  const [toCoin, setToCoin] = useState<CoinMarket | null>(null);
  const [fromAmount, setFromAmount] = useState("");
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [executing, setExecuting] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const fromHolding = useMemo(
    () => holdings.find((h) => h.coinId === fromCoin?.id),
    [holdings, fromCoin]
  );

  const toAmount = useMemo(() => {
    if (!fromCoin || !toCoin || !fromAmount) return "";
    const from = parseFloat(fromAmount);
    if (isNaN(from) || from <= 0) return "";
    const fromPrice = fromCoin.current_price;
    const toPrice = toCoin.current_price;
    if (!fromPrice || !toPrice) return "";
    const result = (from * fromPrice) / toPrice;
    return result.toFixed(6);
  }, [fromCoin, toCoin, fromAmount]);

  const exchangeRate = useMemo(() => {
    if (!fromCoin || !toCoin) return null;
    return fromCoin.current_price / toCoin.current_price;
  }, [fromCoin, toCoin]);

  function swapCoins() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = fromCoin;
    setFromCoin(toCoin);
    setToCoin(temp);
    setFromAmount("");
  }

  async function executeExchange() {
    if (!fromCoin || !toCoin || !fromAmount || !toAmount) return;
    const from = parseFloat(fromAmount);
    const to = parseFloat(toAmount);
    if (isNaN(from) || from <= 0) return;

    if (fromHolding && fromHolding.amount < from) {
      Alert.alert("Insufficient Balance", `You only have ${fromHolding.amount.toFixed(6)} ${fromCoin.symbol.toUpperCase()}`);
      return;
    }

    setExecuting(true);
    await new Promise((r) => setTimeout(r, 800));

    if (fromHolding) {
      const newAmount = fromHolding.amount - from;
      updateHolding(fromCoin.id, newAmount);
    }

    addHolding({
      coinId: toCoin.id,
      symbol: toCoin.symbol,
      name: toCoin.name,
      image: toCoin.image,
      amount: to,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setExecuting(false);
    setFromAmount("");

    Alert.alert(
      "Exchange Complete",
      `Successfully exchanged ${from} ${fromCoin.symbol.toUpperCase()} → ${to} ${toCoin.symbol.toUpperCase()}`
    );
  }

  const canExecute =
    fromCoin && toCoin && fromAmount && parseFloat(fromAmount) > 0 && !!toAmount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: topInset + 16,
          paddingHorizontal: 16,
          paddingBottom: Platform.OS === "web" ? 100 : 100,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Exchange</Text>

        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Loading prices...
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>From</Text>
              <View style={styles.cardRow}>
                <TouchableOpacity
                  style={[styles.coinSelector, { backgroundColor: colors.muted }]}
                  onPress={() => setShowFromPicker(true)}
                  activeOpacity={0.7}
                >
                  {fromCoin ? (
                    <>
                      <Image source={{ uri: fromCoin.image }} style={styles.selectorLogo} contentFit="contain" />
                      <Text style={[styles.selectorSymbol, { color: colors.foreground }]}>
                        {fromCoin.symbol.toUpperCase()}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.selectorPlaceholder, { color: colors.mutedForeground }]}>
                      Select
                    </Text>
                  )}
                  <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.amountInput, { color: colors.foreground }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.mutedForeground}
                  value={fromAmount}
                  onChangeText={setFromAmount}
                  keyboardType="decimal-pad"
                />
              </View>
              {fromHolding && (
                <Text style={[styles.balanceText, { color: colors.mutedForeground }]}>
                  Balance: {fromHolding.amount.toFixed(6)} {fromCoin?.symbol.toUpperCase()}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[styles.swapBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={swapCoins}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={18} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>To</Text>
              <View style={styles.cardRow}>
                <TouchableOpacity
                  style={[styles.coinSelector, { backgroundColor: colors.muted }]}
                  onPress={() => setShowToPicker(true)}
                  activeOpacity={0.7}
                >
                  {toCoin ? (
                    <>
                      <Image source={{ uri: toCoin.image }} style={styles.selectorLogo} contentFit="contain" />
                      <Text style={[styles.selectorSymbol, { color: colors.foreground }]}>
                        {toCoin.symbol.toUpperCase()}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.selectorPlaceholder, { color: colors.mutedForeground }]}>
                      Select
                    </Text>
                  )}
                  <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
                <Text style={[styles.toAmount, { color: colors.foreground }]}>
                  {toAmount || "0.00"}
                </Text>
              </View>
            </View>

            {exchangeRate && fromCoin && toCoin && (
              <View style={[styles.rateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.rateText, { color: colors.mutedForeground }]}>
                  {" "}1 {fromCoin.symbol.toUpperCase()} ={" "}
                  {exchangeRate.toFixed(6)} {toCoin.symbol.toUpperCase()}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.executeBtn,
                {
                  backgroundColor: canExecute ? colors.primary : colors.muted,
                  opacity: executing ? 0.7 : 1,
                },
              ]}
              onPress={executeExchange}
              disabled={!canExecute || executing}
              activeOpacity={0.8}
            >
              {executing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.executeBtnText,
                    {
                      color: canExecute
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                    },
                  ]}
                >
                  {canExecute ? "Exchange Now" : "Select coins to exchange"}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <CoinPickerModal
        visible={showFromPicker}
        coins={markets ?? []}
        onSelect={setFromCoin}
        onClose={() => setShowFromPicker(false)}
        exclude={toCoin?.id}
      />
      <CoinPickerModal
        visible={showToPicker}
        coins={markets ?? []}
        onSelect={setToCoin}
        onClose={() => setShowToPicker(false)}
        exclude={fromCoin?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coinSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  selectorLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  selectorSymbol: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  selectorPlaceholder: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
  },
  toAmount: {
    flex: 1,
    fontSize: 24,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    opacity: 0.8,
  },
  balanceText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  swapBtn: {
    alignSelf: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  rateCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 12,
  },
  rateText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  executeBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  executeBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  modalSearch: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  coinOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  coinOptionLogo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  coinOptionName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  coinOptionSymbol: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});

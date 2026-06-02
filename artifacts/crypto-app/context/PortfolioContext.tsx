import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Holding {
  coinId: string;
  symbol: string;
  name: string;
  image: string;
  amount: number;
}

interface PortfolioContextType {
  holdings: Holding[];
  watchlist: string[];
  addHolding: (holding: Omit<Holding, "amount"> & { amount: number }) => void;
  removeHolding: (coinId: string) => void;
  updateHolding: (coinId: string, amount: number) => void;
  addToWatchlist: (coinId: string) => void;
  removeFromWatchlist: (coinId: string) => void;
  isWatched: (coinId: string) => boolean;
}

const PortfolioContext = createContext<PortfolioContextType | null>(null);

const HOLDINGS_KEY = "@crypto_holdings";
const WATCHLIST_KEY = "@crypto_watchlist";

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [h, w] = await Promise.all([
          AsyncStorage.getItem(HOLDINGS_KEY),
          AsyncStorage.getItem(WATCHLIST_KEY),
        ]);
        if (h) setHoldings(JSON.parse(h));
        if (w) setWatchlist(JSON.parse(w));
      } catch {}
    })();
  }, []);

  const saveHoldings = useCallback(async (next: Holding[]) => {
    setHoldings(next);
    await AsyncStorage.setItem(HOLDINGS_KEY, JSON.stringify(next));
  }, []);

  const saveWatchlist = useCallback(async (next: string[]) => {
    setWatchlist(next);
    await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
  }, []);

  const addHolding = useCallback(
    (holding: Holding) => {
      setHoldings((prev) => {
        const existing = prev.find((h) => h.coinId === holding.coinId);
        let next: Holding[];
        if (existing) {
          next = prev.map((h) =>
            h.coinId === holding.coinId
              ? { ...h, amount: h.amount + holding.amount }
              : h
          );
        } else {
          next = [...prev, holding];
        }
        AsyncStorage.setItem(HOLDINGS_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeHolding = useCallback(
    (coinId: string) => {
      setHoldings((prev) => {
        const next = prev.filter((h) => h.coinId !== coinId);
        AsyncStorage.setItem(HOLDINGS_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const updateHolding = useCallback(
    (coinId: string, amount: number) => {
      setHoldings((prev) => {
        let next: Holding[];
        if (amount <= 0) {
          next = prev.filter((h) => h.coinId !== coinId);
        } else {
          next = prev.map((h) =>
            h.coinId === coinId ? { ...h, amount } : h
          );
        }
        AsyncStorage.setItem(HOLDINGS_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const addToWatchlist = useCallback(
    (coinId: string) => {
      setWatchlist((prev) => {
        if (prev.includes(coinId)) return prev;
        const next = [...prev, coinId];
        AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeFromWatchlist = useCallback(
    (coinId: string) => {
      setWatchlist((prev) => {
        const next = prev.filter((id) => id !== coinId);
        AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const isWatched = useCallback(
    (coinId: string) => watchlist.includes(coinId),
    [watchlist]
  );

  return (
    <PortfolioContext.Provider
      value={{
        holdings,
        watchlist,
        addHolding,
        removeHolding,
        updateHolding,
        addToWatchlist,
        removeFromWatchlist,
        isWatched,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used inside PortfolioProvider");
  return ctx;
}

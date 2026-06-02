import { useQuery } from "@tanstack/react-query";

const BASE = "https://api.coingecko.com/api/v3";

export interface CoinMarket {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  sparkline_in_7d?: { price: number[] };
}

export function useCryptoMarkets() {
  return useQuery<CoinMarket[]>({
    queryKey: ["markets"],
    queryFn: async () => {
      const res = await fetch(
        `${BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=true&price_change_percentage=24h`
      );
      if (!res.ok) throw new Error("Failed to fetch markets");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}

export function useCoinDetail(id: string) {
  return useQuery({
    queryKey: ["coin", id],
    queryFn: async () => {
      const res = await fetch(
        `${BASE}/coins/${id}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=true`
      );
      if (!res.ok) throw new Error("Failed to fetch coin");
      return res.json();
    },
    staleTime: 30000,
    enabled: !!id,
  });
}

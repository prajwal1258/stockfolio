import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StockQuote {
  symbol: string;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  open?: number;
  previousClose?: number;
  error?: string;
}

export const useStockPrices = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPrices = useCallback(async (symbols: string[]): Promise<StockQuote[]> => {
    if (symbols.length === 0) return [];

    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-stock-prices', {
        body: { symbols },
      });

      if (error) {
        console.error('Error fetching stock prices:', error);
        toast.error('Failed to fetch stock prices');
        return [];
      }

      return data.quotes || [];
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to fetch stock prices');
      return [];
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const updateStockPrices = useCallback(async (
    stocks: { id: string; symbol: string }[],
    onUpdate: (id: string, currentPrice: number) => void
  ) => {
    const symbols = stocks.map(s => s.symbol);
    const quotes = await fetchPrices(symbols);

    let updatedCount = 0;
    for (const quote of quotes) {
      if (quote.currentPrice && !quote.error) {
        const stock = stocks.find(s => s.symbol === quote.symbol);
        if (stock) {
          // Update in database
          const { error } = await supabase
            .from('stocks')
            .update({ current_price: quote.currentPrice })
            .eq('id', stock.id);

          if (!error) {
            onUpdate(stock.id, quote.currentPrice);
            updatedCount++;
          }
        }
      }
    }

    if (updatedCount > 0) {
      toast.success(`Updated ${updatedCount} stock price${updatedCount > 1 ? 's' : ''}`);
    } else if (quotes.length > 0) {
      toast.warning('No prices could be updated. Check stock symbols.');
    }
  }, [fetchPrices]);

  return { fetchPrices, updateStockPrices, isRefreshing };
};

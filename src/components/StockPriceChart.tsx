import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface StockPriceChartProps {
  symbol: string;
}

interface CandleData {
  date: string;
  price: number;
}

export const StockPriceChart = ({ symbol }: StockPriceChartProps) => {
  const [data, setData] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: response, error: fnError } = await supabase.functions.invoke('fetch-stock-prices', {
          body: { symbols: [symbol], historical: true },
        });

        if (fnError) {
          setError('Failed to load chart data');
          return;
        }

        const candles = response?.candles?.[symbol] || [];
        setData(candles);
      } catch (err) {
        setError('Failed to load chart data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistoricalData();
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="h-32 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
        {error || 'No historical data available'}
      </div>
    );
  }

  const priceChange = data.length >= 2 ? data[data.length - 1].price - data[0].price : 0;
  const lineColor = priceChange >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  return (
    <div className="h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <XAxis 
            dataKey="date" 
            hide 
          />
          <YAxis 
            hide 
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(var(--foreground))' }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
            labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={lineColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: lineColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

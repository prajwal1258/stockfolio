import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');
const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols, historical } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching ${historical ? 'historical' : 'current'} prices for symbols: ${symbols.join(', ')}`);

    // If historical data is requested, use Alpha Vantage for history + Finnhub for current price
    if (historical) {
      const candlePromises = symbols.map(async (symbol: string) => {
        try {
          // Fetch historical data from Alpha Vantage
          const historyResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}&outputsize=compact`
          );
          
          // Fetch current price from Finnhub
          const currentResponse = await fetch(
            `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
          );
          
          if (!historyResponse.ok) {
            console.error(`Failed to fetch historical data for ${symbol}: ${historyResponse.status}`);
            return { symbol, candles: [] };
          }

          const historyData = await historyResponse.json();
          console.log(`${symbol} Alpha Vantage response keys:`, Object.keys(historyData));

          // Check for API limit or error messages
          if (historyData['Note'] || historyData['Information']) {
            console.warn(`Alpha Vantage API limit or info for ${symbol}:`, historyData['Note'] || historyData['Information']);
            return { symbol, candles: [], error: 'API rate limit reached' };
          }

          if (historyData['Error Message']) {
            console.error(`Alpha Vantage error for ${symbol}:`, historyData['Error Message']);
            return { symbol, candles: [], error: historyData['Error Message'] };
          }

          const timeSeries = historyData['Time Series (Daily)'];
          if (!timeSeries) {
            console.warn(`No time series data for ${symbol}`);
            return { symbol, candles: [] };
          }

          // Get last 30 days of data
          const dates = Object.keys(timeSeries).sort().slice(-30);
          const candles = dates.map(date => ({
            date,
            price: parseFloat(timeSeries[date]['4. close']),
          }));

          // Append current real-time price from Finnhub
          if (currentResponse.ok) {
            const currentData = await currentResponse.json();
            if (currentData.c && currentData.c !== 0) {
              const today = new Date().toISOString().split('T')[0];
              // Only add if we don't already have today's data or update it
              const lastCandle = candles[candles.length - 1];
              if (lastCandle && lastCandle.date === today) {
                // Update today's price with real-time value
                lastCandle.price = currentData.c;
              } else {
                // Add today's real-time price as new data point
                candles.push({ date: today, price: currentData.c });
              }
              console.log(`${symbol}: Appended current price $${currentData.c}`);
            }
          }

          console.log(`${symbol}: Got ${candles.length} candles`);
          return { symbol, candles };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error fetching historical data for ${symbol}:`, error);
          return { symbol, candles: [], error: errorMessage };
        }
      });

      const results = await Promise.all(candlePromises);
      const candles: Record<string, Array<{ date: string; price: number }>> = {};
      for (const result of results) {
        candles[result.symbol] = result.candles;
      }

      return new Response(
        JSON.stringify({ candles }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch current quotes using Finnhub
    const quotePromises = symbols.map(async (symbol: string) => {
      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
        );
        
        if (!response.ok) {
          console.error(`Failed to fetch ${symbol}: ${response.status}`);
          return { symbol, error: `Failed to fetch: ${response.status}` };
        }

        const data = await response.json();
        console.log(`${symbol} quote data:`, data);

        if (data.c === 0 && data.h === 0 && data.l === 0) {
          console.warn(`No data available for ${symbol}`);
          return { symbol, error: 'No data available' };
        }

        return {
          symbol,
          currentPrice: data.c,
          change: data.d,
          changePercent: data.dp,
          high: data.h,
          low: data.l,
          open: data.o,
          previousClose: data.pc,
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Error fetching ${symbol}:`, error);
        return { symbol, error: errorMessage };
      }
    });

    const quotes = await Promise.all(quotePromises);

    return new Response(
      JSON.stringify({ quotes }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-stock-prices function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

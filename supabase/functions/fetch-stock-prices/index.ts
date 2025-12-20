import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');

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

    // If historical data is requested, fetch candles
    if (historical) {
      const now = Math.floor(Date.now() / 1000);
      const oneMonthAgo = now - (30 * 24 * 60 * 60);

      const candlePromises = symbols.map(async (symbol: string) => {
        try {
          const response = await fetch(
            `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${oneMonthAgo}&to=${now}&token=${FINNHUB_API_KEY}`
          );
          
          if (!response.ok) {
            console.error(`Failed to fetch candles for ${symbol}: ${response.status}`);
            return { symbol, candles: [] };
          }

          const data = await response.json();
          console.log(`${symbol} candle data status:`, data.s);

          if (data.s !== 'ok' || !data.c) {
            console.warn(`No candle data available for ${symbol}`);
            return { symbol, candles: [] };
          }

          // Transform data: c = close prices, t = timestamps
          const candles = data.t.map((timestamp: number, index: number) => ({
            date: new Date(timestamp * 1000).toISOString().split('T')[0],
            price: data.c[index],
          }));

          return { symbol, candles };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error(`Error fetching candles for ${symbol}:`, error);
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

    // Fetch current quotes for all symbols in parallel
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

        // Finnhub returns: c = current price, h = high, l = low, o = open, pc = previous close
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

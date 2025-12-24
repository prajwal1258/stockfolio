import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FINNHUB_API_KEY = Deno.env.get('FINNHUB_API_KEY');

interface NewsItem {
  id: number;
  category: string;
  datetime: number;
  headline: string;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Symbols array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Fetching news for symbols: ${symbols.join(', ')}`);

    // Get date range (last 7 days)
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch news for each symbol
    const newsPromises = symbols.slice(0, 5).map(async (symbol: string) => {
      try {
        const response = await fetch(
          `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`
        );

        if (!response.ok) {
          console.error(`Failed to fetch news for ${symbol}: ${response.status}`);
          return [];
        }

        const data: NewsItem[] = await response.json();
        console.log(`${symbol}: Got ${data.length} news items`);
        
        // Return top 3 news per symbol
        return data.slice(0, 3).map(item => ({
          ...item,
          symbol,
        }));
      } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        return [];
      }
    });

    const allNews = (await Promise.all(newsPromises)).flat();
    
    // Sort by datetime (most recent first) and limit to 10 items
    const sortedNews = allNews
      .sort((a, b) => b.datetime - a.datetime)
      .slice(0, 10);

    console.log(`Returning ${sortedNews.length} total news items`);

    return new Response(
      JSON.stringify({ news: sortedNews }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in fetch-stock-news function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

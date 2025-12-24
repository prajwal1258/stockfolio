import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ExternalLink, Newspaper, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface NewsItem {
  id: number;
  symbol: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number;
}

interface StockNewsFeedProps {
  symbols: string[];
}

export const StockNewsFeed = ({ symbols }: StockNewsFeedProps) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      if (symbols.length === 0) {
        setNews([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('fetch-stock-news', {
          body: { symbols },
        });

        if (fnError) {
          throw fnError;
        }

        setNews(data.news || []);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [symbols.join(',')]);

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Newspaper className="h-5 w-5" />
            Portfolio News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-16 w-24 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Newspaper className="h-5 w-5" />
            Portfolio News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (news.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Newspaper className="h-5 w-5" />
            Portfolio News
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No recent news for your portfolio stocks
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Newspaper className="h-5 w-5" />
          Portfolio News
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {news.map((item) => (
              <a
                key={`${item.id}-${item.symbol}`}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-4 hover:bg-muted/50 transition-colors group"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt=""
                    className="h-16 w-24 object-cover rounded flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {item.symbol}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(item.datetime * 1000), { addSuffix: true })}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                    {item.headline}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.summary}
                  </p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                    <span>{item.source}</span>
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Eye, Plus, Trash2, RefreshCw, TrendingUp, TrendingDown, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useStockPrices } from "@/hooks/useStockPrices";

interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  target_price: number | null;
  notes: string | null;
  currentPrice?: number;
  change?: number;
  changePercent?: number;
}

interface WatchlistProps {
  items: WatchlistItem[];
  onItemAdded: () => void;
  onItemDeleted: () => void;
  userId: string;
}

export const Watchlist = ({ items, onItemAdded, onItemDeleted, userId }: WatchlistProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSymbol, setNewSymbol] = useState("");
  const [newName, setNewName] = useState("");
  const [newTargetPrice, setNewTargetPrice] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [watchlistWithPrices, setWatchlistWithPrices] = useState<WatchlistItem[]>(items);
  const { fetchPrices, isRefreshing } = useStockPrices();

  const handleAddToWatchlist = async () => {
    if (!newSymbol.trim() || !newName.trim()) {
      toast.error("Please enter symbol and name");
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase.from("watchlist").insert({
        user_id: userId,
        symbol: newSymbol.toUpperCase().trim(),
        name: newName.trim(),
        target_price: newTargetPrice ? parseFloat(newTargetPrice) : null,
        notes: newNotes.trim() || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("This stock is already in your watchlist");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Added to watchlist");
      setNewSymbol("");
      setNewName("");
      setNewTargetPrice("");
      setNewNotes("");
      setIsAddDialogOpen(false);
      onItemAdded();
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      toast.error("Failed to add to watchlist");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveFromWatchlist = async (id: string) => {
    try {
      const { error } = await supabase.from("watchlist").delete().eq("id", id);
      if (error) throw error;
      toast.success("Removed from watchlist");
      onItemDeleted();
    } catch (error) {
      console.error("Error removing from watchlist:", error);
      toast.error("Failed to remove from watchlist");
    }
  };

  const refreshPrices = async () => {
    if (items.length === 0) return;
    
    const symbols = items.map(item => item.symbol);
    const quotes = await fetchPrices(symbols);
    
    const updatedItems = items.map(item => {
      const quote = quotes.find(q => q.symbol === item.symbol);
      return {
        ...item,
        currentPrice: quote?.currentPrice,
        change: quote?.change,
        changePercent: quote?.changePercent,
      };
    });
    
    setWatchlistWithPrices(updatedItems);
  };

  const displayItems = watchlistWithPrices.length > 0 && watchlistWithPrices[0].currentPrice 
    ? watchlistWithPrices 
    : items;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg flex items-center gap-2">
          <Eye className="h-5 w-5 text-primary" />
          Watchlist
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPrices}
            disabled={isRefreshing || items.length === 0}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add to Watchlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol</Label>
                    <Input
                      id="symbol"
                      placeholder="AAPL"
                      value={newSymbol}
                      onChange={(e) => setNewSymbol(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      placeholder="Apple Inc."
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetPrice">Target Price (optional)</Label>
                  <Input
                    id="targetPrice"
                    type="number"
                    placeholder="150.00"
                    value={newTargetPrice}
                    onChange={(e) => setNewTargetPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Why you're watching this stock..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddToWatchlist} disabled={isAdding} className="w-full">
                  {isAdding ? "Adding..." : "Add to Watchlist"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {displayItems.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No stocks in your watchlist yet. Add some to track!
          </p>
        ) : (
          <div className="space-y-3">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{item.symbol}</span>
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    {item.currentPrice && (
                      <span className="text-sm font-medium">${item.currentPrice.toFixed(2)}</span>
                    )}
                    {item.changePercent !== undefined && (
                      <span
                        className={`text-xs flex items-center gap-1 ${
                          item.changePercent >= 0 ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {item.changePercent >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {item.changePercent >= 0 ? "+" : ""}
                        {item.changePercent.toFixed(2)}%
                      </span>
                    )}
                    {item.target_price && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Target className="h-3 w-3" />
                        Target: ${item.target_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                      {item.notes}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveFromWatchlist(item.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

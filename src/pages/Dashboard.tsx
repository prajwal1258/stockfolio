import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  LogOut,
  Briefcase,
  DollarSign,
  BarChart3,
  Edit2,
  Trash2,
  RefreshCw,
  LineChart
} from "lucide-react";
import { useStockPrices } from "@/hooks/useStockPrices";
import { StockPriceChart } from "@/components/StockPriceChart";
import { Link, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
}

const Dashboard = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStock, setExpandedStock] = useState<string | null>(null);
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const { updateStockPrices, isRefreshing } = useStockPrices();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: "",
    avgPrice: "",
    currentPrice: "",
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStocks();
    }
  }, [user]);

  // Auto-refresh stock prices every 60 seconds
  const refreshPrices = useCallback(async () => {
    if (stocks.length === 0) return;
    
    await updateStockPrices(
      stocks.map(s => ({ id: s.id, symbol: s.symbol })),
      (id, currentPrice) => {
        setStocks(prev => prev.map(s => 
          s.id === id ? { ...s, current_price: currentPrice } : s
        ));
      }
    );
  }, [stocks, updateStockPrices]);

  useEffect(() => {
    if (stocks.length === 0 || !autoRefreshEnabled) return;
    
    const interval = setInterval(() => {
      refreshPrices();
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, [stocks.length, refreshPrices, autoRefreshEnabled]);

  const fetchStocks = async () => {
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load stocks");
    } else {
      setStocks(data || []);
    }
    setIsLoading(false);
  };

  const filteredStocks = stocks.filter(stock => 
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.current_price), 0);
  const totalInvested = stocks.reduce((sum, stock) => sum + (stock.quantity * stock.avg_price), 0);
  const totalGain = totalValue - totalInvested;
  const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  const handleAddStock = async () => {
    if (!formData.symbol || !formData.name || !formData.quantity || !formData.avgPrice || !formData.currentPrice) {
      toast.error("Please fill all fields");
      return;
    }

    const { error } = await supabase.from("stocks").insert({
      user_id: user?.id,
      symbol: formData.symbol.toUpperCase(),
      name: formData.name,
      quantity: Number(formData.quantity),
      avg_price: Number(formData.avgPrice),
      current_price: Number(formData.currentPrice),
    });

    if (error) {
      toast.error("Failed to add stock");
    } else {
      setFormData({ symbol: "", name: "", quantity: "", avgPrice: "", currentPrice: "" });
      setIsAddOpen(false);
      toast.success("Stock added successfully");
      fetchStocks();
    }
  };

  const handleUpdateStock = async () => {
    if (!editingStock || !formData.quantity || !formData.avgPrice || !formData.currentPrice) {
      toast.error("Please fill all fields");
      return;
    }

    const { error } = await supabase
      .from("stocks")
      .update({
        quantity: Number(formData.quantity),
        avg_price: Number(formData.avgPrice),
        current_price: Number(formData.currentPrice),
      })
      .eq("id", editingStock.id);

    if (error) {
      toast.error("Failed to update stock");
    } else {
      setEditingStock(null);
      setFormData({ symbol: "", name: "", quantity: "", avgPrice: "", currentPrice: "" });
      toast.success("Stock updated successfully");
      fetchStocks();
    }
  };

  const handleDeleteStock = async (id: string) => {
    const { error } = await supabase.from("stocks").delete().eq("id", id);

    if (error) {
      toast.error("Failed to remove stock");
    } else {
      toast.success("Stock removed from portfolio");
      fetchStocks();
    }
  };

  const openEditModal = (stock: Stock) => {
    setEditingStock(stock);
    setFormData({
      symbol: stock.symbol,
      name: stock.name,
      quantity: stock.quantity.toString(),
      avgPrice: stock.avg_price.toString(),
      currentPrice: stock.current_price.toString(),
    });
  };

  const handleRefreshPrices = async () => {
    if (stocks.length === 0) {
      toast.error("No stocks to refresh");
      return;
    }
    
    await updateStockPrices(
      stocks.map(s => ({ id: s.id, symbol: s.symbol })),
      (id, currentPrice) => {
        setStocks(prev => prev.map(s => 
          s.id === id ? { ...s, current_price: currentPrice } : s
        ));
      }
    );
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">StockFolio</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            icon={<Briefcase className="w-5 h-5" />}
            label="Portfolio Value"
            value={`$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          />
          <StatCard 
            icon={<DollarSign className="w-5 h-5" />}
            label="Total Invested"
            value={`$${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          />
          <StatCard 
            icon={<BarChart3 className="w-5 h-5" />}
            label="Total Gain/Loss"
            value={`${totalGain >= 0 ? '+' : ''}$${totalGain.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subValue={`${totalGainPercent >= 0 ? '+' : ''}${totalGainPercent.toFixed(2)}%`}
            isPositive={totalGain >= 0}
          />
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="auto-refresh"
                checked={autoRefreshEnabled}
                onCheckedChange={setAutoRefreshEnabled}
              />
              <Label htmlFor="auto-refresh" className="text-sm text-muted-foreground whitespace-nowrap">
                Auto-refresh
              </Label>
            </div>
            <Button 
              variant="outline" 
              onClick={handleRefreshPrices}
              disabled={isRefreshing || stocks.length === 0}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh Prices'}
            </Button>
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Add Stock
              </Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Add New Stock</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Symbol</Label>
                    <Input 
                      placeholder="AAPL"
                      value={formData.symbol}
                      onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number"
                      placeholder="100"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input 
                    placeholder="Apple Inc."
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Avg. Buy Price ($)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="150.00"
                      value={formData.avgPrice}
                      onChange={(e) => setFormData({...formData, avgPrice: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Current Price ($)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      placeholder="175.00"
                      value={formData.currentPrice}
                      onChange={(e) => setFormData({...formData, currentPrice: e.target.value})}
                    />
                  </div>
                </div>
                <Button variant="hero" className="w-full" onClick={handleAddStock}>
                  Add to Portfolio
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stocks Table */}
        <div className="glass rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Stock</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Quantity</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Avg. Price</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Current Price</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Value</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Gain/Loss</th>
                  <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
                  const value = stock.quantity * stock.current_price;
                  const invested = stock.quantity * stock.avg_price;
                  const gain = value - invested;
                  const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;
                  const isPositive = gain >= 0;

                  const isExpanded = expandedStock === stock.id;

                  return (
                    <>
                      <tr key={stock.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExpandedStock(isExpanded ? null : stock.id)}
                            >
                              <LineChart className={`w-4 h-4 transition-colors ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`} />
                            </Button>
                            <div>
                              <p className="font-semibold">{stock.symbol}</p>
                              <p className="text-sm text-muted-foreground">{stock.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium">{stock.quantity}</td>
                        <td className="p-4 text-right">${Number(stock.avg_price).toFixed(2)}</td>
                        <td className="p-4 text-right">${Number(stock.current_price).toFixed(2)}</td>
                        <td className="p-4 text-right font-medium">${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-right">
                          <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            <span className="font-medium">
                              {isPositive ? '+' : ''}{gainPercent.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditModal(stock)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteStock(stock.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${stock.id}-chart`} className="border-b border-border/50 bg-secondary/10">
                          <td colSpan={7} className="p-4">
                            <div className="pl-11">
                              <p className="text-sm text-muted-foreground mb-2">30-Day Price History</p>
                              <StockPriceChart symbol={stock.symbol} />
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredStocks.length === 0 && (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">
                {stocks.length === 0 
                  ? "No stocks yet. Add your first stock to get started!"
                  : "No stocks found matching your search."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Modal */}
      <Dialog open={!!editingStock} onOpenChange={() => setEditingStock(null)}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              Edit {editingStock?.symbol}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Avg. Buy Price ($)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.avgPrice}
                  onChange={(e) => setFormData({...formData, avgPrice: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Current Price ($)</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({...formData, currentPrice: e.target.value})}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditingStock(null)}>
                Cancel
              </Button>
              <Button variant="hero" className="flex-1" onClick={handleUpdateStock}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ 
  icon, 
  label, 
  value, 
  subValue,
  isPositive 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  subValue?: string;
  isPositive?: boolean;
}) => (
  <div className="glass rounded-2xl p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary">
        {icon}
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <p className="font-display text-2xl font-bold">{value}</p>
    {subValue && (
      <p className={`text-sm mt-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
        {subValue}
      </p>
    )}
  </div>
);

export default Dashboard;

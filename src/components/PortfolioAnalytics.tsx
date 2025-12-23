import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  sector?: string;
}

interface PortfolioHistory {
  recorded_at: string;
  total_value: number;
  total_invested: number;
}

interface PortfolioAnalyticsProps {
  stocks: Stock[];
  portfolioHistory: PortfolioHistory[];
}

const SECTOR_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(221, 83%, 53%)",
  "hsl(262, 83%, 58%)",
  "hsl(330, 81%, 60%)",
];

export const PortfolioAnalytics = ({ stocks, portfolioHistory }: PortfolioAnalyticsProps) => {
  const sectorData = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    
    stocks.forEach((stock) => {
      const sector = stock.sector || "Other";
      const value = stock.quantity * stock.current_price;
      sectorMap[sector] = (sectorMap[sector] || 0) + value;
    });

    return Object.entries(sectorMap)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value);
  }, [stocks]);

  const totalValue = sectorData.reduce((sum, item) => sum + item.value, 0);

  const performanceData = useMemo(() => {
    return portfolioHistory
      .map((record) => ({
        date: format(new Date(record.recorded_at), "MMM d"),
        value: Number(record.total_value),
        invested: Number(record.total_invested),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [portfolioHistory]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / totalValue) * 100).toFixed(1);
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            ${data.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  const PerformanceTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${Number(entry.value).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Sector Allocation Pie Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Sector Allocation</h3>
        {sectorData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {sectorData.map((_, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={SECTOR_COLORS[index % SECTOR_COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No stocks to display
          </div>
        )}
      </div>

      {/* Performance Over Time Line Chart */}
      <div className="glass rounded-2xl p-6">
        <h3 className="font-display text-lg font-semibold mb-4">Portfolio Performance</h3>
        {performanceData.length > 1 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis 
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<PerformanceTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                name="Portfolio Value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
              />
              <Line
                type="monotone"
                dataKey="invested"
                name="Total Invested"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                activeDot={{ r: 4, fill: "hsl(var(--muted-foreground))" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground text-center">
            <div>
              <p>Not enough data yet</p>
              <p className="text-sm mt-1">Portfolio history is recorded daily</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

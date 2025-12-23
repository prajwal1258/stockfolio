interface StockExport {
  symbol: string;
  name: string;
  quantity: number;
  avg_price: number;
  current_price: number;
}

interface PortfolioSummary {
  totalValue: number;
  totalInvested: number;
  totalGain: number;
  totalGainPercent: number;
}

export const exportToCSV = (stocks: StockExport[], summary: PortfolioSummary) => {
  const headers = [
    "Symbol",
    "Company Name",
    "Quantity",
    "Avg. Buy Price ($)",
    "Current Price ($)",
    "Value ($)",
    "Gain/Loss ($)",
    "Gain/Loss (%)"
  ];

  const rows = stocks.map(stock => {
    const value = stock.quantity * stock.current_price;
    const invested = stock.quantity * stock.avg_price;
    const gain = value - invested;
    const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;

    return [
      stock.symbol,
      `"${stock.name}"`,
      stock.quantity,
      stock.avg_price.toFixed(2),
      stock.current_price.toFixed(2),
      value.toFixed(2),
      gain.toFixed(2),
      gainPercent.toFixed(2)
    ].join(",");
  });

  // Add summary section
  const summaryRows = [
    "",
    "Portfolio Summary",
    `Total Value,$${summary.totalValue.toFixed(2)}`,
    `Total Invested,$${summary.totalInvested.toFixed(2)}`,
    `Total Gain/Loss,$${summary.totalGain.toFixed(2)}`,
    `Total Gain/Loss %,${summary.totalGainPercent.toFixed(2)}%`
  ];

  const csvContent = [headers.join(","), ...rows, ...summaryRows].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `portfolio_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (stocks: StockExport[], summary: PortfolioSummary) => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to export PDF");
    return;
  }

  const stockRows = stocks.map(stock => {
    const value = stock.quantity * stock.current_price;
    const invested = stock.quantity * stock.avg_price;
    const gain = value - invested;
    const gainPercent = invested > 0 ? (gain / invested) * 100 : 0;
    const isPositive = gain >= 0;

    return `
      <tr>
        <td>${stock.symbol}</td>
        <td>${stock.name}</td>
        <td style="text-align: right">${stock.quantity}</td>
        <td style="text-align: right">$${stock.avg_price.toFixed(2)}</td>
        <td style="text-align: right">$${stock.current_price.toFixed(2)}</td>
        <td style="text-align: right">$${value.toFixed(2)}</td>
        <td style="text-align: right; color: ${isPositive ? "#22c55e" : "#ef4444"}">
          ${isPositive ? "+" : ""}$${gain.toFixed(2)} (${gainPercent.toFixed(2)}%)
        </td>
      </tr>
    `;
  }).join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Portfolio Report - ${new Date().toLocaleDateString()}</title>
      <style>
        * { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { padding: 40px; max-width: 1000px; margin: 0 auto; }
        h1 { color: #1a1a1a; margin-bottom: 8px; }
        .date { color: #666; margin-bottom: 32px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
        .summary-card { background: #f5f5f5; padding: 16px; border-radius: 8px; }
        .summary-card .label { font-size: 12px; color: #666; text-transform: uppercase; }
        .summary-card .value { font-size: 24px; font-weight: 600; margin-top: 4px; }
        .positive { color: #22c55e; }
        .negative { color: #ef4444; }
        table { width: 100%; border-collapse: collapse; }
        th { text-align: left; padding: 12px 8px; border-bottom: 2px solid #e5e5e5; font-size: 12px; color: #666; text-transform: uppercase; }
        td { padding: 12px 8px; border-bottom: 1px solid #e5e5e5; }
        @media print {
          body { padding: 20px; }
          .summary { grid-template-columns: repeat(2, 1fr); }
        }
      </style>
    </head>
    <body>
      <h1>Portfolio Report</h1>
      <p class="date">Generated on ${new Date().toLocaleDateString("en-US", { 
        weekday: "long", 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })}</p>
      
      <div class="summary">
        <div class="summary-card">
          <div class="label">Portfolio Value</div>
          <div class="value">$${summary.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
          <div class="label">Total Invested</div>
          <div class="value">$${summary.totalInvested.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="summary-card">
          <div class="label">Total Gain/Loss</div>
          <div class="value ${summary.totalGain >= 0 ? "positive" : "negative"}">
            ${summary.totalGain >= 0 ? "+" : ""}$${summary.totalGain.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div class="summary-card">
          <div class="label">Return</div>
          <div class="value ${summary.totalGainPercent >= 0 ? "positive" : "negative"}">
            ${summary.totalGainPercent >= 0 ? "+" : ""}${summary.totalGainPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Company</th>
            <th style="text-align: right">Qty</th>
            <th style="text-align: right">Avg. Price</th>
            <th style="text-align: right">Current</th>
            <th style="text-align: right">Value</th>
            <th style="text-align: right">Gain/Loss</th>
          </tr>
        </thead>
        <tbody>
          ${stockRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};

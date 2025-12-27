# Stockfolio
Stockfolio is a comprehensive, real-time portfolio tracker designed for investors who need deep insights, automated data fetching, and seamless asset tracking. From sector-based analytics to personalized news feeds, Stockfolio centralizes your financial data into a single, high-performance dashboard.

🚀 Key Features
📊 Portfolio Tracking & Real-time Analytics
Auto-Refresh Engine: Your portfolio values update automatically via a dedicated background sync, ensuring you never make decisions on stale data.

30-Day Price Analytics: Interactive charts for every stock in your holdings, providing a clear visual of price action and trends over the last month.

API-Driven Refresh: A manual trigger endpoint allows you to force a real-time data fetch from financial providers at any moment.

🔍 Smart Watchlist
Direct Conversion: Spot an opportunity? Add quantities directly to your portfolio from your watchlist with a single click—no need to navigate through multiple menus.

Unified View: Keep a pulse on potential buys alongside your current winners.

📈 Deep Portfolio Insights
Sector Allocation: Gain a bird's-eye view of your diversification. Understand your exposure to Tech, Energy, Healthcare, etc., to manage risk effectively.

Performance Metrics: Detailed tracking of Gains/Losses, ROI, and historical performance.

📰 Contextual News Feed
Portfolio-Specific News: Don't get overwhelmed by market noise. Stockfolio filters news to show only stories relevant to the tickers you actually own.

Auto-Update: The news feed refreshes automatically to keep you ahead of market-moving events.

🛠️ Utility & UI
Export to PDF: Generate professional-grade portfolio reports for tax purposes or personal archiving with one click.

Theme Switching: Full support for Dark Mode and Light Mode to suit your environment and reduce eye strain.

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

⚙️ Installation
1.Clone the repository:

git clone https://github.com/prajwal1258/stockfolio.git

2.Install dependencies:

npm install

3.Configure Environment Variables: Create a .env file and add your API keys:

FINANCE_API_KEY=your_key_here
DATABASE_URL=your_db_connection_string

4.Run the application:

npm run dev


5.🚢 Migration to Supabase
Follow these steps to migrate from Lovable Cloud to your own Supabase project:

### 1. Supabase Project Setup
1.  Create a new project on [Supabase.com](https://supabase.com/).
2.  Go to **Project Settings > API** and copy your `Project URL` and `anon public` key.

### 2. Environment Variables
Update your `.env` file with the new credentials:
```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 3. Database Setup
1.  Go to the **SQL Editor** in your Supabase Dashboard.
2.  Copy the content from `database_setup.sql` (located in the artifacts or project root).
3.  Run the script to create tables (`profiles`, `stocks`, `watchlist`, etc.) and set up RLS policies.

### 4. Edge Functions Deployment
The app uses Supabase Edge Functions for fetching stock data to secure API keys.

1.  **Install Supabase CLI**:
    ```bash
    brew install supabase/tap/supabase
    ```
2.  **Login to CLI**:
    ```bash
    supabase login
    ```
3.  **Set Secrets** (Get keys from Finnhub & Alpha Vantage):
    ```bash
    supabase secrets set FINNHUB_API_KEY=your_key --project-ref your_project_id
    supabase secrets set ALPHA_VANTAGE_API_KEY=your_key --project-ref your_project_id
    ```
4.  **Deploy Functions**:
    ```bash
    supabase functions deploy fetch-stock-prices --project-ref your_project_id
    supabase functions deploy fetch-stock-news --project-ref your_project_id
    ```



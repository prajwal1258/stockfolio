-- Add sector column to stocks table
ALTER TABLE public.stocks ADD COLUMN sector text DEFAULT 'Other';

-- Create portfolio history table to track daily portfolio values
CREATE TABLE public.portfolio_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  recorded_at date NOT NULL DEFAULT CURRENT_DATE,
  total_value numeric NOT NULL DEFAULT 0,
  total_invested numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, recorded_at)
);

-- Enable RLS
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own portfolio history"
ON public.portfolio_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolio history"
ON public.portfolio_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolio history"
ON public.portfolio_history
FOR UPDATE
USING (auth.uid() = user_id);
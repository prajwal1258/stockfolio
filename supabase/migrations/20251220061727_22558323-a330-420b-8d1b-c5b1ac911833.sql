-- Change quantity column from integer to numeric to support fractional shares
ALTER TABLE public.stocks ALTER COLUMN quantity TYPE numeric USING quantity::numeric;
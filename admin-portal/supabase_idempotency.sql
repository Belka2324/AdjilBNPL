ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS idempotency_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS transactions_idempotency_key_idx ON public.transactions (idempotency_key);

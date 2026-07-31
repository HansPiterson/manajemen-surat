-- ============================================
-- MIGRATION 004: One-time TU to Courier Pairing
-- ============================================

CREATE TABLE IF NOT EXISTS public.courier_pairing_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    divisi_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    claimed_at TIMESTAMPTZ,
    claimed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pairing_tokens_divisi_user
    ON public.courier_pairing_tokens(divisi_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_pairing_tokens_expiry
    ON public.courier_pairing_tokens(expires_at)
    WHERE claimed_at IS NULL;

COMMENT ON TABLE public.courier_pairing_tokens IS
    'Short-lived one-time tokens used to pair one TU account with one courier';

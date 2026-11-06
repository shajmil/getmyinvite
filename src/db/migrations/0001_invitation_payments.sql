-- Additive migration: apply before enabling PREMIUM_PAYMENTS_ENABLED.
CREATE TABLE IF NOT EXISTS invitation_payments (
  order_id text PRIMARY KEY,
  invitation_id text REFERENCES invitations(id) ON DELETE SET NULL,
  user_id text NOT NULL,
  payment_id text UNIQUE,
  amount integer NOT NULL CHECK (amount = 9900),
  currency text NOT NULL CHECK (currency = 'INR'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
  created_at timestamp NOT NULL DEFAULT now(),
  last_checkout_at timestamp NOT NULL DEFAULT now(),
  paid_at timestamp
);
CREATE INDEX IF NOT EXISTS invitation_payments_invitation_idx ON invitation_payments(invitation_id);

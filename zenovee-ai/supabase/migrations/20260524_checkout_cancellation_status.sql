-- Extend payments status to include CANCELLED for explicit checkout dismiss/abandon flows
alter table public.payments drop constraint if exists payments_status_check;

alter table public.payments
  add constraint payments_status_check
  check (status in ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'CREDIT_TOPUP'));

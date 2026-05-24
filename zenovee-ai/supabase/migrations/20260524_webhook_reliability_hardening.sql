-- Webhook reliability hardening for Razorpay billing sync

alter table public.billing_events
  add column if not exists verification_result text not null default 'verified';

alter table public.billing_events
  add column if not exists retry_count integer not null default 0;

alter table public.billing_events
  add column if not exists failure_reason text;

alter table public.billing_events
  alter column processing_status set default 'processed';

alter table public.billing_events
  drop constraint if exists billing_events_processing_status_check;

alter table public.billing_events
  add constraint billing_events_processing_status_check
  check (
    processing_status in (
      'processing',
      'processed',
      'duplicate',
      'ignored',
      'retrying',
      'failed'
    )
  );

alter table public.billing_events
  drop constraint if exists billing_events_verification_result_check;

alter table public.billing_events
  add constraint billing_events_verification_result_check
  check (verification_result in ('verified', 'invalid_signature', 'malformed_payload'));

create index if not exists idx_billing_events_processing_status
  on public.billing_events(processing_status, created_at desc);

create index if not exists idx_billing_events_retry_count
  on public.billing_events(retry_count desc, created_at desc);

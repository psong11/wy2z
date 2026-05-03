-- wy2z Supabase schema
-- Apply with: psql "$SUPABASE_DB_URL" -f supabase/schema.sql
-- Idempotent — safe to re-run.

-- =============================================================================
-- observations table — one row per scheduled capture
-- =============================================================================

create table if not exists public.observations (
    id uuid primary key default gen_random_uuid(),
    captured_at timestamptz not null default now(),

    -- the photo this observation is built from
    photo_path text not null,                 -- key in the plant-photos bucket
    photo_url text not null,                  -- public URL for dashboard

    -- environment readings at capture time (DHT11)
    air_temp_c real,
    air_humidity_pct real,

    -- Claude's structured verdict (matches analyze.py output)
    verdict jsonb,

    -- what the orchestrator did with the verdict
    action_taken text,                        -- 'water_tomato' | 'water_zinnia_a' | 'none' | ...
    action_payload jsonb,                     -- e.g. { "ml": 200, "duration_s": 1.5 }
    action_result text,                       -- 'success' | 'failure' | 'skipped'

    notes text                                -- freeform Pi-side annotation
);

create index if not exists observations_captured_at_idx
    on public.observations (captured_at desc);

-- enable row-level security; public read, service_role bypass for writes
alter table public.observations enable row level security;

drop policy if exists "anon read observations" on public.observations;
create policy "anon read observations"
    on public.observations
    for select
    to anon, authenticated
    using (true);

-- =============================================================================
-- plant-photos storage bucket — public read, service_role write
-- =============================================================================

insert into storage.buckets (id, name, public)
values ('plant-photos', 'plant-photos', true)
on conflict (id) do update set public = excluded.public;

-- public can read (already covered by bucket public flag, but explicit policy is clearer)
drop policy if exists "anon read plant-photos" on storage.objects;
create policy "anon read plant-photos"
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'plant-photos');

-- =============================================================================
-- summary
-- =============================================================================

select
    'observations' as object,
    count(*)::text as rows
from public.observations
union all
select 'plant-photos bucket', exists(select 1 from storage.buckets where id = 'plant-photos')::text;

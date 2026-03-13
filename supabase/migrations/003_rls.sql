-- Migration 003: Row Level Security Policies

-- ============================================================
-- transactions tablosu için RLS
-- ============================================================
alter table transactions enable row level security;

-- Kullanıcı kendi işlemlerini görebilir
create policy "Users can view own transactions"
  on transactions for select
  using (auth.uid() = owner_id);

-- Kullanıcı kendi işlemlerini ekleyebilir
create policy "Users can insert own transactions"
  on transactions for insert
  with check (auth.uid() = owner_id);

-- Kullanıcı kendi işlemlerini güncelleyebilir
create policy "Users can update own transactions"
  on transactions for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Kullanıcı kendi işlemlerini silebilir
create policy "Users can delete own transactions"
  on transactions for delete
  using (auth.uid() = owner_id);

-- ============================================================
-- asset_types: herkes okuyabilir (katalog veri)
-- ============================================================
alter table asset_types enable row level security;

create policy "Anyone can read asset_types"
  on asset_types for select
  using (true);

-- ============================================================
-- price_sources: herkes okuyabilir
-- ============================================================
alter table price_sources enable row level security;

create policy "Anyone can read price_sources"
  on price_sources for select
  using (true);

-- ============================================================
-- asset_price_mappings: herkes okuyabilir
-- ============================================================
alter table asset_price_mappings enable row level security;

create policy "Anyone can read asset_price_mappings"
  on asset_price_mappings for select
  using (true);

-- ============================================================
-- price_snapshots: herkes okuyabilir, service role yazabilir
-- ============================================================
alter table price_snapshots enable row level security;

create policy "Anyone can read price_snapshots"
  on price_snapshots for select
  using (true);

-- ============================================================
-- app_settings: herkes okuyabilir
-- ============================================================
alter table app_settings enable row level security;

create policy "Anyone can read app_settings"
  on app_settings for select
  using (true);

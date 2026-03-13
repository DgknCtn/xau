-- Migration 001: Initial Schema
-- Kişisel Altın ve Döviz Portföy Takip Uygulaması

create extension if not exists pgcrypto;

-- ============================================================
-- asset_types: Desteklenen varlık tipleri (sabit katalog)
-- ============================================================
create table if not exists asset_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  category text not null check (category in ('gold', 'fx')),
  unit_type text not null check (unit_type in ('gram', 'adet', 'currency_unit')),
  purity_or_variant text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- price_sources: Fiyat sağlayıcıları
-- ============================================================
create table if not exists price_sources (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- asset_price_mappings: Dış kaynak → iç varlık eşlemesi
-- ============================================================
create table if not exists asset_price_mappings (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references price_sources(id),
  asset_type_id uuid not null references asset_types(id),
  external_key text not null,
  external_label text,
  pricing_side_for_valuation text not null default 'buy',
  transform_rule jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(source_id, asset_type_id)
);

-- ============================================================
-- transactions: Kullanıcı işlemleri
-- ============================================================
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id),
  asset_type_id uuid not null references asset_types(id),
  transaction_type text not null check (transaction_type in ('buy', 'sell')),
  quantity numeric(18,6) not null check (quantity > 0),
  unit_price numeric(18,6) not null check (unit_price >= 0),
  total_amount numeric(18,6) generated always as (quantity * unit_price) stored,
  transaction_date date not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- price_snapshots: Anlık fiyat verileri (snapshot yaklaşımı)
-- ============================================================
create table if not exists price_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references price_sources(id),
  asset_type_id uuid not null references asset_types(id),
  buy_price numeric(18,6),
  sell_price numeric(18,6),
  raw_external_key text,
  raw_payload jsonb,
  price_timestamp timestamptz not null,
  fetched_at timestamptz not null default now()
);

-- ============================================================
-- app_settings: Uygulama yapılandırma ayarları
-- ============================================================
create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ============================================================
-- İndeksler
-- ============================================================
create index if not exists idx_transactions_owner_asset_date
  on transactions(owner_id, asset_type_id, transaction_date);

create index if not exists idx_transactions_owner_date
  on transactions(owner_id, transaction_date desc);

create index if not exists idx_price_snapshots_asset_time
  on price_snapshots(asset_type_id, price_timestamp desc);

create index if not exists idx_asset_price_mappings_source_key
  on asset_price_mappings(source_id, external_key);

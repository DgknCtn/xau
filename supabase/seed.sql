-- Seed Data: asset_types, price_sources, asset_price_mappings

-- ============================================================
-- asset_types
-- ============================================================
insert into asset_types (code, name, category, unit_type, purity_or_variant, display_order) values
  ('GOLD_24_GRAM',         '24 Ayar Gram Altın',     'gold', 'gram',          '24_ayar',       1),
  ('GOLD_22_GRAM',         '22 Ayar Gram Altın',     'gold', 'gram',          '22_ayar',       2),
  ('GOLD_QUARTER',         'Çeyrek Altın',            'gold', 'adet',          'ceyrek',        3),
  ('GOLD_FULL',            'Tam Altın',               'gold', 'adet',          'tam',           4),
  ('GOLD_22_SCRAP_BRACELET','22 Ayar Hurda Bilezik', 'gold', 'gram',          '22_ayar_hurda', 5),
  ('FX_USD',               'Amerikan Doları (USD)',   'fx',   'currency_unit', null,            6),
  ('FX_EUR',               'Euro (EUR)',              'fx',   'currency_unit', null,            7)
on conflict (code) do nothing;

-- ============================================================
-- price_sources
-- ============================================================
insert into price_sources (code, name) values
  ('MANUAL', 'Manuel Giriş')
on conflict (code) do nothing;

-- ============================================================
-- asset_price_mappings
-- ============================================================
insert into asset_price_mappings (source_id, asset_type_id, external_key, external_label, pricing_side_for_valuation)
select
  ps.id,
  at.id,
  m.external_key,
  m.external_label,
  'buy'
from (values
  ('GOLD_24_GRAM',          '24_AYAR_GRAM',   '24 Ayar Gram Altın'),
  ('GOLD_22_GRAM',          '22_AYAR_GRAM',   '22 Ayar Gram Altın'),
  ('GOLD_QUARTER',          'CEYREK',         'Çeyrek Altın'),
  ('GOLD_FULL',             'TAM',            'Tam Altın'),
  ('GOLD_22_SCRAP_BRACELET','22_AYAR_HURDA',  '22 Ayar Hurda Bilezik'),
  ('FX_USD',                'USD',            'Amerikan Doları'),
  ('FX_EUR',                'EUR',            'Euro')
) as m(asset_code, external_key, external_label)
join asset_types at on at.code = m.asset_code
cross join (select id from price_sources where code = 'MANUAL') ps
on conflict (source_id, asset_type_id) do nothing;

-- ============================================================
-- app_settings: varsayılan ayarlar
-- ============================================================
insert into app_settings (key, value) values
  ('pnl_costing_method',      '"average_cost"'),
  ('default_price_source',    '"MANUAL"'),
  ('fallback_to_last_price',  'true'),
  ('default_report_period',   '"30d"')
on conflict (key) do nothing;

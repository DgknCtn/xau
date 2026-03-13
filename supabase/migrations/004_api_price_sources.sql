-- Migration 004: Add API Price Sources and Mappings

-- 1. Add new Price Sources
insert into price_sources (code, name) values
  ('COLLECTAPI', 'CollectAPI (Altın)'),
  ('ER_API',     'ExchangeRate-API (Döviz)')
on conflict (code) do nothing;

-- 2. Add API Mappings for COLLECTAPI (Gold)
insert into asset_price_mappings (source_id, asset_type_id, external_key, external_label, pricing_side_for_valuation)
select
  ps.id,
  at.id,
  m.external_key,
  m.external_label,
  'buy'
from (values
  ('GOLD_24_GRAM',          'Gram Altın',      'CollectAPI Gram Altın'),
  ('GOLD_22_GRAM',          '22 Ayar Altın',   'CollectAPI 22 Ayar Gram Altın'),
  ('GOLD_QUARTER',          'Çeyrek Altın',    'CollectAPI Çeyrek Altın'),
  ('GOLD_FULL',             'Tam Altın',       'CollectAPI Tam Altın'),
  ('GOLD_22_SCRAP_BRACELET','22 Ayar Bilezik', 'CollectAPI 22 Ayar Bilezik')
) as m(asset_code, external_key, external_label)
join asset_types at on at.code = m.asset_code
cross join (select id from price_sources where code = 'COLLECTAPI') ps
on conflict (source_id, asset_type_id) do nothing;

-- 3. Add API Mappings for ER_API (Forex)
insert into asset_price_mappings (source_id, asset_type_id, external_key, external_label, pricing_side_for_valuation)
select
  ps.id,
  at.id,
  m.external_key,
  m.external_label,
  'buy'
from (values
  ('FX_USD', 'USD', 'ER-API USD'),
  ('FX_EUR', 'EUR', 'ER-API EUR')
) as m(asset_code, external_key, external_label)
join asset_types at on at.code = m.asset_code
cross join (select id from price_sources where code = 'ER_API') ps
on conflict (source_id, asset_type_id) do nothing;

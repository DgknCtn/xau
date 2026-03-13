-- Migration 002: SQL Views

-- ============================================================
-- v_latest_prices: Her varlık için en son fiyat snapshot'u
-- ============================================================
create or replace view v_latest_prices as
select distinct on (ps.asset_type_id)
  ps.asset_type_id,
  ps.source_id,
  ps.buy_price as latest_buy_price,
  ps.sell_price as latest_sell_price,
  ps.price_timestamp,
  ps.fetched_at,
  at.code as asset_code,
  at.name as asset_name
from price_snapshots ps
join asset_types at on at.id = ps.asset_type_id
order by ps.asset_type_id, ps.price_timestamp desc;

-- ============================================================
-- v_portfolio_positions: İşlemlerden türetilmiş pozisyonlar
-- owner bazında, varlık bazında
-- ============================================================
create or replace view v_portfolio_positions as
select
  t.owner_id,
  t.asset_type_id,
  at.code as asset_code,
  at.name as asset_name,
  at.category,
  at.unit_type,
  sum(case when t.transaction_type = 'buy' then t.quantity else 0 end) as total_bought,
  sum(case when t.transaction_type = 'sell' then t.quantity else 0 end) as total_sold,
  sum(case when t.transaction_type = 'buy' then t.quantity else -t.quantity end) as current_quantity,
  sum(case when t.transaction_type = 'buy' then t.total_amount else 0 end) as total_buy_amount,
  sum(case when t.transaction_type = 'sell' then t.total_amount else 0 end) as total_sell_amount,
  case
    when sum(case when t.transaction_type = 'buy' then t.quantity else 0 end) > 0
    then sum(case when t.transaction_type = 'buy' then t.total_amount else 0 end)
         / sum(case when t.transaction_type = 'buy' then t.quantity else 0 end)
    else 0
  end as average_buy_price,
  max(t.transaction_date) as last_transaction_date
from transactions t
join asset_types at on at.id = t.asset_type_id
group by t.owner_id, t.asset_type_id, at.code, at.name, at.category, at.unit_type
having sum(case when t.transaction_type = 'buy' then t.quantity else -t.quantity end) > 0
   or sum(case when t.transaction_type = 'sell' then t.total_amount else 0 end) > 0;

-- ============================================================
-- v_portfolio_valuation: Pozisyon + güncel fiyat = değerleme
-- ============================================================
create or replace view v_portfolio_valuation as
select
  pp.owner_id,
  pp.asset_type_id,
  pp.asset_code,
  pp.asset_name,
  pp.category,
  pp.unit_type,
  pp.current_quantity,
  pp.average_buy_price,
  pp.current_quantity * pp.average_buy_price as total_cost_basis,
  lp.latest_buy_price as current_price,
  pp.current_quantity * lp.latest_buy_price as current_market_value,
  (pp.current_quantity * lp.latest_buy_price) - (pp.current_quantity * pp.average_buy_price) as unrealized_pnl,
  lp.price_timestamp,
  lp.fetched_at as price_fetched_at
from v_portfolio_positions pp
left join v_latest_prices lp on lp.asset_type_id = pp.asset_type_id;

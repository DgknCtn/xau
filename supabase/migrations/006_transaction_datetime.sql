-- Migration 006: Change transaction_date to TIMESTAMPTZ

-- Önce view'ları düşürüp güncelleyeceğiz (çünkü transactions.transaction_date tipini değiştiriyoruz ve view'lar ona bağımlı)
drop view if exists v_portfolio_valuation;
drop view if exists v_portfolio_positions;

-- transactions tablosunun transaction_date kolonunu TIMESTAMP WITH TIME ZONE (TIMESTAMPTZ) olarak değiştiriyoruz.
-- TYPE USING ...::timestamptz komutuyla mevcut verileri saate (00:00:00+00) dönüştürerek koruyoruz.
alter table transactions
  alter column transaction_date type timestamptz using transaction_date::timestamptz;

-- Portfolio Positions View'ını tekrar oluşturuyoruz
create or replace view v_portfolio_positions as
select
  t.owner_id,
  t.asset_type_id,
  a.name as asset_name,
  a.category as asset_category,
  a.unit_type,
  sum(case when t.transaction_type = 'buy' then t.quantity else -t.quantity end) as current_quantity,
  sum(case when t.transaction_type = 'buy' then t.total_amount else 0 end) as total_buy_amount,
  sum(case when t.transaction_type = 'buy' then t.quantity else 0 end) as total_buy_quantity,
  case
    when sum(case when t.transaction_type = 'buy' then t.quantity else 0 end) > 0
    then sum(case when t.transaction_type = 'buy' then t.total_amount else 0 end) / sum(case when t.transaction_type = 'buy' then t.quantity else 0 end)
    else 0
  end as average_buy_price
from transactions t
join asset_types a on t.asset_type_id = a.id
where a.is_active = true
group by t.owner_id, t.asset_type_id, a.name, a.category, a.unit_type
having sum(case when t.transaction_type = 'buy' then t.quantity else -t.quantity end) > 0;

-- Portfolio Valuation View'ını tekrar oluşturuyoruz
create or replace view v_portfolio_valuation as
select
  p.owner_id,
  p.asset_type_id,
  p.asset_name,
  p.asset_category,
  p.unit_type,
  p.current_quantity,
  p.average_buy_price,
  (p.current_quantity * p.average_buy_price) as total_cost_basis,
  lp.latest_buy_price as current_price,
  (p.current_quantity * lp.latest_buy_price) as current_market_value,
  ((p.current_quantity * lp.latest_buy_price) - (p.current_quantity * p.average_buy_price)) as unrealized_pnl,
  lp.price_timestamp as last_price_update
from v_portfolio_positions p
left join v_latest_prices lp on p.asset_type_id = lp.asset_type_id;

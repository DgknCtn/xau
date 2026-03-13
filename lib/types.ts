export type AssetCategory = 'gold' | 'fx'
export type UnitType = 'gram' | 'adet' | 'currency_unit'
export type TransactionType = 'buy' | 'sell'

export interface AssetType {
  id: string
  code: string
  name: string
  category: AssetCategory
  unit_type: UnitType
  purity_or_variant: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  owner_id: string
  asset_type_id: string
  transaction_type: TransactionType
  quantity: number
  unit_price: number
  total_amount: number
  transaction_date: string
  note: string | null
  created_at: string
  updated_at: string
  asset_types?: AssetType
}

export interface PriceSnapshot {
  id: string
  source_id: string
  asset_type_id: string
  buy_price: number | null
  sell_price: number | null
  raw_external_key: string | null
  raw_payload: Record<string, unknown> | null
  price_timestamp: string
  fetched_at: string
}

export interface PortfolioPosition {
  owner_id: string
  asset_type_id: string
  asset_code: string
  asset_name: string
  category: AssetCategory
  unit_type: UnitType
  total_bought: number
  total_sold: number
  current_quantity: number
  total_buy_amount: number
  total_sell_amount: number
  average_buy_price: number
  last_transaction_date: string
}

export interface PortfolioValuation extends PortfolioPosition {
  total_cost_basis: number
  current_price: number | null
  current_market_value: number | null
  unrealized_pnl: number | null
  price_timestamp: string | null
  price_fetched_at: string | null
}

export interface DashboardSummary {
  total_cost: number
  total_current_value: number
  total_unrealized_pnl: number
  total_realized_pnl: number
  last_price_update: string | null
  positions: PortfolioValuation[]
}

export interface TransactionFormData {
  asset_type_id: string
  transaction_type: TransactionType
  quantity: number
  unit_price: number
  transaction_date: string
  note?: string
}

export interface ReportFilter {
  start_date: string
  end_date: string
  asset_type_id?: string
  transaction_type?: TransactionType
}

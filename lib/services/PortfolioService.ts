import { SupabaseClient } from '@supabase/supabase-js'
import { DashboardSummary, PortfolioValuation } from '@/lib/types'
import { PnLService } from './PnLService'

export class PortfolioService {
    private pnlService: PnLService

    constructor(private supabase: SupabaseClient) {
        this.pnlService = new PnLService(supabase)
    }

    async getPortfolioValuation(): Promise<PortfolioValuation[]> {
        const { data, error } = await this.supabase
            .from('v_portfolio_valuation')
            .select('*')

        if (error) throw new Error(error.message)
        return (data || []) as PortfolioValuation[]
    }

    async getDashboardSummary(): Promise<DashboardSummary> {
        const positions = await this.getPortfolioValuation()
        const realizedPnL = await this.pnlService.getTotalRealizedPnL()

        const total_cost = positions.reduce((s, p) => s + (Number(p.total_cost_basis) || 0), 0)
        const total_current_value = positions.reduce(
            (s, p) => s + (Number(p.current_market_value) || 0),
            0
        )
        const total_unrealized_pnl = total_current_value - total_cost

        // Son fiyat güncelleme zamanı
        const last_price_update =
            positions
                .map((p) => p.price_fetched_at)
                .filter(Boolean)
                .sort()
                .at(-1) ?? null

        return {
            total_cost,
            total_current_value,
            total_unrealized_pnl,
            total_realized_pnl: realizedPnL,
            last_price_update,
            positions,
        }
    }
}

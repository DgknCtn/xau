import { SupabaseClient } from '@supabase/supabase-js'
import { Transaction } from '@/lib/types'

interface PnLResult {
    assetTypeId: string
    realizedPnL: number
    totalBought: number
    totalSold: number
    currentQuantity: number
    averageCostPerUnit: number
    totalCostBasis: number
}

export class PnLService {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Belirli bir varlık için işlemleri ortalama maliyet yöntemiyle analiz eder.
     * Gerçekleşmiş P/L, mevcut pozisyon ve ortalama maliyet hesaplar.
     */
    calculateFromTransactions(transactions: Transaction[]): PnLResult {
        const sorted = [...transactions].sort(
            (a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
        )

        let avgCost = 0
        let currentQty = 0
        let totalBought = 0
        let totalSold = 0
        let realizedPnL = 0

        for (const tx of sorted) {
            const qty = Number(tx.quantity)
            const price = Number(tx.unit_price)

            if (tx.transaction_type === 'buy') {
                // Yeni ağırlıklı ortalama maliyet hesabı
                const totalCostBefore = avgCost * currentQty
                const newCost = price * qty
                currentQty += qty
                avgCost = currentQty > 0 ? (totalCostBefore + newCost) / currentQty : 0
                totalBought += qty
            } else {
                // Satışta gerçekleşen K/Z
                const saleRevenue = price * qty
                const costOfSold = avgCost * qty
                realizedPnL += saleRevenue - costOfSold
                currentQty -= qty
                totalSold += qty
            }
        }

        const assetTypeId = transactions[0]?.asset_type_id ?? ''

        return {
            assetTypeId,
            realizedPnL,
            totalBought,
            totalSold,
            currentQuantity: currentQty,
            averageCostPerUnit: avgCost,
            totalCostBasis: avgCost * currentQty,
        }
    }

    /**
     * Kullanıcının tüm varlıklarındaki gerçekleşmiş P/L toplamını döner.
     */
    async getTotalRealizedPnL(): Promise<number> {
        const { data: transactions, error } = await this.supabase
            .from('transactions')
            .select('*')
            .order('transaction_date', { ascending: true })

        if (error) throw new Error(error.message)
        if (!transactions || transactions.length === 0) return 0

        // Varlık bazında grupla
        const grouped: Record<string, Transaction[]> = {}
        for (const tx of transactions as Transaction[]) {
            if (!grouped[tx.asset_type_id]) grouped[tx.asset_type_id] = []
            grouped[tx.asset_type_id].push(tx)
        }

        let total = 0
        for (const assetTxs of Object.values(grouped)) {
            const result = this.calculateFromTransactions(assetTxs)
            total += result.realizedPnL
        }

        return total
    }

    /**
     * Belirli bir varlık için PnL hesabı — Supabase'den çeker
     */
    async getPnLForAsset(assetTypeId: string): Promise<PnLResult> {
        const { data, error } = await this.supabase
            .from('transactions')
            .select('*')
            .eq('asset_type_id', assetTypeId)
            .order('transaction_date', { ascending: true })

        if (error) throw new Error(error.message)
        if (!data || data.length === 0) {
            return {
                assetTypeId,
                realizedPnL: 0,
                totalBought: 0,
                totalSold: 0,
                currentQuantity: 0,
                averageCostPerUnit: 0,
                totalCostBasis: 0,
            }
        }

        return this.calculateFromTransactions(data as Transaction[])
    }
}

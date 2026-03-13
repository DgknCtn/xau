import { SupabaseClient } from '@supabase/supabase-js'
import { Transaction, TransactionFormData, ReportFilter } from '@/lib/types'

export class TransactionService {
    constructor(private supabase: SupabaseClient) { }

    async getTransactions(filters?: ReportFilter): Promise<Transaction[]> {
        let query = this.supabase
            .from('transactions')
            .select('*, asset_types(id, code, name, category, unit_type)')
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false })

        if (filters?.start_date) {
            query = query.gte('transaction_date', filters.start_date)
        }
        if (filters?.end_date) {
            query = query.lte('transaction_date', filters.end_date)
        }
        if (filters?.asset_type_id) {
            query = query.eq('asset_type_id', filters.asset_type_id)
        }
        if (filters?.transaction_type) {
            query = query.eq('transaction_type', filters.transaction_type)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)
        return data as Transaction[]
    }

    async getTransactionById(id: string): Promise<Transaction | null> {
        const { data, error } = await this.supabase
            .from('transactions')
            .select('*, asset_types(id, code, name, category, unit_type)')
            .eq('id', id)
            .single()

        if (error) return null
        return data as Transaction
    }

    async validateSellQuantity(
        assetTypeId: string,
        sellQuantity: number,
        excludeTransactionId?: string
    ): Promise<{ isValid: boolean; availableQuantity: number; message: string }> {
        let query = this.supabase
            .from('transactions')
            .select('transaction_type, quantity')
            .eq('asset_type_id', assetTypeId)

        if (excludeTransactionId) {
            query = query.neq('id', excludeTransactionId)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)

        const available = (data || []).reduce((sum, t) => {
            return t.transaction_type === 'buy' ? sum + Number(t.quantity) : sum - Number(t.quantity)
        }, 0)

        if (sellQuantity > available) {
            return {
                isValid: false,
                availableQuantity: available,
                message: `Yetersiz bakiye. Mevcut: ${available.toFixed(6)}`,
            }
        }

        return { isValid: true, availableQuantity: available, message: 'OK' }
    }

    async createTransaction(data: TransactionFormData): Promise<Transaction> {
        const { data: user } = await this.supabase.auth.getUser()
        if (!user.user) throw new Error('Kullanıcı oturumu bulunamadı')

        if (data.transaction_type === 'sell') {
            const validation = await this.validateSellQuantity(data.asset_type_id, data.quantity)
            if (!validation.isValid) throw new Error(validation.message)
        }

        const { data: tx, error } = await this.supabase
            .from('transactions')
            .insert({
                owner_id: user.user.id,
                asset_type_id: data.asset_type_id,
                transaction_type: data.transaction_type,
                quantity: data.quantity,
                unit_price: data.unit_price,
                transaction_date: data.transaction_date,
                note: data.note || null,
            })
            .select('*, asset_types(id, code, name, category, unit_type)')
            .single()

        if (error) throw new Error(error.message)
        return tx as Transaction
    }

    async updateTransaction(id: string, data: TransactionFormData): Promise<Transaction> {
        const existing = await this.getTransactionById(id)
        if (!existing) throw new Error('İşlem bulunamadı')

        if (data.transaction_type === 'sell') {
            const validation = await this.validateSellQuantity(
                data.asset_type_id,
                data.quantity,
                id
            )
            if (!validation.isValid) throw new Error(validation.message)
        }

        const { data: tx, error } = await this.supabase
            .from('transactions')
            .update({
                asset_type_id: data.asset_type_id,
                transaction_type: data.transaction_type,
                quantity: data.quantity,
                unit_price: data.unit_price,
                transaction_date: data.transaction_date,
                note: data.note || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select('*, asset_types(id, code, name, category, unit_type)')
            .single()

        if (error) throw new Error(error.message)
        return tx as Transaction
    }

    async deleteTransaction(id: string): Promise<void> {
        const { error } = await this.supabase.from('transactions').delete().eq('id', id)
        if (error) throw new Error(error.message)
    }
}

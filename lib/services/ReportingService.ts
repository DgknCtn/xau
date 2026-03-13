import { SupabaseClient } from '@supabase/supabase-js'
import { Transaction, ReportFilter } from '@/lib/types'
import { PnLService } from './PnLService'
import * as XLSX from 'xlsx'

import { formatCurrencyTRY, formatQuantity, formatDateOnly } from '@/lib/utils/format'

export interface ReportRow {
    Tarih: string
    Varlık: string
    'İşlem Tipi': string
    Miktar: string
    'Birim Fiyat (TL)': string
    'Toplam Tutar (TL)': string
    Not: string
}

export class ReportingService {
    private pnlService: PnLService

    constructor(private supabase: SupabaseClient) {
        this.pnlService = new PnLService(supabase)
    }

    async getTransactionReport(filters: ReportFilter): Promise<Transaction[]> {
        let query = this.supabase
            .from('transactions')
            .select('*, asset_types(id, code, name, category, unit_type)')
            .gte('transaction_date', filters.start_date)
            .lte('transaction_date', filters.end_date)
            .order('transaction_date', { ascending: false })

        if (filters.asset_type_id) {
            query = query.eq('asset_type_id', filters.asset_type_id)
        }
        if (filters.transaction_type) {
            query = query.eq('transaction_type', filters.transaction_type)
        }

        const { data, error } = await query
        if (error) throw new Error(error.message)
        return (data || []) as Transaction[]
    }

    formatForExport(transactions: Transaction[]): object[] {
        return transactions.map((tx) => ({
            Tarih: formatDateOnly(tx.transaction_date),
            Varlık: tx.asset_types?.name ?? '',
            'İşlem Tipi': tx.transaction_type === 'buy' ? 'Alış' : 'Satış',
            Miktar: formatQuantity(Number(tx.quantity), tx.asset_types?.unit_type || 'adet'),
            'Birim Fiyat': formatCurrencyTRY(Number(tx.unit_price)),
            'Toplam Tutar': formatCurrencyTRY(Number(tx.total_amount)),
            Not: tx.note ?? '',
        }))
    }

    exportToCSV(transactions: Transaction[], filename = 'portfoy-raporu.csv'): void {
        const rows = this.formatForExport(transactions)
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, 'Rapor')
        XLSX.writeFile(wb, filename, { bookType: 'csv' })
    }

    exportToExcel(transactions: Transaction[], filename = 'portfoy-raporu.xlsx'): void {
        const rows = this.formatForExport(transactions)
        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(rows)

        // Kolon genişlikleri
        ws['!cols'] = [
            { wch: 12 }, // Tarih
            { wch: 22 }, // Varlık
            { wch: 12 }, // İşlem Tipi
            { wch: 12 }, // Miktar
            { wch: 18 }, // Birim Fiyat
            { wch: 18 }, // Toplam Tutar
            { wch: 30 }, // Not
        ]

        XLSX.utils.book_append_sheet(wb, ws, 'Rapor')
        XLSX.writeFile(wb, filename)
    }

    getDateRange(period: '7d' | '30d' | '90d' | 'ytd'): { start: string; end: string } {
        const today = new Date()
        const end = today.toISOString().split('T')[0]
        let start: string

        if (period === '7d') {
            const d = new Date(today)
            d.setDate(d.getDate() - 7)
            start = d.toISOString().split('T')[0]
        } else if (period === '30d') {
            const d = new Date(today)
            d.setDate(d.getDate() - 30)
            start = d.toISOString().split('T')[0]
        } else if (period === '90d') {
            const d = new Date(today)
            d.setDate(d.getDate() - 90)
            start = d.toISOString().split('T')[0]
        } else {
            // ytd: yıl başından bu yana
            start = `${today.getFullYear()}-01-01`
        }

        return { start, end }
    }
}

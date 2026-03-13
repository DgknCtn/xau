'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReportingService } from '@/lib/services/ReportingService'
import { TransactionService } from '@/lib/services/TransactionService'
import { PricingService } from '@/lib/services/PricingService'
import { Transaction, AssetType, ReportFilter } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import { Download, Filter, FileSpreadsheet } from 'lucide-react'
import { format } from 'date-fns'

function formatTL(n: number) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)
}

const QUICK_PERIODS = [
    { label: 'Son 7 Gün', value: '7d' },
    { label: 'Son 30 Gün', value: '30d' },
    { label: 'Son 90 Gün', value: '90d' },
    { label: 'Yıl Başından', value: 'ytd' },
] as const

export default function ReportsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
    const [loading, setLoading] = useState(false)
    const [activePeriod, setActivePeriod] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d')
    const [filter, setFilter] = useState<ReportFilter>(() => {
        const d = new Date()
        const end = d.toISOString().split('T')[0]
        d.setDate(d.getDate() - 30)
        return { start_date: d.toISOString().split('T')[0], end_date: end }
    })
    const [assetFilter, setAssetFilter] = useState('')
    const [txTypeFilter, setTxTypeFilter] = useState<'' | 'buy' | 'sell'>('')

    const supabase = createClient()
    const reportingService = new ReportingService(supabase)
    const pricingService = new PricingService(supabase)

    useEffect(() => {
        pricingService.getAssetTypes().then(setAssetTypes)
    }, [])

    const loadReport = async () => {
        setLoading(true)
        try {
            const data = await reportingService.getTransactionReport({
                ...filter,
                asset_type_id: assetFilter || undefined,
                transaction_type: txTypeFilter || undefined,
            } as ReportFilter)
            setTransactions(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadReport() }, [filter, assetFilter, txTypeFilter])

    const handleQuickPeriod = (period: typeof activePeriod) => {
        const { start, end } = reportingService.getDateRange(period)
        setActivePeriod(period)
        setFilter({ ...filter, start_date: start, end_date: end })
    }

    const totalBuy = transactions
        .filter((t) => t.transaction_type === 'buy')
        .reduce((s, t) => s + Number(t.total_amount), 0)
    const totalSell = transactions
        .filter((t) => t.transaction_type === 'sell')
        .reduce((s, t) => s + Number(t.total_amount), 0)

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">Raporlar</h1>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => reportingService.exportToCSV(transactions)}
                            disabled={transactions.length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm rounded-xl transition-all disabled:opacity-40"
                        >
                            <Download className="w-4 h-4" />
                            CSV
                        </button>
                        <button
                            onClick={() => reportingService.exportToExcel(transactions)}
                            disabled={transactions.length === 0}
                            className="flex items-center gap-2 px-3 py-2 bg-emerald-800/50 hover:bg-emerald-700/50 border border-emerald-700 text-emerald-300 text-sm rounded-xl transition-all disabled:opacity-40"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            Excel
                        </button>
                    </div>
                </div>

                {/* Filtreler */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 mb-5 space-y-4">
                    {/* Hızlı dönem seçimi */}
                    <div className="flex flex-wrap gap-2">
                        {QUICK_PERIODS.map(({ label, value }) => (
                            <button
                                key={value}
                                onClick={() => handleQuickPeriod(value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activePeriod === value
                                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Tarih aralığı */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Başlangıç</label>
                            <input
                                type="date"
                                value={filter.start_date}
                                onChange={(e) => { setActivePeriod('30d'); setFilter((f) => ({ ...f, start_date: e.target.value })) }}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Bitiş</label>
                            <input
                                type="date"
                                value={filter.end_date}
                                onChange={(e) => { setActivePeriod('30d'); setFilter((f) => ({ ...f, end_date: e.target.value })) }}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500/50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Varlık</label>
                            <select
                                value={assetFilter}
                                onChange={(e) => setAssetFilter(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500/50 transition-all"
                            >
                                <option value="">Tümü</option>
                                {assetTypes.map((a) => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">İşlem Tipi</label>
                            <select
                                value={txTypeFilter}
                                onChange={(e) => setTxTypeFilter(e.target.value as '' | 'buy' | 'sell')}
                                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-yellow-500/50 transition-all"
                            >
                                <option value="">Tümü</option>
                                <option value="buy">Alış</option>
                                <option value="sell">Satış</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Özet satırı */}
                <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Toplam Alış</p>
                        <p className="text-lg font-bold text-white">{formatTL(totalBuy)}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">Toplam Satış</p>
                        <p className="text-lg font-bold text-white">{formatTL(totalSell)}</p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-500 mb-1">İşlem Sayısı</p>
                        <p className="text-lg font-bold text-white">{transactions.length}</p>
                    </div>
                </div>

                {/* Tablo */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Yükleniyor...</div>
                    ) : transactions.length === 0 ? (
                        <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Bu tarih aralığında işlem bulunamadı</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        {['Tarih', 'Varlık', 'Tür', 'Miktar', 'Birim Fiyat', 'Toplam Tutar', 'Not'].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                                                {format(new Date(tx.transaction_date), 'dd.MM.yyyy')}
                                            </td>
                                            <td className="px-4 py-3 text-white">{tx.asset_types?.name ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tx.transaction_type === 'buy'
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {tx.transaction_type === 'buy' ? 'Alış' : 'Satış'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">{Number(tx.quantity).toFixed(4)}</td>
                                            <td className="px-4 py-3 text-gray-300">{formatTL(Number(tx.unit_price))}</td>
                                            <td className="px-4 py-3 text-white font-medium">{formatTL(Number(tx.total_amount))}</td>
                                            <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.note ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    )
}

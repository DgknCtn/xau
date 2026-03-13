'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TransactionService } from '@/lib/services/TransactionService'
import { PricingService } from '@/lib/services/PricingService'
import { Transaction, AssetType } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import Link from 'next/link'
import { Plus, Trash2, Edit2, Filter, Inbox } from 'lucide-react'
import { formatCurrencyTRY, formatQuantity, formatDateOnly } from '@/lib/utils/format'
import { useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all')
    const [filterAsset, setFilterAsset] = useState<string>('all')
    const [filterDate, setFilterDate] = useState<string>('all')
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const { showToast } = useToast()
    const supabase = createClient()
    const txService = new TransactionService(supabase)

    const load = async () => {
        setLoading(true)
        try {
            const pricingService = new PricingService(supabase)
            const [txData, assetData] = await Promise.all([
                txService.getTransactions(),
                pricingService.getAssetTypes()
            ])
            setTransactions(txData)
            setAssetTypes(assetData)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const filteredTransactions = transactions.filter(t => {
        if (filterType !== 'all' && t.transaction_type !== filterType) return false
        if (filterAsset !== 'all' && t.asset_type_id !== filterAsset) return false
        
        if (filterDate !== 'all') {
            const txDate = new Date(t.transaction_date)
            const now = new Date()
            if (filterDate === 'last_30_days') {
                if ((now.getTime() - txDate.getTime()) > 30 * 24 * 60 * 60 * 1000) return false
            } else if (filterDate === 'this_month') {
                if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false
            } else if (filterDate === 'this_year') {
                if (txDate.getFullYear() !== now.getFullYear()) return false
            }
        }
        
        return true
    })

    const handleDelete = async (id: string) => {
        try {
            await txService.deleteTransaction(id)
            setTransactions((prev) => prev.filter((t) => t.id !== id))
            showToast('İşlem başarıyla silindi', 'success')
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'Silinemedi', 'error')
        }
    }

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl">
                {/* Başlık */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">İşlem Geçmişi</h1>
                    <Link
                        href="/transactions/new"
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-semibold text-sm rounded-xl transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni İşlem
                    </Link>
                </div>

                {/* Filtreler */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 bg-gray-900 border border-gray-800 rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-400 font-medium mr-2">Tip:</span>
                        {(['all', 'buy', 'sell'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilterType(f)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === f
                                        ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
                                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                    }`}
                            >
                                {f === 'all' ? 'Tümü' : f === 'buy' ? 'Alış' : 'Satış'}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-6 bg-gray-800 hidden sm:block"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">Varlık:</span>
                        <select 
                            value={filterAsset} 
                            onChange={(e) => setFilterAsset(e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-yellow-500/50"
                        >
                            <option value="all">Tümü</option>
                            {assetTypes.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-px h-6 bg-gray-800 hidden sm:block"></div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400 font-medium">Tarih:</span>
                        <select 
                            value={filterDate} 
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-yellow-500/50"
                        >
                            <option value="all">Tüm Zamanlar</option>
                            <option value="last_30_days">Son 30 Gün</option>
                            <option value="this_month">Bu Ay</option>
                            <option value="this_year">Bu Yıl</option>
                        </select>
                    </div>
                </div>

                {/* Tablo */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Yükleniyor...</div>
                    ) : filteredTransactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                <Inbox className="w-6 h-6 text-gray-500" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">İşlem Bulunamadı</h3>
                            <p className="text-gray-400 text-sm mb-6 max-w-sm">
                                Bu filtreleme kriterlerine uyan herhangi bir alış veya satış işlemi kaydı bulunmuyor.
                            </p>
                            <Link 
                                href="/transactions/new" 
                                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 font-semibold text-sm rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all shadow-lg shadow-yellow-500/20"
                            >
                                Yeni İşlem Ekle
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-800/50">
                                    <tr>
                                        {['Tarih', 'Varlık', 'Tür', 'Miktar', 'Birim Fiyat', 'Toplam', 'Not', ''].map((h) => (
                                            <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {filteredTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                                                {formatDateOnly(tx.transaction_date)}
                                            </td>
                                            <td className="px-4 py-3 text-white font-medium">
                                                {tx.asset_types?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${tx.transaction_type === 'buy'
                                                        ? 'bg-emerald-500/10 text-emerald-400'
                                                        : 'bg-red-500/10 text-red-400'
                                                    }`}>
                                                    {tx.transaction_type === 'buy' ? 'Alış' : 'Satış'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-gray-300">{formatQuantity(Number(tx.quantity), tx.asset_types?.unit_type || 'adet')}</td>
                                            <td className="px-4 py-3 text-gray-300">{formatCurrencyTRY(Number(tx.unit_price))}</td>
                                            <td className="px-4 py-3 text-white font-medium">{formatCurrencyTRY(Number(tx.total_amount))}</td>
                                            <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{tx.note ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Link
                                                        href={`/transactions/${tx.id}/edit`}
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <button
                                                        onClick={() => setDeleteId(tx.id)}
                                                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!deleteId}
                title="İşlemi Sil"
                message="Bu işlemi silmek istediğinize emin misiniz? Bu işlem portföyünüzün yeniden hesaplanmasına neden olur."
                confirmText="Evet, Sil"
                onCancel={() => setDeleteId(null)}
                onConfirm={() => {
                    if (deleteId) handleDelete(deleteId)
                }}
            />
        </DashboardLayout>
    )
}

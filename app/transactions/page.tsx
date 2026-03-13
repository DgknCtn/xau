'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TransactionService } from '@/lib/services/TransactionService'
import { Transaction } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import Link from 'next/link'
import { Plus, Trash2, Edit2, Filter } from 'lucide-react'
import { format } from 'date-fns'

function formatTL(n: number) {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all')
    const supabase = createClient()
    const txService = new TransactionService(supabase)

    const load = async () => {
        setLoading(true)
        try {
            const data = await txService.getTransactions(
                filterType !== 'all' ? { transaction_type: filterType } as never : undefined
            )
            setTransactions(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [filterType])

    const handleDelete = async (id: string) => {
        if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return
        try {
            await txService.deleteTransaction(id)
            setTransactions((prev) => prev.filter((t) => t.id !== id))
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : 'Silinemedi')
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
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-4 h-4 text-gray-500" />
                    {(['all', 'buy', 'sell'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilterType(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filterType === f
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                                }`}
                        >
                            {f === 'all' ? 'Tümü' : f === 'buy' ? 'Alış' : 'Satış'}
                        </button>
                    ))}
                </div>

                {/* Tablo */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Yükleniyor...</div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <p className="text-gray-400 mb-2">İşlem bulunamadı</p>
                            <Link href="/transactions/new" className="text-yellow-400 text-sm hover:underline">
                                İşlem ekle →
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
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                                                {format(new Date(tx.transaction_date), 'dd.MM.yyyy')}
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
                                            <td className="px-4 py-3 text-gray-300">{Number(tx.quantity).toFixed(4)}</td>
                                            <td className="px-4 py-3 text-gray-300">{formatTL(Number(tx.unit_price))}</td>
                                            <td className="px-4 py-3 text-white font-medium">{formatTL(Number(tx.total_amount))}</td>
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
                                                        onClick={() => handleDelete(tx.id)}
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
        </DashboardLayout>
    )
}

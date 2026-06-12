'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TransactionService } from '@/lib/services/TransactionService'
import { PricingService } from '@/lib/services/PricingService'
import { Transaction, AssetType } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import Link from 'next/link'
import { Plus, Trash2, Edit2, SlidersHorizontal, Inbox, ArrowLeftRight } from 'lucide-react'
import { formatCurrencyTRY, formatQuantity, formatDateOnly } from '@/lib/utils/format'
import { useToast } from '@/components/ui/Toast'
import { ConfirmModal } from '@/components/ui/ConfirmModal'

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [assetTypes, setAssetTypes]     = useState<AssetType[]>([])
    const [loading, setLoading]           = useState(true)
    const [filterType, setFilterType]     = useState<'all'|'buy'|'sell'>('all')
    const [filterAsset, setFilterAsset]   = useState('all')
    const [filterDate, setFilterDate]     = useState('all')
    const [deleteId, setDeleteId]         = useState<string|null>(null)
    const { showToast } = useToast()
    const supabase  = createClient()
    const txService = new TransactionService(supabase)

    const load = async () => {
        setLoading(true)
        try {
            const ps = new PricingService(supabase)
            const [tx, assets] = await Promise.all([txService.getTransactions(), ps.getAssetTypes()])
            setTransactions(tx); setAssetTypes(assets)
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const filtered = transactions.filter(t => {
        if (filterType !== 'all' && t.transaction_type !== filterType) return false
        if (filterAsset !== 'all' && t.asset_type_id !== filterAsset) return false
        if (filterDate !== 'all') {
            const d = new Date(t.transaction_date), now = new Date()
            if (filterDate === 'last_30_days' && now.getTime() - d.getTime() > 30*864e5) return false
            if (filterDate === 'this_month'   && (d.getMonth()!==now.getMonth()||d.getFullYear()!==now.getFullYear())) return false
            if (filterDate === 'this_year'    && d.getFullYear()!==now.getFullYear()) return false
        }
        return true
    })

    const handleDelete = async (id: string) => {
        try {
            await txService.deleteTransaction(id)
            setTransactions(p => p.filter(t => t.id !== id))
            showToast('İşlem silindi', 'success')
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'Silinemedi', 'error')
        } finally { setDeleteId(null) }
    }

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl fade-in">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="icon-chip" style={{ background:'linear-gradient(135deg,#818CF8,#4F46E5)', boxShadow:'0 4px 14px rgba(129,140,248,0.3)' }}>
                            <ArrowLeftRight className="w-4 h-4 text-white" style={{width:18,height:18}} />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color:'var(--t1)' }}>İşlem Geçmişi</h1>
                            <p className="text-xs mt-0.5" style={{ color:'var(--t3)' }}>
                                {loading ? '...' : `${filtered.length} işlem`}
                            </p>
                        </div>
                    </div>
                    <Link href="/transactions/new" className="btn btn-gold text-xs py-2 px-3">
                        <Plus className="w-3.5 h-3.5" /> Yeni İşlem
                    </Link>
                </div>

                {/* Filters */}
                <div className="card p-4 mb-5">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <SlidersHorizontal className="w-3.5 h-3.5" style={{ color:'var(--t3)' }} />
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--t3)' }}>Filtre</span>
                        </div>
                        <div className="w-px h-4 hidden sm:block" style={{ background:'var(--border-2)' }} />

                        {/* Type filter */}
                        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background:'var(--bg-3)' }}>
                            {(['all','buy','sell'] as const).map(f => (
                                <button key={f} onClick={() => setFilterType(f)}
                                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                        style={filterType===f
                                            ? f==='buy'   ? { background:'var(--green-dim)', color:'#34D399', border:'1px solid rgba(16,185,129,0.3)' }
                                            : f==='sell'  ? { background:'var(--red-dim)',   color:'var(--red)', border:'1px solid rgba(248,113,113,0.3)' }
                                            :               { background:'var(--gold-dim)',   color:'var(--gold-2)', border:'1px solid rgba(245,158,11,0.3)' }
                                            : { color:'var(--t4)', border:'1px solid transparent' }}>
                                    {f==='all'?'Tümü':f==='buy'?'Alış':'Satış'}
                                </button>
                            ))}
                        </div>

                        <div className="w-px h-4 hidden sm:block" style={{ background:'var(--border-2)' }} />
                        <select value={filterAsset} onChange={e=>setFilterAsset(e.target.value)}
                                className="inp text-xs py-2" style={{ maxWidth:160 }}>
                            <option value="all">Tüm Varlıklar</option>
                            {assetTypes.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        <select value={filterDate} onChange={e=>setFilterDate(e.target.value)}
                                className="inp text-xs py-2" style={{ maxWidth:160 }}>
                            <option value="all">Tüm Zamanlar</option>
                            <option value="last_30_days">Son 30 Gün</option>
                            <option value="this_month">Bu Ay</option>
                            <option value="this_year">Bu Yıl</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
                    ) : filtered.length===0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="icon-chip w-14 h-14 mb-4" style={{ background:'var(--bg-3)', width:56, height:56, borderRadius:16 }}>
                                <Inbox className="w-6 h-6" style={{ color:'var(--t4)' }} />
                            </div>
                            <p className="font-semibold text-sm mb-1" style={{ color:'var(--t1)' }}>İşlem bulunamadı</p>
                            <p className="text-xs mb-5" style={{ color:'var(--t3)' }}>Bu filtrelerle eşleşen işlem yok</p>
                            <Link href="/transactions/new" className="btn btn-gold text-xs py-2 px-4">
                                <Plus className="w-3.5 h-3.5" /> Yeni İşlem
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="tbl">
                                <thead>
                                    <tr>{['Tarih','Varlık','Tür','Miktar','Birim Fiyat','Toplam','Not',''].map(h=>(
                                        <th key={h}>{h}</th>
                                    ))}</tr>
                                </thead>
                                <tbody>
                                    {filtered.map(tx=>(
                                        <tr key={tx.id}>
                                            <td className="tabular-nums" style={{ color:'var(--t2)' }}>{formatDateOnly(tx.transaction_date)}</td>
                                            <td className="font-semibold" style={{ color:'var(--t1)' }}>{tx.asset_types?.name??'—'}</td>
                                            <td>
                                                <span className={`badge ${tx.transaction_type==='buy'?'badge-green':'badge-red'}`}>
                                                    {tx.transaction_type==='buy'?'↑ Alış':'↓ Satış'}
                                                </span>
                                            </td>
                                            <td style={{ color:'var(--t2)' }}>{formatQuantity(Number(tx.quantity),tx.asset_types?.unit_type||'adet')}</td>
                                            <td style={{ color:'var(--t2)' }}>{formatCurrencyTRY(Number(tx.unit_price))}</td>
                                            <td className="font-bold" style={{ color:'var(--t1)' }}>{formatCurrencyTRY(Number(tx.total_amount))}</td>
                                            <td className="max-w-xs truncate" style={{ color:'var(--t4)' }}>{tx.note??'—'}</td>
                                            <td>
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/transactions/${tx.id}/edit`}
                                                          className="p-1.5 rounded-lg transition-all"
                                                          style={{ color:'var(--t4)' }}
                                                          onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.color='var(--gold-2)';el.style.background='var(--gold-dim)';}}
                                                          onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.color='var(--t4)';el.style.background='';}}>
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </Link>
                                                    <button onClick={()=>setDeleteId(tx.id)}
                                                            className="p-1.5 rounded-lg transition-all"
                                                            style={{ color:'var(--t4)' }}
                                                            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.color='var(--red)';el.style.background='var(--red-dim)';}}
                                                            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.color='var(--t4)';el.style.background='';}}>
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

            <ConfirmModal isOpen={!!deleteId} title="İşlemi Sil"
                message="Bu işlemi silmek istediğinize emin misiniz? Portföyünüz yeniden hesaplanacak."
                confirmText="Evet, Sil"
                onCancel={()=>setDeleteId(null)}
                onConfirm={()=>{ if(deleteId) handleDelete(deleteId) }} />
        </DashboardLayout>
    )
}

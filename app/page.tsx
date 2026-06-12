'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PortfolioService } from '@/lib/services/PortfolioService'
import { DashboardSummary } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import {
    TrendingUp, TrendingDown, AlertCircle, RefreshCw,
    Plus, DollarSign, ArrowUp, ArrowDown, Info,
    Wallet, Activity, BarChart3, Coins
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatCurrencyTRY, formatPercent, formatQuantity } from '@/lib/utils/format'

export default function DashboardPage() {
    const [summary, setSummary]   = useState<DashboardSummary | null>(null)
    const [loading, setLoading]   = useState(true)
    const [error, setError]       = useState<string | null>(null)
    const [sort, setSort]         = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const supabase = createClient()
    const svc = new PortfolioService(supabase)

    const load = async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        try {
            setSummary(await svc.getDashboardSummary())
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : 'Veri yüklenirken hata oluştu')
        } finally {
            setLoading(false); setRefreshing(false)
        }
    }

    useEffect(() => { load() }, [])

    const isStale = summary?.last_price_update
        ? Date.now() - new Date(summary.last_price_update).getTime() > 86_400_000
        : false

    const sorted = summary?.positions ? [...summary.positions].sort((a, b) => {
        if (!sort) return 0
        let av: number = sort.key === 'pnlPct'
            ? (a.total_cost_basis ? (Number(a.unrealized_pnl) || 0) / a.total_cost_basis : 0)
            : Number(a[sort.key as keyof typeof a]) || 0
        let bv: number = sort.key === 'pnlPct'
            ? (b.total_cost_basis ? (Number(b.unrealized_pnl) || 0) / b.total_cost_basis : 0)
            : Number(b[sort.key as keyof typeof b]) || 0
        return sort.dir === 'asc' ? av - bv : bv - av
    }) : []

    const handleSort = (key: string) =>
        setSort(p => p?.key === key && p.dir === 'asc' ? { key, dir: 'desc' } : { key, dir: 'asc' })

    const clr = (v: number | null | undefined) =>
        !v || v === 0 ? 'var(--t3)' : v > 0 ? 'var(--green)' : 'var(--red)'

    const totalPnlPct = summary?.total_cost && summary.total_cost > 0
        ? ((summary.total_unrealized_pnl ?? 0) / summary.total_cost) * 100 : 0

    const statCards = [
        {
            label: 'Toplam Değer',
            value: formatCurrencyTRY(summary?.total_current_value),
            icon: Wallet,
            iconBg: 'linear-gradient(135deg,#F59E0B,#92400E)',
            iconColor: '#fff',
            glow: 'rgba(245,158,11,0.15)',
            sub: null,
        },
        {
            label: 'Toplam Maliyet',
            value: formatCurrencyTRY(summary?.total_cost),
            icon: BarChart3,
            iconBg: 'linear-gradient(135deg,#818CF8,#4F46E5)',
            iconColor: '#fff',
            glow: 'rgba(129,140,248,0.12)',
            sub: null,
        },
        {
            label: 'Açık Poz. K/Z',
            value: formatCurrencyTRY(summary?.total_unrealized_pnl),
            icon: (summary?.total_unrealized_pnl ?? 0) >= 0 ? TrendingUp : TrendingDown,
            iconBg: (summary?.total_unrealized_pnl ?? 0) >= 0
                ? 'linear-gradient(135deg,#10B981,#065F46)'
                : 'linear-gradient(135deg,#F87171,#991B1B)',
            iconColor: '#fff',
            glow: (summary?.total_unrealized_pnl ?? 0) >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(248,113,113,0.12)',
            sub: totalPnlPct !== 0
                ? { v: totalPnlPct, label: `${totalPnlPct > 0 ? '+' : ''}${formatPercent(totalPnlPct)}` }
                : null,
            valueColor: clr(summary?.total_unrealized_pnl ?? 0),
        },
        {
            label: 'Kapatılan K/Z',
            value: formatCurrencyTRY(summary?.total_realized_pnl),
            icon: Activity,
            iconBg: 'linear-gradient(135deg,#64748B,#334155)',
            iconColor: '#fff',
            glow: 'rgba(100,116,139,0.1)',
            sub: null,
            valueColor: clr(summary?.total_realized_pnl ?? 0),
        },
    ]

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl fade-in">

                {/* ── Header ──────────────────────────── */}
                <div className="flex items-start justify-between mb-7">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--t1)' }}>Portföy Özeti</h1>
                        {summary?.last_price_update && (
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="inline-block w-2 h-2 rounded-full"
                                      style={{ background: isStale ? 'var(--gold)' : 'var(--green)', boxShadow: `0 0 6px ${isStale ? 'var(--gold-glow)' : 'var(--green-glow)'}` }} />
                                <p className="text-xs" style={{ color: 'var(--t3)' }}>
                                    Güncellendi {formatDistanceToNow(new Date(summary.last_price_update), { addSuffix: true, locale: tr })}
                                </p>
                                {isStale && (
                                    <span className="badge badge-gold text-[10px]">
                                        <AlertCircle className="w-3 h-3" /> Eski fiyat
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => load(true)} disabled={refreshing}
                                className="btn btn-ghost py-2 px-3 text-xs">
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'spin' : ''}`} />
                        </button>
                        <Link href="/prices" className="btn btn-ghost py-2 px-3 text-xs">
                            <DollarSign className="w-3.5 h-3.5" />
                            Fiyat Güncelle
                        </Link>
                        <Link href="/transactions/new" className="btn btn-gold py-2 px-3 text-xs">
                            <Plus className="w-3.5 h-3.5" />
                            İşlem Ekle
                        </Link>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-3 p-4 rounded-xl text-sm"
                         style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)' }}>
                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                    </div>
                )}

                {loading ? (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[...Array(4)].map((_,i) => <div key={i} className="skeleton h-28" />)}
                        </div>
                        <div className="skeleton h-72" />
                    </div>
                ) : (
                    <>
                        {/* ── Stat Cards ─────────────────── */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 stagger">
                            {statCards.map((c, i) => (
                                <div key={i} className="stat-card fade-up"
                                     style={{ boxShadow: `0 4px 24px ${c.glow}` }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--t3)' }}>{c.label}</p>
                                        <div className="icon-chip" style={{ background: c.iconBg, boxShadow: `0 4px 12px ${c.glow}` }}>
                                            <c.icon className="w-4.5 h-4.5 text-white" style={{ width:18, height:18 }} />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold tracking-tight leading-none"
                                       style={{ color: (c as { valueColor?: string }).valueColor ?? 'var(--t1)' }}>
                                        {c.value}
                                    </p>
                                    {c.sub && (
                                        <p className="text-xs mt-1.5 font-semibold"
                                           style={{ color: clr(c.sub.v) }}>
                                            {c.sub.label}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* ── Table ──────────────────────── */}
                        <div className="card overflow-hidden fade-up">
                            <div className="px-5 py-4 flex items-center justify-between"
                                 style={{ borderBottom: '1px solid var(--border)' }}>
                                <div className="flex items-center gap-3">
                                    <div className="icon-chip w-8 h-8" style={{ background: 'var(--gold-dim)', width:32, height:32 }}>
                                        <Coins className="w-4 h-4" style={{ color: 'var(--gold-2)' }} />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-bold" style={{ color: 'var(--t1)' }}>Açık Pozisyonlar</h2>
                                        {sorted.length > 0 && (
                                            <p className="text-xs" style={{ color: 'var(--t3)' }}>{sorted.length} varlık</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {sorted.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="icon-chip w-14 h-14 mb-4"
                                         style={{ background: 'var(--bg-3)', width:56, height:56, borderRadius:16 }}>
                                        <TrendingUp className="w-6 h-6" style={{ color: 'var(--t4)' }} />
                                    </div>
                                    <p className="font-semibold text-sm mb-1" style={{ color: 'var(--t1)' }}>Henüz pozisyon yok</p>
                                    <p className="text-xs mb-5" style={{ color: 'var(--t3)' }}>İlk işleminizi ekleyerek başlayın</p>
                                    <Link href="/transactions/new" className="btn btn-gold text-xs py-2 px-4">
                                        <Plus className="w-3.5 h-3.5" /> İlk İşlemi Ekle
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="tbl">
                                        <thead>
                                            <tr>
                                                {[
                                                    { k:'asset_name',           l:'Varlık' },
                                                    { k:'current_quantity',     l:'Miktar' },
                                                    { k:'average_buy_price',    l:'Ort. Maliyet', tip:'Ağırlıklı ortalama alış fiyatı' },
                                                    { k:'total_cost_basis',     l:'Toplam Maliyet' },
                                                    { k:'current_price',        l:'Güncel Fiyat' },
                                                    { k:'current_market_value', l:'Piyasa Değeri' },
                                                    { k:'unrealized_pnl',       l:'K/Z', tip:'Anlık kar/zarar' },
                                                    { k:'pnlPct',               l:'K/Z %' },
                                                ].map(({ k, l, tip }) => (
                                                    <th key={k} onClick={() => handleSort(k)}
                                                        className="cursor-pointer select-none group">
                                                        <div className="flex items-center gap-1">
                                                            {l}
                                                            {tip && <Info className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" title={tip} />}
                                                            <span className="opacity-0 group-hover:opacity-60 transition-opacity">
                                                                {sort?.key === k
                                                                    ? sort.dir === 'asc'
                                                                        ? <ArrowUp className="w-3 h-3 inline" />
                                                                        : <ArrowDown className="w-3 h-3 inline" />
                                                                    : <ArrowUp className="w-3 h-3 inline" />}
                                                            </span>
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sorted.map(p => {
                                                const pnl    = Number(p.unrealized_pnl) || 0
                                                const pnlPct = p.total_cost_basis ? (pnl / p.total_cost_basis) * 100 : 0
                                                return (
                                                    <tr key={p.asset_type_id}>
                                                        <td>
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black"
                                                                     style={{ background: p.category === 'gold' ? 'var(--gold-dim)' : 'var(--indigo-dim)', color: p.category === 'gold' ? 'var(--gold-2)' : 'var(--indigo)' }}>
                                                                    {p.asset_name.substring(0,2).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-sm" style={{ color: 'var(--t1)' }}>{p.asset_name}</p>
                                                                    <span className={`badge text-[10px] ${p.category === 'gold' ? 'badge-gold' : 'badge-indigo'}`}>
                                                                        {p.category === 'gold' ? 'Altın' : 'Döviz'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ color: 'var(--t2)' }}>{formatQuantity(p.current_quantity, p.unit_type)}</td>
                                                        <td style={{ color: 'var(--t2)' }}>{formatCurrencyTRY(p.average_buy_price)}</td>
                                                        <td style={{ color: 'var(--t2)' }}>{formatCurrencyTRY(p.total_cost_basis)}</td>
                                                        <td>{p.current_price
                                                            ? <span style={{ color: 'var(--t1)' }}>{formatCurrencyTRY(p.current_price)}</span>
                                                            : <span style={{ color: 'var(--t4)' }}>—</span>}
                                                        </td>
                                                        <td className="font-semibold" style={{ color: 'var(--t1)' }}>{formatCurrencyTRY(p.current_market_value)}</td>
                                                        <td className="font-bold tabular-nums" style={{ color: clr(pnl) }}>
                                                            {pnl > 0 ? '+' : ''}{formatCurrencyTRY(pnl)}
                                                        </td>
                                                        <td>
                                                            <span className={`badge text-xs font-bold ${pnlPct > 0 ? 'badge-green' : pnlPct < 0 ? 'badge-red' : 'badge-indigo'}`}>
                                                                {pnlPct > 0 ? '+' : ''}{formatPercent(pnlPct)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        {(summary?.total_cost || summary?.total_current_value) && (
                                            <tfoot>
                                                <tr>
                                                    <td style={{ color: 'var(--t1)' }}>Toplam</td>
                                                    <td /><td />
                                                    <td style={{ color: 'var(--t2)' }}>{formatCurrencyTRY(summary?.total_cost)}</td>
                                                    <td />
                                                    <td style={{ color: 'var(--t1)' }}>{formatCurrencyTRY(summary?.total_current_value)}</td>
                                                    <td style={{ color: clr(summary?.total_unrealized_pnl ?? 0) }}>
                                                        {(summary?.total_unrealized_pnl ?? 0) > 0 ? '+' : ''}{formatCurrencyTRY(summary?.total_unrealized_pnl)}
                                                    </td>
                                                    <td style={{ color: clr(totalPnlPct) }}>
                                                        {totalPnlPct > 0 ? '+' : ''}{formatPercent(totalPnlPct)}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        )}
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PortfolioService } from '@/lib/services/PortfolioService'
import { DashboardSummary } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Plus, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

function formatTL(amount: number | null | undefined): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(amount)
}

function formatQty(qty: number, unit: string): string {
  if (unit === 'gram') return `${Number(qty).toFixed(3)} gr`
  if (unit === 'adet') return `${Number(qty).toFixed(0)} adet`
  return `${Number(qty).toFixed(2)}`
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const portfolioService = new PortfolioService(supabase)

  const loadData = async () => {
    try {
      const data = await portfolioService.getDashboardSummary()
      setSummary(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const pnlColor = (v: number) =>
    v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-gray-400'

  const pnlBg = (v: number) =>
    v > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : v < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-800 border-gray-700'

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Portföy Özeti</h1>
            {summary?.last_price_update && (
              <p className="text-xs text-gray-500 mt-0.5">
                Son fiyat güncelleme:{' '}
                {formatDistanceToNow(new Date(summary.last_price_update), { addSuffix: true, locale: tr })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/prices"
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm rounded-xl transition-all"
            >
              <DollarSign className="w-4 h-4" />
              Fiyat Güncelle
            </Link>
            <Link
              href="/transactions/new"
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-semibold text-sm rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              İşlem Ekle
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Yükleniyor...
          </div>
        ) : (
          <>
            {/* Özet Kartlar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">Toplam Değer</p>
                <p className="text-2xl font-bold text-white">{formatTL(summary?.total_current_value)}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">Toplam Maliyet</p>
                <p className="text-2xl font-bold text-white">{formatTL(summary?.total_cost)}</p>
              </div>
              <div className={`border rounded-2xl p-5 ${pnlBg(summary?.total_unrealized_pnl ?? 0)}`}>
                <p className="text-xs text-gray-500 mb-1">Gerçekleşmemiş K/Z</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${pnlColor(summary?.total_unrealized_pnl ?? 0)}`}>
                  {(summary?.total_unrealized_pnl ?? 0) >= 0
                    ? <TrendingUp className="w-5 h-5" />
                    : <TrendingDown className="w-5 h-5" />}
                  {formatTL(summary?.total_unrealized_pnl)}
                </p>
              </div>
              <div className={`border rounded-2xl p-5 ${pnlBg(summary?.total_realized_pnl ?? 0)}`}>
                <p className="text-xs text-gray-500 mb-1">Gerçekleşmiş K/Z</p>
                <p className={`text-2xl font-bold ${pnlColor(summary?.total_realized_pnl ?? 0)}`}>
                  {formatTL(summary?.total_realized_pnl)}
                </p>
              </div>
            </div>

            {/* Varlık Tablosu */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-semibold text-white text-sm">Varlıklar</h2>
              </div>

              {(!summary?.positions || summary.positions.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <TrendingUp className="w-12 h-12 text-gray-700 mb-3" />
                  <p className="text-gray-400">Henüz işlem yok</p>
                  <p className="text-gray-600 text-sm mb-4">İlk işleminizi ekleyerek başlayın</p>
                  <Link
                    href="/transactions/new"
                    className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 font-semibold text-sm rounded-xl hover:from-yellow-400 hover:to-amber-500 transition-all"
                  >
                    İlk İşlemi Ekle
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800/50">
                      <tr>
                        {['Varlık', 'Miktar', 'Ort. Maliyet', 'Toplam Maliyet', 'Güncel Fiyat', 'Güncel Değer', 'K/Z', 'K/Z %'].map((h) => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {summary.positions.map((p) => {
                        const pnl = Number(p.unrealized_pnl) || 0
                        const pnlPct = p.total_cost_basis ? (pnl / p.total_cost_basis) * 100 : 0
                        return (
                          <tr key={p.asset_type_id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-white font-medium">{p.asset_name}</p>
                                <span className={`inline-block text-xs px-1.5 py-0.5 rounded mt-0.5 ${p.category === 'gold' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                  {p.category === 'gold' ? 'Altın' : 'Döviz'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-300">{formatQty(p.current_quantity, p.unit_type)}</td>
                            <td className="px-4 py-3 text-gray-300">{formatTL(p.average_buy_price)}</td>
                            <td className="px-4 py-3 text-gray-300">{formatTL(p.total_cost_basis)}</td>
                            <td className="px-4 py-3">
                              {p.current_price
                                ? <span className="text-white">{formatTL(p.current_price)}</span>
                                : <span className="text-gray-600 text-xs">Fiyat girilmemiş</span>}
                            </td>
                            <td className="px-4 py-3 text-white">{formatTL(p.current_market_value)}</td>
                            <td className={`px-4 py-3 font-medium ${pnlColor(pnl)}`}>{formatTL(pnl)}</td>
                            <td className={`px-4 py-3 font-medium ${pnlColor(pnlPct)}`}>
                              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
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

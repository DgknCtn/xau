'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PortfolioService } from '@/lib/services/PortfolioService'
import { DashboardSummary } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import { TrendingUp, TrendingDown, AlertCircle, RefreshCw, Plus, DollarSign, ArrowUp, ArrowDown, Info } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

import { formatCurrencyTRY, formatPercent, formatQuantity } from '@/lib/utils/format'

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

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

  const isStale = summary?.last_price_update 
    ? (new Date().getTime() - new Date(summary.last_price_update).getTime()) > 24 * 60 * 60 * 1000 
    : false

  const sortedPositions = summary?.positions ? [...summary.positions].sort((a, b) => {
    if (!sortConfig) return 0
    let aVal: any = a[sortConfig.key as keyof typeof a]
    let bVal: any = b[sortConfig.key as keyof typeof b]

    if (sortConfig.key === 'pnlPct') {
        aVal = a.total_cost_basis ? ((Number(a.unrealized_pnl) || 0) / a.total_cost_basis) : 0
        bVal = b.total_cost_basis ? ((Number(b.unrealized_pnl) || 0) / b.total_cost_basis) : 0
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  }) : []

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const pnlColor = (v: number | null | undefined) => {
    if (!v) return 'text-gray-400'
    return v > 0 ? 'text-emerald-400' : v < 0 ? 'text-red-400' : 'text-gray-400'
  }

  const pnlBg = (v: number | null | undefined) => {
    if (!v) return 'bg-gray-800 border-gray-700'
    return v > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : v < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-gray-800 border-gray-700'
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl">
        {/* Başlık */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Portföy Özeti</h1>
            {summary?.last_price_update && (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-gray-500">
                  Son fiyat güncelleme:{' '}
                  {formatDistanceToNow(new Date(summary.last_price_update), { addSuffix: true, locale: tr })}
                </p>
                {isStale && (
                  <span className="flex items-center gap-1 text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    <AlertCircle className="w-3 h-3" />
                    Fiyatlar güncel olmayabilir
                  </span>
                )}
              </div>
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
                <p className="text-2xl font-bold text-white">{formatCurrencyTRY(summary?.total_current_value)}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <p className="text-xs text-gray-500 mb-1">Toplam Maliyet</p>
                <p className="text-2xl font-bold text-white">{formatCurrencyTRY(summary?.total_cost)}</p>
              </div>
              <div className={`border rounded-2xl p-5 ${pnlBg(summary?.total_unrealized_pnl ?? 0)}`}>
                <p className="text-xs text-gray-500 mb-1">Açık Pozisyon K/Z</p>
                <p className={`text-2xl font-bold flex items-center gap-1 ${pnlColor(summary?.total_unrealized_pnl ?? 0)}`}>
                  {(summary?.total_unrealized_pnl ?? 0) > 0
                    ? <TrendingUp className="w-5 h-5" />
                    : (summary?.total_unrealized_pnl ?? 0) < 0 
                      ? <TrendingDown className="w-5 h-5" /> 
                      : null}
                  {formatCurrencyTRY(summary?.total_unrealized_pnl)}
                </p>
              </div>
              <div className={`border rounded-2xl p-5 ${pnlBg(summary?.total_realized_pnl ?? 0)}`}>
                <p className="text-xs text-gray-500 mb-1">Kapatılan Pozisyon K/Z</p>
                <p className={`text-2xl font-bold ${pnlColor(summary?.total_realized_pnl ?? 0)}`}>
                  {formatCurrencyTRY(summary?.total_realized_pnl)}
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
                        {[
                          { key: 'asset_name', label: 'Varlık' },
                          { key: 'current_quantity', label: 'Miktar' },
                          { key: 'average_buy_price', label: 'Ort. Maliyet', tooltip: 'Sahip olduğunuz tüm birimlerin ağırlıklı alış ortalaması' },
                          { key: 'total_cost_basis', label: 'Toplam Maliyet' },
                          { key: 'current_price', label: 'Güncel Fiyat' },
                          { key: 'current_market_value', label: 'Güncel Değer' },
                          { key: 'unrealized_pnl', label: 'Açık Poz. K/Z', tooltip: 'Satılmamış elde tutulan varlıkların anlık kar veya zararı' },
                          { key: 'pnlPct', label: 'Açık Poz. K/Z %' },
                        ].map(({ key, label, tooltip }) => (
                          <th 
                            key={key} 
                            className="px-4 py-3 text-left text-xs text-gray-500 font-medium cursor-pointer flex-row hover:text-white transition-colors group"
                            onClick={() => handleSort(key)}
                          >
                            <div className="flex items-center gap-1">
                              {label}
                              {tooltip && (
                                <div title={tooltip} className="cursor-help">
                                  <Info className="w-3.5 h-3.5 text-gray-500 hover:text-gray-300 transition-colors" />
                                </div>
                              )}
                              <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                               {sortConfig?.key === key ? (
                                  sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 opacity-100" /> : <ArrowDown className="w-3 h-3 opacity-100" />
                                ) : (
                                  <ArrowUp className="w-3 h-3 text-gray-600" />
                                )}
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {sortedPositions.map((p) => {
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
                            <td className="px-4 py-3 text-gray-300">{formatQuantity(p.current_quantity, p.unit_type)}</td>
                            <td className="px-4 py-3 text-gray-300">{formatCurrencyTRY(p.average_buy_price)}</td>
                            <td className="px-4 py-3 text-gray-300">{formatCurrencyTRY(p.total_cost_basis)}</td>
                            <td className="px-4 py-3">
                              {p.current_price
                                ? <span className="text-white">{formatCurrencyTRY(p.current_price)}</span>
                                : <span className="text-gray-600 text-xs">Fiyat girilmemiş</span>}
                            </td>
                            <td className="px-4 py-3 text-white">{formatCurrencyTRY(p.current_market_value)}</td>
                            <td className={`px-4 py-3 font-medium ${pnlColor(pnl)}`}>{formatCurrencyTRY(pnl)}</td>
                            <td className={`px-4 py-3 font-medium ${pnlColor(pnlPct)}`}>
                              {formatPercent(pnlPct)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    {(summary?.total_cost || summary?.total_current_value) ? (
                      <tfoot className="bg-gray-800/80 font-semibold border-t-2 border-gray-700">
                        <tr>
                          <td className="px-4 py-4 text-white">Toplam</td>
                          <td className="px-4 py-4"></td>
                          <td className="px-4 py-4"></td>
                          <td className="px-4 py-4 text-gray-300">{formatCurrencyTRY(summary?.total_cost)}</td>
                          <td className="px-4 py-4"></td>
                          <td className="px-4 py-4 text-white">{formatCurrencyTRY(summary?.total_current_value)}</td>
                          <td className={`px-4 py-4 ${pnlColor(summary?.total_unrealized_pnl ?? 0)}`}>
                            {formatCurrencyTRY(summary?.total_unrealized_pnl)}
                          </td>
                          <td className={`px-4 py-4 ${pnlColor(summary?.total_unrealized_pnl ?? 0)}`}>
                            {summary?.total_cost ? formatPercent(((summary.total_unrealized_pnl ?? 0) / summary.total_cost) * 100) : formatPercent(0)}
                          </td>
                        </tr>
                      </tfoot>
                    ) : null}
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

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PricingService } from '@/lib/services/PricingService'
import { AssetType } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { formatCurrencyTRY, formatDateTime } from '@/lib/utils/format'
import { useToast } from '@/components/ui/Toast'

interface PriceEntry {
    asset_type_id: string
    buy_price: string
    sell_price: string
}

export default function PricesPage() {
    const router = useRouter()
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
    const [prices, setPrices] = useState<Record<string, PriceEntry>>({})
    const [latestPrices, setLatestPrices] = useState<Record<string, { buy: number | null; sell: number | null; timestamp: string | null }>>({})
    const [loading, setLoading] = useState(false)
    const [syncing, setSyncing] = useState(false)
    const { showToast } = useToast()
    const supabase = createClient()
    const pricingService = new PricingService(supabase)

    const load = async () => {
        const [assets, latest] = await Promise.all([
            pricingService.getAssetTypes(),
            pricingService.getLatestPrices(),
        ])
        setAssetTypes(assets)

        // Mevcut fiyatları kaydet
        const latestMap: Record<string, { buy: number | null; sell: number | null; timestamp: string | null }> = {}
        for (const p of latest as Array<{ asset_type_id: string; latest_buy_price: number | null; latest_sell_price: number | null; price_timestamp: string | null }>) {
            latestMap[p.asset_type_id] = {
                buy: p.latest_buy_price,
                sell: p.latest_sell_price,
                timestamp: p.price_timestamp,
            }
        }
        setLatestPrices(latestMap)

        // Form başlangıç değerleri
        const initial: Record<string, PriceEntry> = {}
        for (const a of assets) {
            initial[a.id] = {
                asset_type_id: a.id,
                buy_price: latestMap[a.id]?.buy?.toString() ?? '',
                sell_price: latestMap[a.id]?.sell?.toString() ?? '',
            }
        }
        setPrices(initial)
    }

    useEffect(() => {
        load()
    }, [])

    const handleChange = (assetId: string, field: 'buy_price' | 'sell_price', value: string) => {
        setPrices((prev) => ({
            ...prev,
            [assetId]: { ...prev[assetId], asset_type_id: assetId, [field]: value },
        }))
    }

    const handleSync = async () => {
        setSyncing(true)
        try {
            const res = await fetch('/api/prices/sync', { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'API senkronizasyonu başarısız oldu')
            
            await load() // Tabloyu yenile
            showToast("Fiyatlar API'den güncellendi", 'success')
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'API çekme hatası oluştu', 'error')
        } finally {
            setSyncing(false)
        }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const entries = Object.values(prices)
                .filter((p) => p.buy_price || p.sell_price)
                .map((p) => ({
                    asset_type_id: p.asset_type_id,
                    buy_price: parseFloat(p.buy_price) || 0,
                    sell_price: parseFloat(p.sell_price) || 0,
                }))

            if (entries.length === 0) {
                showToast('En az bir varlık için fiyat girmeniz gerekiyor.', 'error')
                return
            }

            await pricingService.saveManualPrices(entries)
            showToast('Fiyatlar başarıyla kaydedildi!', 'success')
            setTimeout(() => router.push('/'), 1500)
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'Fiyatlar kaydedilemedi', 'error')
        } finally {
            setLoading(false)
        }
    }

    const hasUnsavedChanges = Object.keys(prices).some((id) => {
        const initBuy = latestPrices[id]?.buy?.toString() ?? ''
        const initSell = latestPrices[id]?.sell?.toString() ?? ''
        return prices[id].buy_price !== initBuy || prices[id].sell_price !== initSell
    })

    const goldAssets = assetTypes.filter((a) => a.category === 'gold')
    const fxAssets = assetTypes.filter((a) => a.category === 'fx')

    const inputCls =
        'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2.5 text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all text-right'

    const renderAssetGroup = (assets: AssetType[], title: string) => (
        <div className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-[1fr_140px_140px_140px] gap-0">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gray-800/50 text-xs text-gray-500 font-medium">Varlık</div>
                    <div className="px-3 py-3 bg-gray-800/50 text-xs text-gray-500 font-medium text-right">Son Alış</div>
                    <div className="px-3 py-3 bg-gray-800/50 text-xs text-gray-500 font-medium text-right">Yeni Alış (TL)</div>
                    <div className="px-3 py-3 bg-gray-800/50 text-xs text-gray-500 font-medium text-right">Yeni Satış (TL)</div>

                    {/* Rows */}
                    {assets.map((a) => {
                        const latest = latestPrices[a.id]
                        const entry = prices[a.id]
                        return (
                            <>
                                <div key={`name-${a.id}`} className="px-4 py-3 border-t border-gray-800 flex items-center">
                                    <div>
                                        <p className="text-white text-sm font-medium">{a.name}</p>
                                        {latest?.timestamp && (
                                            <p className="text-gray-600 text-xs mt-0.5">{formatDateTime(latest.timestamp)}</p>
                                        )}
                                    </div>
                                </div>
                                <div key={`last-${a.id}`} className="px-3 py-3 border-t border-gray-800 flex items-center justify-end">
                                    <span className="text-gray-400 text-sm">{formatCurrencyTRY(latest?.buy ?? null)}</span>
                                </div>
                                <div key={`buy-${a.id}`} className="px-3 py-3 border-t border-gray-800">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        value={entry?.buy_price ?? ''}
                                        onChange={(e) => handleChange(a.id, 'buy_price', e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                                <div key={`sell-${a.id}`} className="px-3 py-3 border-t border-gray-800">
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="0.00"
                                        value={entry?.sell_price ?? ''}
                                        onChange={(e) => handleChange(a.id, 'sell_price', e.target.value)}
                                        className={inputCls}
                                    />
                                </div>
                            </>
                        )
                    })}
                </div>
            </div>
        </div>
    )

    return (
        <DashboardLayout>
            <div className="p-6 max-w-4xl">
                {/* Başlık */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/"
                            className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Güncel Fiyatlar</h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Altın ve döviz alış/satış fiyatlarını manuel girin veya API'den çekin
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-sm font-medium rounded-xl transition-all disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-yellow-500' : ''}`} />
                        {syncing ? 'Çekiliyor...' : 'Otomatik Çek (API)'}
                    </button>
                </div>

                {/* Silinen hata ve başarı kutuları */}

                {renderAssetGroup(goldAssets, 'Altın')}
                {renderAssetGroup(fxAssets, 'Döviz')}

                {/* Kaydet */}
                <button
                    onClick={handleSave}
                    disabled={loading || !hasUnsavedChanges}
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Kaydediliyor...' : hasUnsavedChanges ? 'Kaydet (Değişiklikler var)' : 'Değişiklik Yok'}
                </button>
            </div>
        </DashboardLayout>
    )
}

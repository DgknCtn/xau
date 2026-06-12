'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PricingService } from '@/lib/services/PricingService'
import { AssetType } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, RefreshCw, Clock, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { formatCurrencyTRY, formatDateTime } from '@/lib/utils/format'
import { useToast } from '@/components/ui/Toast'

interface Entry { asset_type_id:string; buy_price:string; sell_price:string }

export default function PricesPage() {
    const router = useRouter()
    const [assetTypes, setAssetTypes]     = useState<AssetType[]>([])
    const [prices, setPrices]             = useState<Record<string,Entry>>({})
    const [latest, setLatest]             = useState<Record<string,{buy:number|null;sell:number|null;timestamp:string|null}>>({})
    const [loading, setLoading]           = useState(false)
    const [syncing, setSyncing]           = useState(false)
    const { showToast } = useToast()
    const supabase = createClient()
    const svc = new PricingService(supabase)

    const load = async () => {
        const [assets, lp] = await Promise.all([svc.getAssetTypes(), svc.getLatestPrices()])
        setAssetTypes(assets)
        const lm: Record<string,{buy:number|null;sell:number|null;timestamp:string|null}> = {}
        for (const p of lp as Array<{asset_type_id:string;latest_buy_price:number|null;latest_sell_price:number|null;price_timestamp:string|null}>)
            lm[p.asset_type_id] = { buy:p.latest_buy_price, sell:p.latest_sell_price, timestamp:p.price_timestamp }
        setLatest(lm)
        const init: Record<string,Entry> = {}
        for (const a of assets)
            init[a.id] = { asset_type_id:a.id, buy_price:lm[a.id]?.buy?.toString()??'', sell_price:lm[a.id]?.sell?.toString()??'' }
        setPrices(init)
    }
    useEffect(() => { load() }, [])

    const handleChange = (id:string, f:'buy_price'|'sell_price', v:string) =>
        setPrices(p=>({ ...p, [id]:{ ...p[id], asset_type_id:id, [f]:v } }))

    const handleSync = async () => {
        setSyncing(true)
        try {
            const res = await fetch('/api/prices/sync',{method:'POST'})
            const d   = await res.json()
            if (!res.ok) throw new Error(d.error||'API hatası')
            await load(); showToast("Fiyatlar API'den güncellendi",'success')
        } catch (e:unknown) { showToast(e instanceof Error?e.message:'Hata','error') }
        finally { setSyncing(false) }
    }

    const handleSave = async () => {
        setLoading(true)
        try {
            const entries = Object.values(prices).filter(p=>p.buy_price||p.sell_price)
                .map(p=>({ asset_type_id:p.asset_type_id, buy_price:parseFloat(p.buy_price)||0, sell_price:parseFloat(p.sell_price)||0 }))
            if (!entries.length) { showToast('En az bir fiyat giriniz','error'); return }
            await svc.saveManualPrices(entries)
            showToast('Fiyatlar kaydedildi!','success')
            setTimeout(()=>router.push('/'),1500)
        } catch (e:unknown) { showToast(e instanceof Error?e.message:'Hata','error') }
        finally { setLoading(false) }
    }

    const hasChanges = Object.keys(prices).some(id => {
        const ib = latest[id]?.buy?.toString()??'', is_ = latest[id]?.sell?.toString()??''
        return prices[id].buy_price!==ib || prices[id].sell_price!==is_
    })

    const goldAssets = assetTypes.filter(a=>a.category==='gold')
    const fxAssets   = assetTypes.filter(a=>a.category==='fx')

    const renderGroup = (assets: AssetType[], title: string, accent: string, dim: string) => (
        <div className="mb-5">
            <div className="flex items-center gap-3 mb-3">
                <span className="badge" style={{ background:dim, color:accent, border:`1px solid ${accent}40` }}>
                    {title}
                </span>
                <span className="text-xs" style={{ color:'var(--t3)' }}>{assets.length} varlık</span>
            </div>
            <div className="card overflow-hidden">
                <div className="grid grid-cols-[1fr_150px_155px_155px]"
                     style={{ borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                    {['Varlık','Son Alış','Yeni Alış (₺)','Yeni Satış (₺)'].map((h,i)=>(
                        <div key={h} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider ${i>0?'text-right':''}`}
                             style={{ color:'var(--t3)' }}>{h}</div>
                    ))}
                </div>
                {assets.map((a,i)=>{
                    const lp = latest[a.id], entry = prices[a.id]
                    return (
                        <div key={a.id} className="grid grid-cols-[1fr_150px_155px_155px] items-center"
                             style={{ borderBottom:i<assets.length-1?'1px solid rgba(255,255,255,0.04)':'none' }}>
                            <div className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black"
                                         style={{ background:dim, color:accent }}>
                                        {a.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color:'var(--t1)' }}>{a.name}</p>
                                        {lp?.timestamp && (
                                            <p className="flex items-center gap-1 text-xs mt-0.5" style={{ color:'var(--t4)' }}>
                                                <Clock className="w-3 h-3"/>{formatDateTime(lp.timestamp)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="px-4 py-3.5 text-right">
                                <span className="text-sm tabular-nums font-medium" style={{ color:'var(--t2)' }}>
                                    {formatCurrencyTRY(lp?.buy??null)}
                                </span>
                            </div>
                            <div className="px-3 py-2.5">
                                <input type="number" step="any" placeholder="0.00"
                                       value={entry?.buy_price??''} onChange={e=>handleChange(a.id,'buy_price',e.target.value)}
                                       className="inp text-sm text-right tabular-nums py-2" />
                            </div>
                            <div className="px-3 py-2.5">
                                <input type="number" step="any" placeholder="0.00"
                                       value={entry?.sell_price??''} onChange={e=>handleChange(a.id,'sell_price',e.target.value)}
                                       className="inp text-sm text-right tabular-nums py-2" />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )

    return (
        <DashboardLayout>
            <div className="p-6 max-w-4xl fade-in">
                <div className="flex items-center justify-between mb-7">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="btn btn-ghost p-2.5"><ArrowLeft className="w-4 h-4"/></Link>
                        <div className="icon-chip" style={{ background:'linear-gradient(135deg,#10B981,#065F46)', boxShadow:'0 4px 14px rgba(16,185,129,0.3)' }}>
                            <DollarSign className="w-4 h-4 text-white" style={{width:18,height:18}}/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color:'var(--t1)' }}>Güncel Fiyatlar</h1>
                            <p className="text-xs mt-0.5" style={{ color:'var(--t3)' }}>Manuel giriş veya API senkronizasyonu</p>
                        </div>
                    </div>
                    <button onClick={handleSync} disabled={syncing} className="btn btn-ghost text-sm">
                        <RefreshCw className={`w-4 h-4 ${syncing?'spin':''}`} style={{ color:syncing?'var(--gold)':undefined }}/>
                        {syncing?'Çekiliyor...':'API\'den Çek'}
                    </button>
                </div>

                {renderGroup(goldAssets,'Altın','#FBBF24','rgba(245,158,11,0.12)')}
                {renderGroup(fxAssets,  'Döviz','#818CF8','rgba(129,140,248,0.12)')}

                <button onClick={handleSave} disabled={loading||!hasChanges} className="btn btn-gold w-full py-3 mt-2"
                        style={{ opacity:(loading||!hasChanges)?0.5:1, cursor:(loading||!hasChanges)?'not-allowed':'pointer' }}>
                    {loading
                        ? <><span className="spin inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent"/>Kaydediliyor...</>
                        : <><Save className="w-4 h-4"/>{hasChanges?'Değişiklikleri Kaydet':'Değişiklik Yok'}</>}
                </button>
            </div>
        </DashboardLayout>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ReportingService } from '@/lib/services/ReportingService'
import { PricingService } from '@/lib/services/PricingService'
import { Transaction, AssetType, ReportFilter } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import { Download, FileSpreadsheet, Inbox, TrendingUp, TrendingDown, Activity, Hash, BarChart2 } from 'lucide-react'
import { formatCurrencyTRY, formatQuantity, formatDateOnly } from '@/lib/utils/format'

const PERIODS = [
    { l:'7G',    v:'7d'  },
    { l:'30G',   v:'30d' },
    { l:'90G',   v:'90d' },
    { l:'Bu Yıl',v:'ytd' },
] as const

export default function ReportsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [assetTypes, setAssetTypes]     = useState<AssetType[]>([])
    const [loading, setLoading]           = useState(false)
    const [period, setPeriod]             = useState<'7d'|'30d'|'90d'|'ytd'>('30d')
    const [filter, setFilter] = useState<ReportFilter>(() => {
        const d=new Date(), end=d.toISOString().split('T')[0]
        d.setDate(d.getDate()-30)
        return { start_date:d.toISOString().split('T')[0], end_date:end }
    })
    const [assetF, setAssetF] = useState('')
    const [typeF,  setTypeF]  = useState<''|'buy'|'sell'>('')

    const supabase = createClient()
    const rs = new ReportingService(supabase)
    const ps = new PricingService(supabase)

    useEffect(() => { ps.getAssetTypes().then(setAssetTypes) }, [])

    const loadReport = async () => {
        setLoading(true)
        try {
            setTransactions(await rs.getTransactionReport({ ...filter, asset_type_id:assetF||undefined, transaction_type:typeF||undefined } as ReportFilter))
        } finally { setLoading(false) }
    }
    useEffect(() => { loadReport() }, [filter, assetF, typeF])

    const handlePeriod = (v: typeof period) => {
        const { start, end } = rs.getDateRange(v)
        setPeriod(v); setFilter(f=>({...f, start_date:start, end_date:end}))
    }

    const totalBuy  = transactions.filter(t=>t.transaction_type==='buy') .reduce((s,t)=>s+Number(t.total_amount),0)
    const totalSell = transactions.filter(t=>t.transaction_type==='sell').reduce((s,t)=>s+Number(t.total_amount),0)
    const net = totalBuy - totalSell

    const volMap: Record<string,{name:string;vol:number}> = {}
    transactions.forEach(t=>{ if(!volMap[t.asset_type_id]) volMap[t.asset_type_id]={name:t.asset_types?.name||'?',vol:0}; volMap[t.asset_type_id].vol+=Number(t.total_amount) })
    let topAsset='—', maxVol=0
    Object.values(volMap).forEach(a=>{ if(a.vol>maxVol){maxVol=a.vol;topAsset=a.name} })

    const kpis = [
        { l:'Toplam Alış',   v:formatCurrencyTRY(totalBuy),  icon:TrendingUp,   color:'#34D399', glow:'rgba(16,185,129,0.2)',  bg:'linear-gradient(135deg,#10B981,#065F46)' },
        { l:'Toplam Satış',  v:formatCurrencyTRY(totalSell), icon:TrendingDown, color:'var(--red)', glow:'rgba(248,113,113,0.2)', bg:'linear-gradient(135deg,#F87171,#991B1B)' },
        { l:'Net Hacim',     v:formatCurrencyTRY(net),       icon:Activity,     color:net>0?'#34D399':net<0?'var(--red)':'var(--t3)', glow:'rgba(100,116,139,0.15)', bg:'linear-gradient(135deg,#64748B,#334155)' },
        { l:'En Aktif',      v:topAsset,                     icon:BarChart2,    color:'var(--indigo)', glow:'rgba(129,140,248,0.2)', bg:'linear-gradient(135deg,#818CF8,#4F46E5)' },
        { l:'İşlem Sayısı',  v:String(transactions.length),  icon:Hash,         color:'var(--gold-2)', glow:'rgba(245,158,11,0.2)', bg:'linear-gradient(135deg,#F59E0B,#92400E)' },
    ]

    return (
        <DashboardLayout>
            <div className="p-6 max-w-7xl fade-in">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="icon-chip" style={{ background:'linear-gradient(135deg,#F59E0B,#92400E)', boxShadow:'0 4px 14px rgba(245,158,11,0.3)' }}>
                            <BarChart2 className="w-4 h-4 text-white" style={{width:18,height:18}}/>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold" style={{ color:'var(--t1)' }}>Raporlar</h1>
                            <p className="text-xs mt-0.5" style={{ color:'var(--t3)' }}>İşlem analizi ve dışa aktarım</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={()=>rs.exportToCSV(transactions)} disabled={!transactions.length}
                                className="btn btn-ghost text-xs py-2 px-3" style={{ opacity: !transactions.length ? 0.4 : 1 }}>
                            <Download className="w-3.5 h-3.5"/> CSV
                        </button>
                        <button onClick={()=>rs.exportToExcel(transactions)} disabled={!transactions.length}
                                className="btn btn-ghost text-xs py-2 px-3"
                                style={{ opacity: !transactions.length ? 0.4 : 1, color:transactions.length?'#4ADE80':undefined }}>
                            <FileSpreadsheet className="w-3.5 h-3.5"/> Excel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="card p-4 mb-5 space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {PERIODS.map(({ l, v }) => (
                            <button key={v} onClick={()=>handlePeriod(v)}
                                    className="px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
                                    style={period===v
                                        ? { background:'var(--gold-dim)', color:'var(--gold-2)', border:'1px solid rgba(245,158,11,0.3)' }
                                        : { background:'var(--bg-3)',     color:'var(--t4)',      border:'1px solid var(--border)' }}>
                                {l}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { label:'Başlangıç', node:<input type="date" value={filter.start_date} onChange={e=>{setPeriod('30d');setFilter(f=>({...f,start_date:e.target.value}))}} className="inp text-sm py-2"/> },
                            { label:'Bitiş',     node:<input type="date" value={filter.end_date}   onChange={e=>{setPeriod('30d');setFilter(f=>({...f,end_date:e.target.value}))}}   className="inp text-sm py-2"/> },
                            { label:'Varlık',    node:<select value={assetF} onChange={e=>setAssetF(e.target.value)} className="inp text-sm py-2"><option value="">Tümü</option>{assetTypes.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select> },
                            { label:'Tip',       node:<select value={typeF}  onChange={e=>setTypeF(e.target.value as ''|'buy'|'sell')} className="inp text-sm py-2"><option value="">Tümü</option><option value="buy">Alış</option><option value="sell">Satış</option></select> },
                        ].map(({ label, node })=>(
                            <div key={label}>
                                <p className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color:'var(--t3)' }}>{label}</p>
                                {node}
                            </div>
                        ))}
                    </div>
                </div>

                {/* KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5 stagger">
                    {kpis.map(({ l, v, icon:Icon, color, glow, bg }, i)=>(
                        <div key={i} className="stat-card fade-up" style={{ boxShadow:`0 4px 20px ${glow}` }}>
                            <div className="flex items-start justify-between mb-3">
                                <p className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--t3)' }}>{l}</p>
                                <div className="icon-chip w-8 h-8" style={{ background:bg, width:32, height:32, borderRadius:10 }}>
                                    <Icon className="text-white" style={{ width:14, height:14 }}/>
                                </div>
                            </div>
                            <p className="text-base font-black truncate" style={{ color }}>{v}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    {loading ? (
                        <div className="p-6 space-y-3">{[...Array(5)].map((_,i)=><div key={i} className="skeleton h-11"/>)}</div>
                    ) : transactions.length===0 ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="icon-chip w-14 h-14 mb-4" style={{ background:'var(--bg-3)', width:56, height:56, borderRadius:16 }}>
                                <Inbox className="w-6 h-6" style={{ color:'var(--t4)' }}/>
                            </div>
                            <p className="font-semibold text-sm mb-1" style={{ color:'var(--t1)' }}>Rapor boş</p>
                            <p className="text-xs" style={{ color:'var(--t3)' }}>Seçilen tarih aralığında işlem yok</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="tbl">
                                <thead>
                                    <tr>{['Tarih','Varlık','Tür','Miktar','Birim Fiyat','Toplam','Not'].map(h=>(
                                        <th key={h}>{h}</th>
                                    ))}</tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx=>(
                                        <tr key={tx.id}>
                                            <td className="tabular-nums" style={{ color:'var(--t2)' }}>{formatDateOnly(tx.transaction_date)}</td>
                                            <td className="font-semibold" style={{ color:'var(--t1)' }}>{tx.asset_types?.name??'—'}</td>
                                            <td><span className={`badge ${tx.transaction_type==='buy'?'badge-green':'badge-red'}`}>{tx.transaction_type==='buy'?'↑ Alış':'↓ Satış'}</span></td>
                                            <td style={{ color:'var(--t2)' }}>{formatQuantity(Number(tx.quantity),tx.asset_types?.unit_type||'adet')}</td>
                                            <td style={{ color:'var(--t2)' }}>{formatCurrencyTRY(Number(tx.unit_price))}</td>
                                            <td className="font-bold" style={{ color:'var(--t1)' }}>{formatCurrencyTRY(Number(tx.total_amount))}</td>
                                            <td className="max-w-xs truncate" style={{ color:'var(--t4)' }}>{tx.note??'—'}</td>
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

'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { TransactionService } from '@/lib/services/TransactionService'
import { PricingService } from '@/lib/services/PricingService'
import { AssetType, TransactionFormData } from '@/lib/types'
import DashboardLayout from '@/app/layout-dashboard'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
    asset_type_id:    z.string().min(1,'Varlık seçiniz'),
    transaction_type: z.enum(['buy','sell']),
    quantity:         z.number().positive('Miktar 0\'dan büyük olmalı'),
    unit_price:       z.number().min(0,'Fiyat negatif olamaz'),
    transaction_date: z.string().min(1,'Tarih seçiniz'),
    note:             z.string().optional(),
})
type FV = z.infer<typeof schema>

export default function NewTransactionPage() {
    const router = useRouter()
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
    const [loading, setLoading]       = useState(false)
    const { showToast } = useToast()
    const supabase = createClient()

    const { register, handleSubmit, watch, formState: { errors } } = useForm<FV>({
        resolver: zodResolver(schema),
        defaultValues: { transaction_type:'buy', transaction_date: format(new Date(),"yyyy-MM-dd'T'HH:mm") },
    })

    const txType = watch('transaction_type')
    const qty    = watch('quantity')
    const price  = watch('unit_price')
    const total  = qty && price && !isNaN(qty) && !isNaN(price) ? qty * price : null

    useEffect(() => { new PricingService(supabase).getAssetTypes().then(setAssetTypes) }, [])

    const onSubmit = async (v: FV) => {
        setLoading(true)
        try {
            await new TransactionService(supabase).createTransaction(v as TransactionFormData)
            showToast('İşlem başarıyla eklendi!','success')
            router.push('/transactions')
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'Bir hata oluştu','error')
            setLoading(false)
        }
    }

    const label = (txt: string) => (
        <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color:'var(--t3)' }}>{txt}</p>
    )
    const err = (msg?: string) => msg
        ? <p className="text-xs mt-1.5 font-medium" style={{ color:'var(--red)' }}>{msg}</p>
        : null

    return (
        <DashboardLayout>
            <div className="p-6 max-w-xl fade-in">

                {/* Header */}
                <div className="flex items-center gap-3 mb-7">
                    <Link href="/transactions" className="btn btn-ghost p-2.5">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color:'var(--t1)' }}>Yeni İşlem</h1>
                        <p className="text-xs mt-0.5" style={{ color:'var(--t3)' }}>Alış veya satış kaydı ekle</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                    {/* İşlem tipi */}
                    <div className="card p-5">
                        {label('İşlem Tipi')}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { v:'buy',  l:'Alış',  icon:TrendingUp,   bg:'var(--green-dim)',  color:'#34D399', border:'rgba(16,185,129,0.3)',  activeBg:'rgba(16,185,129,0.18)' },
                                { v:'sell', l:'Satış', icon:TrendingDown, bg:'var(--red-dim)',    color:'var(--red)', border:'rgba(248,113,113,0.3)', activeBg:'rgba(248,113,113,0.18)' },
                            ].map(({ v, l, icon:Icon, bg, color, border, activeBg }) => (
                                <label key={v}
                                       className="flex items-center justify-center gap-2.5 py-4 rounded-2xl border-2 cursor-pointer font-bold text-sm transition-all"
                                       style={txType===v
                                           ? { background:activeBg, borderColor:border, color }
                                           : { background:'var(--bg-3)', borderColor:'var(--border-2)', color:'var(--t4)' }}>
                                    <input type="radio" value={v} {...register('transaction_type')} className="sr-only" />
                                    <Icon className="w-4 h-4" />
                                    {l}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Varlık */}
                    <div className="card p-5">
                        {label('Varlık')}
                        <select {...register('asset_type_id')} className="inp">
                            <option value="">— Seçiniz —</option>
                            {assetTypes.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                        {err(errors.asset_type_id?.message)}
                    </div>

                    {/* Miktar + Fiyat */}
                    <div className="card p-5">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                {label('Miktar')}
                                <input type="number" step="any" placeholder="0.000"
                                       {...register('quantity',{ valueAsNumber:true })} className="inp" />
                                {err(errors.quantity?.message)}
                            </div>
                            <div>
                                {label('Birim Fiyat (₺)')}
                                <input type="number" step="any" placeholder="0.00"
                                       {...register('unit_price',{ valueAsNumber:true })} className="inp" />
                                {err(errors.unit_price?.message)}
                            </div>
                        </div>

                        {total !== null && (
                            <div className="flex items-center justify-between p-3.5 rounded-xl"
                                 style={{ background:'var(--gold-dim)', border:'1px solid rgba(245,158,11,0.2)' }}>
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color:'var(--gold)' }}>Toplam Tutar</span>
                                <span className="text-lg font-black" style={{ color:'var(--gold-2)' }}>
                                    {new Intl.NumberFormat('tr-TR',{style:'currency',currency:'TRY'}).format(total)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Tarih + Not */}
                    <div className="card p-5 space-y-4">
                        <div>
                            {label('İşlem Zamanı')}
                            <input type="datetime-local" {...register('transaction_date')} className="inp" />
                            {err(errors.transaction_date?.message)}
                        </div>
                        <div>
                            {label('Not (opsiyonel)')}
                            <textarea {...register('note')} rows={2} placeholder="Kuyumcu adı, açıklama..."
                                      className="inp resize-none" />
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-gold w-full py-3"
                            style={{ opacity: loading ? 0.7 : 1 }}>
                        {loading
                            ? <><span className="spin inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent"/>Kaydediliyor...</>
                            : <><Save className="w-4 h-4"/>İşlemi Kaydet</>}
                    </button>
                </form>
            </div>
        </DashboardLayout>
    )
}

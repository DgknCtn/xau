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
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useToast } from '@/components/ui/Toast'

// z.number() ile useForm<FormValues> tam tip uyumu — valueAsNumber kullanılarak
const schema = z.object({
    asset_type_id: z.string().min(1, 'Varlık seçiniz'),
    transaction_type: z.enum(['buy', 'sell']),
    quantity: z.number().positive('Miktar 0\'dan büyük olmalı'),
    unit_price: z.number().min(0, 'Fiyat negatif olamaz'),
    transaction_date: z.string().min(1, 'Tarih seçiniz'),
    note: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function NewTransactionPage() {
    const router = useRouter()
    const [assetTypes, setAssetTypes] = useState<AssetType[]>([])
    const [loading, setLoading] = useState(false)
    const { showToast } = useToast()
    const supabase = createClient()

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            transaction_type: 'buy',
            transaction_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        },
    })

    const txType = watch('transaction_type')

    useEffect(() => {
        const pricingService = new PricingService(supabase)
        pricingService.getAssetTypes().then(setAssetTypes)
    }, [])

    const onSubmit = async (values: FormValues) => {
        setLoading(true)
        const txService = new TransactionService(supabase)
        try {
            await txService.createTransaction(values as TransactionFormData)
            showToast('İşlem başarıyla eklendi!', 'success')
            router.push('/transactions')
        } catch (e: unknown) {
            showToast(e instanceof Error ? e.message : 'Bir hata oluştu', 'error')
            setLoading(false)
        }
    }

    const inputCls =
        'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all'
    const errCls = 'text-red-400 text-xs mt-1'
    const labelCls = 'block text-sm text-gray-400 mb-1.5'

    return (
        <DashboardLayout>
            <div className="p-6 max-w-2xl">
                {/* Başlık */}
                <div className="flex items-center gap-3 mb-6">
                    <Link
                        href="/transactions"
                        className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <h1 className="text-2xl font-bold text-white">Yeni İşlem</h1>
                </div>

                {/* Başlık */}

                <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                    {/* İşlem Tipi */}
                    <div>
                        <label className={labelCls}>İşlem Tipi</label>
                        <div className="flex gap-2">
                            {[
                                { v: 'buy', l: 'Alış' },
                                { v: 'sell', l: 'Satış' },
                            ].map(({ v, l }) => (
                                <label
                                    key={v}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border cursor-pointer text-sm font-medium transition-all ${txType === v
                                            ? v === 'buy'
                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                                            : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        value={v}
                                        {...register('transaction_type')}
                                        className="sr-only"
                                    />
                                    {l}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Varlık */}
                    <div>
                        <label className={labelCls}>Varlık</label>
                        <select {...register('asset_type_id')} className={inputCls}>
                            <option value="">— Seçiniz —</option>
                            {assetTypes.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                        {errors.asset_type_id && <p className={errCls}>{errors.asset_type_id.message}</p>}
                    </div>

                    {/* Miktar + Birim Fiyat */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Miktar</label>
                            {/* valueAsNumber ensures the form value is a number, matching z.number() */}
                            <input
                                type="number"
                                step="any"
                                {...register('quantity', { valueAsNumber: true })}
                                placeholder="0.000"
                                className={inputCls}
                            />
                            {errors.quantity && <p className={errCls}>{errors.quantity.message}</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Birim Fiyat (TL)</label>
                            <input
                                type="number"
                                step="any"
                                {...register('unit_price', { valueAsNumber: true })}
                                placeholder="0.00"
                                className={inputCls}
                            />
                            {errors.unit_price && <p className={errCls}>{errors.unit_price.message}</p>}
                        </div>
                    </div>

                    {/* Tarih */}
                    <div>
                        <label className={labelCls}>İşlem Zamanı</label>
                        <input type="datetime-local" {...register('transaction_date')} className={inputCls} />
                        {errors.transaction_date && (
                            <p className={errCls}>{errors.transaction_date.message}</p>
                        )}
                    </div>

                    {/* Not */}
                    <div>
                        <label className={labelCls}>Not (opsiyonel)</label>
                        <textarea
                            {...register('note')}
                            placeholder="Kuyumcu adı, açıklama..."
                            rows={2}
                            className={`${inputCls} resize-none`}
                        />
                    </div>

                    {/* Buton */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? 'Kaydediliyor...' : 'İşlemi Kaydet'}
                    </button>
                </form>
            </div>
        </DashboardLayout>
    )
}

import { SupabaseClient } from '@supabase/supabase-js'
import { AssetType } from '@/lib/types'

export interface ManualPriceEntry {
    asset_type_id: string
    buy_price: number
    sell_price: number
}

export class PricingService {
    constructor(private supabase: SupabaseClient) { }

    async getAssetTypes(): Promise<AssetType[]> {
        const { data, error } = await this.supabase
            .from('asset_types')
            .select('*')
            .eq('is_active', true)
            .order('display_order')

        if (error) throw new Error(error.message)
        return (data || []) as AssetType[]
    }

    async getLatestPrices() {
        const { data, error } = await this.supabase
            .from('v_latest_prices')
            .select('*')

        if (error) throw new Error(error.message)
        return data || []
    }

    /**
     * Manuel fiyat girişi: kullanıcı fiyatları elle girer
     * Bu yöntem, gerçek API entegrasyonu yerine kullanılır
     */
    async saveManualPrices(entries: ManualPriceEntry[]): Promise<void> {
        const { data: source } = await this.supabase
            .from('price_sources')
            .select('id')
            .eq('code', 'MANUAL')
            .single()

        if (!source) throw new Error('MANUAL fiyat kaynağı bulunamadı')

        const snapshots = entries.map((e) => ({
            source_id: source.id,
            asset_type_id: e.asset_type_id,
            buy_price: e.buy_price,
            sell_price: e.sell_price,
            price_timestamp: new Date().toISOString(),
        }))

        const { error } = await this.supabase.from('price_snapshots').insert(snapshots)
        if (error) throw new Error(error.message)
    }

    /**
     * Tek varlık için güncel alış fiyatını döner
     */
    async getCurrentBuyPrice(assetTypeId: string): Promise<number | null> {
        const { data, error } = await this.supabase
            .from('v_latest_prices')
            .select('latest_buy_price')
            .eq('asset_type_id', assetTypeId)
            .single()

        if (error || !data) return null
        return data.latest_buy_price
    }
}

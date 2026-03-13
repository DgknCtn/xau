import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const collectApiKey = process.env.COLLECTAPI_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase credentials missing' }, { status: 500 })
    }

    // Use service role key to bypass RLS for inserting into price_snapshots
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Get mappings and active asset types
    const { data: mappings, error: mapErr } = await supabase
      .from('asset_price_mappings')
      .select('*, asset_type_id, price_sources(code)')

    if (mapErr) throw mapErr

    const { data: assets, error: assetErr } = await supabase
      .from('asset_types')
      .select('id, category')
      .eq('is_active', true)

    if (assetErr) throw assetErr

    const assetMap = new Map(assets?.map(a => [a.id, a]))

    // 2. Fetch from CollectAPI if there are COLLECTAPI mappings
    const goldMappings = mappings?.filter(m => m.price_sources?.code === 'COLLECTAPI') || []
    let collectApiData: any = null

    if (goldMappings.length > 0 && collectApiKey) {
      const res = await fetch('https://api.collectapi.com/economy/goldPrice', {
        headers: {
          'authorization': `apikey ${collectApiKey}`,
          'content-type': 'application/json'
        }
      })
      if (res.ok) {
        collectApiData = await res.json()
      } else {
        console.error('CollectAPI fetch failed:', await res.text())
      }
    }

    // 3. Fetch from ExchangeRate-API if there are ER_API mappings
    const fxMappings = mappings?.filter(m => m.price_sources?.code === 'ER_API') || []
    let erApiData: any = null

    if (fxMappings.length > 0) {
      // Free endpoint requires no API key, base USD
      const res = await fetch('https://open.er-api.com/v6/latest/USD')
      if (res.ok) {
        erApiData = await res.json()
      } else {
        console.error('ER-API fetch failed:', await res.text())
      }
    }

    // 4. Prepare snapshots
    const snapshots: any[] = []
    const timestamp = new Date().toISOString()

    for (const mapping of mappings || []) {
      const sourceCode = mapping.price_sources?.code
      const asset = assetMap.get(mapping.asset_type_id)
      if (!asset) continue

      if (sourceCode === 'COLLECTAPI' && collectApiData?.success) {
        // CollectAPI returns array: [{name: "Gram Altın", buy: "3000.50", ...}, ...]
        const item = collectApiData.result.find((i: any) => i.name === mapping.external_key)
        if (item) {
          const buyPrice = typeof item.buying === 'number' ? item.buying : parseFloat(item.buying || item.buy)
          const sellPrice = typeof item.selling === 'number' ? item.selling : parseFloat(item.selling || item.sell)
          
          if (!isNaN(buyPrice) && !isNaN(sellPrice)) {
            snapshots.push({
              asset_type_id: mapping.asset_type_id,
              source_id: mapping.source_id,
              buy_price: buyPrice,
              sell_price: sellPrice,
              price_timestamp: timestamp
            })
          }
        }
      } 
      else if (sourceCode === 'ER_API' && erApiData?.result === 'success') {
        // ER API returns { rates: { TRY: 35.5, EUR: 0.9, ... } } base USD
        // External key is expected to be e.g. "USD" or "EUR"
        // Since we want price of 1 Foreign Currency in TRY:
        // Price of 1 USD in TRY = rates.TRY
        // Price of 1 EUR in TRY = rates.TRY / rates.EUR
        const rates = erApiData.rates
        const tryRate = rates['TRY']
        const currency = mapping.external_key // e.g. 'USD', 'EUR'

        if (tryRate && rates[currency]) {
          const crossRate = tryRate / rates[currency] // Try per Unit of Currency
          // Usually buy/sell spread isn't provided by mid-market APIs.
          // Add a small spread or just use same for both, or apply a fixed % spread
          const spreadPct = 0.005 // 0.5% half-spread
          const buyPrice = crossRate * (1 - spreadPct)
          const sellPrice = crossRate * (1 + spreadPct)

          snapshots.push({
            asset_type_id: mapping.asset_type_id,
            source_id: mapping.source_id,
            buy_price: buyPrice,
            sell_price: sellPrice,
            price_timestamp: timestamp
          })
        }
      }
    }

    // 5. Insert snapshots
    if (snapshots.length > 0) {
      const { error: insertErr } = await supabase.from('price_snapshots').insert(snapshots)
      if (insertErr) throw insertErr
    }

    return NextResponse.json({ success: true, count: snapshots.length })
  } catch (error: any) {
    console.error('Sync API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

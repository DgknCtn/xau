import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

// TL formatı - Örn: 1.234,56 ₺
export function formatCurrencyTRY(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '(Veri yok)'
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value)
}

// Döviz kuru formatı - Örn: 34.1234 ₺ (Daha hassas gösterim için)
export function formatExchangeRate(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '(Veri yok)'
    return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
    }).format(value)
}

// Miktar formatı
export function formatQuantity(value: number, unitType: string): string {
    if (value == null || isNaN(value)) return '0'

    let fractions = 0
    if (unitType === 'gram') fractions = 3
    else if (unitType === 'currency_unit') fractions = 2
    else fractions = 0 // adet vb. için tam sayı

    return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: fractions,
        maximumFractionDigits: fractions,
    }).format(value)
}

// Yüzde formatı - Örn: %2,72 veya -%1,45
export function formatPercent(value: number | null | undefined): string {
    if (value == null || isNaN(value)) return '%0,00'
    return new Intl.NumberFormat('tr-TR', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        signDisplay: 'exceptZero'
    }).format(value / 100)
}

// Tarih-Saat formatı - Örn: 13.03.2026 15:30
export function formatDateTime(dateString: string | null | undefined): string {
    if (!dateString) return '-'
    try {
        const date = new Date(dateString)
        return format(date, 'dd.MM.yyyy HH:mm', { locale: tr })
    } catch {
        return '-'
    }
}

// Sadece Tarih formatı - Örn: 13.03.2026
export function formatDateOnly(dateString: string | null | undefined): string {
    if (!dateString) return '-'
    try {
        const date = new Date(dateString)
        return format(date, 'dd.MM.yyyy', { locale: tr })
    } catch {
        return '-'
    }
}

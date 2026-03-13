'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, BarChart2, LogOut, TrendingUp, Plus, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/transactions', label: 'İşlem Geçmişi', icon: ArrowLeftRight },
    { href: '/prices', label: 'Güncel Fiyatlar', icon: DollarSign },
    { href: '/reports', label: 'Raporlar', icon: BarChart2 },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen bg-gray-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
                {/* Logo */}
                <div className="px-6 py-5 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
                            <TrendingUp className="w-5 h-5 text-gray-900" />
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">Altın Portföy</p>
                            <p className="text-gray-500 text-xs">Takip Sistemi</p>
                        </div>
                    </div>
                </div>

                {/* Hızlı işlem ekleme butonu */}
                <div className="px-4 py-4">
                    <Link
                        href="/transactions/new"
                        className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-semibold text-sm py-2.5 rounded-xl transition-all duration-200"
                    >
                        <Plus className="w-4 h-4" />
                        İşlem Ekle
                    </Link>
                </div>

                {/* Navigasyon */}
                <nav className="flex-1 px-3 space-y-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${active
                                        ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Çıkış */}
                <div className="px-3 py-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
                    >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* İçerik */}
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    )
}

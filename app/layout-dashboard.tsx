'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
    LayoutDashboard, ArrowLeftRight, BarChart2,
    LogOut, Plus, DollarSign, Menu, X, Coins
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

const navItems = [
    { href: '/',             label: 'Dashboard',       icon: LayoutDashboard },
    { href: '/transactions', label: 'İşlem Geçmişi',   icon: ArrowLeftRight   },
    { href: '/prices',       label: 'Güncel Fiyatlar',  icon: DollarSign       },
    { href: '/reports',      label: 'Raporlar',         icon: BarChart2        },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router   = useRouter()
    const supabase = createClient()
    const [open, setOpen] = useState(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row" style={{ background: 'var(--bg)' }}>

            {/* ── Mobile header ──────────────────────── */}
            <div className="md:hidden flex items-center justify-between px-4 py-3 shrink-0"
                 style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black"
                         style={{ background: 'linear-gradient(135deg,#F59E0B,#92400E)', color: '#fff', boxShadow: '0 4px 14px rgba(245,158,11,0.35)' }}>
                        XAU
                    </div>
                    <span className="font-bold text-sm" style={{ color: 'var(--t1)' }}>Altın Portföy</span>
                </div>
                <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg" style={{ color: 'var(--t3)' }}>
                    {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
            </div>

            {/* ── Overlay ─────────────────────────────── */}
            {open && (
                <div className="fixed inset-0 z-40 md:hidden"
                     style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
                     onClick={() => setOpen(false)} />
            )}

            {/* ── Sidebar ─────────────────────────────── */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300 ease-out
                            md:relative md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
                style={{
                    width: 240,
                    background: 'linear-gradient(180deg, #0D1525 0%, #080C18 100%)',
                    borderRight: '1px solid var(--border)',
                }}>

                {/* Top glow accent */}
                <div className="absolute top-0 left-0 right-0 h-px"
                     style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)' }} />

                {/* Logo */}
                <div className="px-5 pt-6 pb-5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black shrink-0 relative overflow-hidden"
                             style={{
                                 background: 'linear-gradient(135deg,#F59E0B,#92400E)',
                                 color: '#fff',
                                 boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
                             }}>
                            <Coins className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-bold text-sm leading-tight" style={{ color: 'var(--t1)' }}>Altın Portföy</p>
                            <p className="text-xs mt-0.5" style={{ color: 'var(--t3)' }}>Takip Sistemi</p>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="px-4 py-4 shrink-0">
                    <Link href="/transactions/new" onClick={() => setOpen(false)}
                          className="btn btn-gold w-full py-2.5 text-xs">
                        <Plus className="w-3.5 h-3.5" />
                        Yeni İşlem Ekle
                    </Link>
                </div>

                {/* Nav label */}
                <p className="px-5 pb-2 text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--t4)' }}>
                    Navigasyon
                </p>

                {/* Nav */}
                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const active = pathname === href
                        return (
                            <Link key={href} href={href} onClick={() => setOpen(false)}
                                  className={`nav-item ${active ? 'active' : ''}`}>
                                <Icon className="w-4 h-4 shrink-0" />
                                {label}
                            </Link>
                        )
                    })}
                </nav>

                {/* Bottom */}
                <div className="px-3 py-4 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
                    <button onClick={handleLogout}
                            className="nav-item w-full text-left"
                            style={{ color: 'var(--t4)' }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--red-dim)'; el.style.color = 'var(--red)'; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = ''; el.style.color = 'var(--t4)'; }}>
                        <LogOut className="w-4 h-4 shrink-0" />
                        Çıkış Yap
                    </button>
                </div>
            </aside>

            {/* ── Main ────────────────────────────────── */}
            <main className="flex-1 overflow-auto min-w-0"
                  style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,158,11,0.04) 0%, transparent 70%), var(--bg)' }}>
                {children}
            </main>
        </div>
    )
}

'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Lock, Mail, Eye, EyeOff, AlertCircle, Coins } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail]             = useState('')
    const [password, setPassword]       = useState('')
    const [showPw, setShowPw]           = useState(false)
    const [loading, setLoading]         = useState(false)
    const [error, setError]             = useState<string | null>(null)
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true); setError(null)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError('E-posta veya şifre hatalı.'); setLoading(false) }
        else window.location.href = '/'
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
             style={{ background: 'var(--bg)' }}>

            {/* Ambient glows */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{
                    position:'absolute', top:'15%', left:'50%', transform:'translate(-50%,-50%)',
                    width:700, height:700,
                    background:'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 60%)',
                }} />
                <div style={{
                    position:'absolute', bottom:'-5%', right:'15%',
                    width:500, height:500,
                    background:'radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 60%)',
                }} />
                {/* Grid */}
                <div className="absolute inset-0" style={{
                    backgroundImage:`linear-gradient(rgba(255,255,255,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.02) 1px,transparent 1px)`,
                    backgroundSize:'52px 52px',
                }} />
                {/* Vignette */}
                <div className="absolute inset-0" style={{
                    background:'radial-gradient(ellipse at center, transparent 40%, rgba(6,9,18,0.8) 100%)'
                }} />
            </div>

            <div className="relative w-full max-w-[400px] fade-up">

                {/* Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-5 relative"
                         style={{
                             background: 'linear-gradient(135deg,#F59E0B,#92400E)',
                             boxShadow: '0 8px 32px rgba(245,158,11,0.45), 0 0 0 1px rgba(245,158,11,0.3)',
                         }}>
                        <Coins className="w-8 h-8 text-white" />
                        <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.15),transparent)' }} />
                    </div>
                    <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--t1)' }}>Altın Portföy</h1>
                    <p className="text-sm" style={{ color: 'var(--t3)' }}>Kişisel portföy takip sistemi</p>
                </div>

                {/* Card */}
                <div className="rounded-2xl p-7 relative overflow-hidden"
                     style={{
                         background: 'rgba(13,21,37,0.8)',
                         border: '1px solid var(--border-2)',
                         backdropFilter: 'blur(24px)',
                         boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
                     }}>

                    {/* Top shine */}
                    <div className="absolute top-0 left-6 right-6 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent)' }} />

                    <h2 className="text-base font-semibold mb-6" style={{ color: 'var(--t1)' }}>Hesabınıza giriş yapın</h2>

                    {error && (
                        <div className="flex items-center gap-2.5 p-3 rounded-xl mb-5 text-sm"
                             style={{ background: 'var(--red-dim)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--red)' }}>
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--t3)' }}>E-posta</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t4)' }} />
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                       required placeholder="ornek@email.com"
                                       className="inp pl-10" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: 'var(--t3)' }}>Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--t4)' }} />
                                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                       required placeholder="••••••••"
                                       className="inp pl-10 pr-11" />
                                <button type="button" onClick={() => setShowPw(!showPw)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                                        style={{ color: 'var(--t4)' }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--t2)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--t4)'}>
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                                className="btn btn-gold w-full py-3 mt-2"
                                style={{ opacity: loading ? 0.7 : 1 }}>
                            {loading
                                ? <><span className="spin inline-block w-4 h-4 rounded-full border-2 border-current border-t-transparent" />Giriş yapılıyor...</>
                                : 'Giriş Yap'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

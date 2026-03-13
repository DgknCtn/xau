'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TrendingUp, Lock, Mail, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) {
            setError('E-posta veya şifre hatalı.')
            setLoading(false)
        } else {
            window.location.href = '/'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center p-4">
            {/* Arkaplan efektleri */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl mb-4 shadow-lg shadow-yellow-500/20">
                        <TrendingUp className="w-8 h-8 text-gray-900" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Altın Portföy</h1>
                    <p className="text-gray-400 text-sm mt-1">Kişisel portföy takip sistemi</p>
                </div>

                {/* Kart */}
                <div className="bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-lg font-semibold text-white mb-6">Giriş Yap</h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">E-posta</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="ornek@email.com"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl py-3 pl-10 pr-4 text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Şifre</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl py-3 pl-10 pr-12 text-sm placeholder:text-gray-600 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/20 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-gray-900 font-semibold py-3 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}

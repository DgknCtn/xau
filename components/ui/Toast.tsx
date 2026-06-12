'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
    id: string
    message: string
    type: ToastType
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

const CONFIG = {
    success: {
        icon: CheckCircle2,
        bg:     'rgba(16,185,129,0.12)',
        border: 'rgba(16,185,129,0.25)',
        color:  '#34D399',
        bar:    '#10B981',
    },
    error: {
        icon: AlertCircle,
        bg:     'rgba(248,113,113,0.12)',
        border: 'rgba(248,113,113,0.25)',
        color:  '#FCA5A5',
        bar:    '#F87171',
    },
    info: {
        icon: Info,
        bg:     'rgba(99,102,241,0.12)',
        border: 'rgba(99,102,241,0.25)',
        color:  '#A5B4FC',
        bar:    '#818CF8',
    },
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    }, [])

    const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none" style={{ minWidth: 280, maxWidth: 360 }}>
                {toasts.map(toast => {
                    const cfg = CONFIG[toast.type]
                    const Icon = cfg.icon
                    return (
                        <div key={toast.id}
                             className="pointer-events-auto relative overflow-hidden rounded-xl shadow-2xl animate-fade-up"
                             style={{
                                 background:   cfg.bg,
                                 border:       `1px solid ${cfg.border}`,
                                 backdropFilter: 'blur(16px)',
                             }}
                             role="alert">
                            {/* Progress bar */}
                            <div className="absolute top-0 left-0 h-0.5 rounded-t-xl"
                                 style={{
                                     background: cfg.bar,
                                     width: '100%',
                                     animation: 'shrink 4s linear forwards',
                                 }} />
                            <div className="flex items-center gap-3 px-4 py-3.5">
                                <Icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                                <p className="text-sm font-medium flex-1" style={{ color: cfg.color }}>{toast.message}</p>
                                <button onClick={() => remove(toast.id)}
                                        className="p-1 rounded-lg transition-colors shrink-0"
                                        style={{ color: cfg.color, opacity: 0.6 }}
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0.6'}>
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <style>{`@keyframes shrink { from { width: 100%; } to { width: 0%; } }`}</style>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const ctx = useContext(ToastContext)
    if (!ctx) throw new Error('useToast must be used within a ToastProvider')
    return ctx
}

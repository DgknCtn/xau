import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
    isOpen: boolean
    title?: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmModal({
    isOpen,
    title = 'Emin misiniz?',
    message,
    confirmText = 'Onayla',
    cancelText = 'Vazgeç',
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
             style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
             onClick={onCancel}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden animate-fade-up"
                 style={{
                     background: 'var(--bg-surface)',
                     border: '1px solid var(--border)',
                     boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
                 }}
                 onClick={e => e.stopPropagation()}>

                {/* Top danger bar */}
                <div className="h-1" style={{ background: 'linear-gradient(90deg, var(--red), transparent)' }} />

                <div className="p-6">
                    <div className="flex items-start gap-4 mb-5">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                             style={{ background: 'var(--red-glow)', border: '1px solid rgba(248,113,113,0.2)' }}>
                            <AlertTriangle className="w-5 h-5" style={{ color: 'var(--red)' }} />
                        </div>
                        <div className="flex-1 pt-0.5">
                            <h3 className="text-base font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>{title}</h3>
                            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{message}</p>
                        </div>
                        <button onClick={onCancel}
                                className="p-1.5 rounded-lg transition-colors shrink-0 -mt-1 -mr-1"
                                style={{ color: 'var(--text-muted)' }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-3 justify-end">
                        <button onClick={onCancel} className="btn-ghost text-sm py-2 px-4">
                            {cancelText}
                        </button>
                        <button onClick={() => { onConfirm(); onCancel() }}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                                style={{
                                    background: 'var(--red-glow)',
                                    color: 'var(--red)',
                                    border: '1px solid rgba(248,113,113,0.3)',
                                }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.2)'}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--red-glow)'}>
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

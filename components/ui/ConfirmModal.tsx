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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 pt-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
                            <p className="text-sm text-gray-400">{message}</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1 -mr-2 text-gray-500 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="flex items-center justify-end gap-3 mt-8">
                        <button
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={() => {
                                onConfirm()
                                onCancel()
                            }}
                            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors"
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

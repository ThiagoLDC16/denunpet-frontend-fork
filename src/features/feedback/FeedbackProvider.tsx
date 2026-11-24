import { useCallback, useEffect, useMemo, useState } from 'react';
import { CircleCheck, X } from 'lucide-react';
import { FeedbackContext } from './feedbackContext';

const VISIBLE_MS = 5000;

// Confirmação visual das ações concluídas (salvar, editar, excluir, enviar arquivos...).
// Os erros continuam aparecendo dentro do próprio formulário/diálogo, perto de onde aconteceram.
export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<{ id: number, message: string } | null>(null);

    const showSuccess = useCallback((message: string) => {
        setToast({ id: Date.now(), message });
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timeout = setTimeout(() => setToast(null), VISIBLE_MS);
        return () => clearTimeout(timeout);
    }, [toast]);

    const value = useMemo(() => ({ showSuccess }), [showSuccess]);

    return (
        <FeedbackContext.Provider value={value}>
            {children}

            {/* Acima dos diálogos (z-50). pointer-events-auto: com um diálogo aberto o Radix desliga os cliques fora dele */}
            <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
                {toast && (
                    <div key={toast.id} className="pointer-events-auto flex max-w-md items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-900 shadow-lg">
                        <CircleCheck size={18} className="shrink-0 text-green-600" aria-hidden="true" />
                        <span>{toast.message}</span>
                        <button type="button" aria-label="Fechar aviso" className="ml-2 shrink-0 text-green-700 hover:text-green-900" onClick={() => setToast(null)}>
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>
        </FeedbackContext.Provider>
    );
}

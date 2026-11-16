import { createContext, useContext } from 'react';

export interface FeedbackContextType {
    // Mostra um aviso de sucesso no topo da tela, que some sozinho depois de alguns segundos
    showSuccess: (message: string) => void;
}

export const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export function useFeedback() {
    const context = useContext(FeedbackContext);
    if (context === undefined) {
        throw new Error('useFeedback must be used within a FeedbackProvider');
    }
    return context;
}

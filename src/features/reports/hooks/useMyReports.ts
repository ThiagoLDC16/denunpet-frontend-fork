import { useState, useEffect } from 'react';
import { reportService } from '../services/report.service';
import type { Report } from '../types/report.types';
import { getApiErrorMessage } from '@/lib/apiError';

export function useMyReports() {
    const [reports, setReports] = useState<Report[] | null>(null);
    // Começa em true para não piscar a mensagem de lista vazia antes da primeira busca
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);


    const fetchMyReports = async () => {
        setLoading(true);
        setError(null);
        try {

            const data = await reportService.getMyReports();

            setReports(data);
        } catch (err) {
            setError(getApiErrorMessage(err, 'Erro ao buscar denúncias'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyReports();
    }, []);


    return {
        reports,
        loading,
        error,
        refetch: () => fetchMyReports(),
    };
}
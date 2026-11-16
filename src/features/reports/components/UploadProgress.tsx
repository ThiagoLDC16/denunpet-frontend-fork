// Andamento do envio de arquivos. `progress` vai de 0 a 100; null quando o navegador não informa o total.
export function UploadProgress({ progress, savingLabel = 'Arquivos enviados. Salvando a denúncia...' }: { progress: number | null, savingLabel?: string }) {
    const uploaded = progress !== null && progress >= 100;
    const label = progress === null ? 'Enviando...' : uploaded ? savingLabel : `Enviando arquivos... ${progress}%`;

    return (
        <div className="my-3" role="status" aria-live="polite">
            <p className="mb-1 text-right text-sm text-blue-600">{label}</p>
            <div
                className="h-2 w-full overflow-hidden rounded bg-gray-200"
                role="progressbar"
                aria-label="Progresso do envio"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress ?? undefined}
            >
                <div
                    className={`h-full bg-blue-500 transition-all ${progress === null || uploaded ? 'animate-pulse' : ''}`}
                    style={{ width: `${progress ?? 100}%` }}
                />
            </div>
        </div>
    );
}

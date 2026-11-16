import type { RejectedFile } from '../lib/midia';

// Lista os arquivos que não entraram na seleção e o motivo de cada um
export function RejectedFilesNotice({ files }: { files: RejectedFile[] }) {
    if (files.length === 0) return null;

    return (
        <div role="alert" className="mt-1 text-right text-xs text-red-600">
            <p>{files.length > 1 ? 'Arquivos não adicionados:' : 'Arquivo não adicionado:'}</p>
            <ul>
                {files.map((file, index) => (
                    <li key={`${file.name}-${index}`}><strong>{file.name}</strong>: {file.reason}</li>
                ))}
            </ul>
        </div>
    );
}

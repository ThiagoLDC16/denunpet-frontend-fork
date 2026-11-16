import { ReportCard } from '../components/ReportCard';
import { usePendingReports } from '../hooks/usePendingReports';
import { useState } from 'react';

export function PendingReportsPage() {
  const { reports: allReports, loading, error, refetch } = usePendingReports()
  const [filterValue, setFilterValue] = useState('');

  if (loading && !allReports) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-lg">Carregando denúncias...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-red-600">Erro: {error}</div>
      </div>
    );
  }

  const search = filterValue.trim().toLowerCase()
  const reports = allReports?.filter((report) => report.description.toLowerCase().includes(search))
  const total = allReports?.length ?? 0
  const found = reports?.length ?? 0

  return (
    <div className="page-content">
      <h1>Denúncias Pendentes</h1>

      {/* Search + actions */}
      <form className='flex items-center justify-start gap-2' onSubmit={e => e.preventDefault()}>
        <input
          type="text"
          className="input flex-1"
          placeholder="Pesquisar"
          aria-label="Pesquisar denúncias"
          value={filterValue}
          onChange={e => setFilterValue(e.target.value)}
        />
      </form>

      {/* Indica que a busca está aplicada e quantos resultados ela trouxe */}
      {search && total > 0 && <p className="text-sm text-gray-600 mt-2" role="status" aria-live="polite">
        {found === 0 ? 'Nenhum resultado' : `Mostrando ${found} de ${total} ${total > 1 ? 'denúncias' : 'denúncia'}`} para “{filterValue.trim()}”.{' '}
        <button type="button" className="underline" onClick={() => setFilterValue('')}>Limpar busca</button>
      </p>}

      <div className="sectionLabel">Denúncias registradas</div>

      {/* List */}
      <section className={`list mt-3  block  ${reports && reports.length > 0 ? "md:grid md:grid-cols-2" : ""}`} aria-label="Denúncias Pendentes">
        {reports && reports.length > 0 ? reports.map(item => <ReportCard key={item.id} report={item} fetchReports={refetch} />)
          : <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {search && total > 0 ? `Nenhuma denúncia encontrada para “${filterValue.trim()}”.` : 'Nenhuma denúncia está pendente de triagem.'}
            </p>
          </div>
        }
      </section>
    </div>
  );
}
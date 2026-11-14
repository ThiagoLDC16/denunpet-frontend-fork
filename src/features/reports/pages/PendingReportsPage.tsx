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



      <div className="sectionLabel">Denúncias registradas</div>

      {/* List */}
      <section className={`list mt-3  block  ${reports && reports.length > 0 ? "md:grid md:grid-cols-2" : ""}`} aria-label="Denúncias Pendentes">
        {reports && reports.length > 0 ? reports.map(item => <ReportCard key={item.id} report={item} fetchReports={refetch} />)
          : <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Nenhuma denúncia está pendente de triagem.</p>
          </div>
        }
      </section>
    </div>
  );
}
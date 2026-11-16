import { useAuth } from '@/features/auth/contexts/AuthContext';
import { CreateReportDialogButton } from '../components/CreateReportDialogButton';
import { ReportCard } from '../components/ReportCard';
import { useMyReports } from '../hooks/useMyReports';
import { UserType } from '@/features/auth/types';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

export function MyReportsPage() {
  const { reports, loading, error, refetch } = useMyReports()
  const { user } = useAuth()
  const [filterValue, setFilterValue] = useState('');

  // Só troca a tela pelo "Carregando" na primeira busca: nas atualizações a lista continua
  // montada, senão o diálogo aberto (detalhes da denúncia) fecharia a cada ação
  if (loading && !reports) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="text-lg">Carregando minhas denúncias...</div>
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
  const filteredReports = reports?.filter((report) => report.description.toLowerCase().includes(search))
  const total = reports?.length ?? 0
  const found = filteredReports?.length ?? 0

  return (
    <div className="page-content">

      <h1>Minhas denúncias</h1>

      {/* Search + actions */}
      <form className='flex items-center justify-start gap-2' onSubmit={e => e.preventDefault()}>
        <input
          type="text"
          className="input flex-1"
          placeholder="Pesquisar"
          aria-label="Pesquisar minhas denúncias"
          value={filterValue}
          onChange={e => setFilterValue(e.target.value)}
        />
      </form>

      {/* Indica que a busca está aplicada e quantos resultados ela trouxe */}
      {search && total > 0 && <p className="text-sm text-gray-600 mt-2" role="status" aria-live="polite">
        {found === 0 ? 'Nenhum resultado' : `Mostrando ${found} de ${total} ${total > 1 ? 'denúncias' : 'denúncia'}`} para “{filterValue.trim()}”.{' '}
        <button type="button" className="underline" onClick={() => setFilterValue('')}>Limpar busca</button>
      </p>}

      <div className="sectionLabel">Minhas denúncias registradas</div>
      {user?.type == UserType.USER && <CreateReportDialogButton fetchReports={refetch} />}

      {/* List */}
      <section className={`list mt-3  block  ${filteredReports && filteredReports.length > 0 ? "md:grid md:grid-cols-2" : ""}`} aria-label="Lista das minhas denúncias">
        {filteredReports && filteredReports.length > 0 ? filteredReports.map(item => <ReportCard key={item.id} report={item} fetchReports={refetch} />)
          : <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {search && total > 0
                ? `Nenhuma denúncia encontrada para “${filterValue.trim()}”.`
                : user?.type == UserType.ONG ? 'Você ainda não assumiu nenhuma denúncia' : 'Você ainda não registrou nenhuma denúncia'}
            </p>
          </div>
        }
      </section>

    </div>
  );
}
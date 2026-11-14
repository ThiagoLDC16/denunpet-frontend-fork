import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, User, FileText, MapPinCheck, Home, Image as ImageIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ReportStatusBadge } from './ReportStatusBadge';
import { ReportStatus, type Report } from '../types/report.types';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/contexts/AuthContext';
import { UserType } from '@/features/auth/types';
import { getApiErrorMessage } from '@/lib/apiError';
import { ACCEPTED_IMAGES, getMidiaUrl } from '../lib/midia';
import { parseLocation } from '../lib/location';

export function ViewReportDetailsDialog({ report, fetchReports }: { report: Report, fetchReports?: () => Promise<void> }) {
  const [statusComment, setStatusComment] = useState('');
  const [statusCommentError, setStatusCommentError] = useState(false);
  const [actionError, setActionError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [triageImages, setTriageImages] = useState<FileList | null>(null);
  const [triageImagesError, setTriageImagesError] = useState(false);
  const [uploadingTriageImages, setUploadingTriageImages] = useState(false);
  const { user } = useAuth();
  if (!report) return null;

  // Só a ONG responsável mexe na denúncia, e só enquanto ela está em triagem/andamento
  const isResponsibleNgo = user?.type === UserType.ONG
    && report.ngoId === user.id
    && (report.status === ReportStatus.UNDER_REVIEW || report.status === ReportStatus.IN_PROGRESS);
  const canAddTriageImages = isResponsibleNgo;

  const reportMidia = report.midia?.filter(item => !item.addedByNgo) ?? [];
  const ngoMidia = report.midia?.filter(item => item.addedByNgo) ?? [];

  const handleAddTriageImages = async () => {
    if (!triageImages || triageImages.length === 0) {
      setTriageImagesError(true);
      return;
    }
    setUploadingTriageImages(true);
    setActionError('');
    try {
      const formData = new FormData();
      Array.from(triageImages).forEach(file => formData.append('midia', file));
      await api.post(`/api/report/${report.id}/midia`, formData)
      setTriageImages(null);
      setTriageImagesError(false);
      if (fetchReports) {
        await fetchReports()
      }
    } catch (error) {
      console.error(error)
      setActionError(getApiErrorMessage(error, 'Não foi possível enviar as imagens. Tente de novo.'))
    } finally {
      setUploadingTriageImages(false);
    }
  }

  const handleProgress = async (type: 'progress' | 'resolved' | 'unresolved') => {
    if (!statusComment.trim()) {
      setStatusCommentError(true);
      return;
    }
    setUpdatingStatus(true);
    setActionError('');
    try {
      const statusTypes = {
        progress: 'IN_PROGRESS',
        resolved: 'RESOLVED',
        unresolved: 'UNRESOLVED',
      }
      await api.put(`/api/report/${report.id}/status`, { statusComment, status: statusTypes[type] })
      setStatusCommentError(false);
      setStatusComment('');
      if (fetchReports) {
        await fetchReports()
      }
    } catch (error) {
      console.error(error)
      setActionError(getApiErrorMessage(error, 'Não foi possível atualizar a denúncia. Tente de novo.'))
    } finally {
      setUpdatingStatus(false);
    }
  }

  const position = parseLocation(report.location);

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        {/* Exigidos pelo Radix para leitores de tela */}
        <DialogTitle className="sr-only">Detalhes da denúncia {report.id}</DialogTitle>
        <DialogDescription className="sr-only">Informações, mídias e andamento da denúncia</DialogDescription>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ReportStatusBadge status={report.status} />
              <span className="text-sm text-gray-500">
                #{report.id.toString().padStart(4, '0')}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {formatDate(report.createdAt)}
            </div>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-6">
        {/* Informações principais */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className='-ml-1'>
              <p className="font-medium text-gray-900"></p>
              {/* Denúncias antigas podem não ter coordenadas válidas: nesse caso mostra o texto */}
              {position
                ? <MapContainer center={position} zoom={13} scrollWheelZoom={true} style={{ height: 300, width: 400, maxWidth: '100%' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={position} />
                </MapContainer>
                : <p className="text-gray-600">{report.location}</p>}

            </div>
          </div>

          {report.address && <div className="flex items-start gap-3">
            <MapPinCheck size={35} className='text-gray-500 mt-0.5' />
            {report.address && <p className='flex'> Endereço: {report.address}</p>}
          </div>}

          {report.houseNumber && <div className="flex items-start gap-3">
            <Home className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Número da casa</p>
              <p className="text-gray-600">{report.houseNumber}</p>
            </div>
          </div>}

          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Data da ocorrência</p>
              <p className="text-gray-600">{formatDate(report.ocurrenceDate)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900">Denunciante</p>
              <p className="text-gray-600 text-sm">{!report.user ? "Anônimo" : report.user?.name || "Carregando..."}</p>
              {/* Contato: a API só envia para a ONG responsável pela denúncia */}
              {report.user?.phone && <p className="text-gray-600 text-sm">Telefone: {report.user.phone}</p>}
              {report.user?.email && <p className="text-gray-600 text-sm">E-mail: {report.user.email}</p>}
            </div>
          </div>
        </div>

        {/* Descrição detalhada */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Descrição detalhada
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">
              {report.details}
            </p>
          </div>
        </div>

        <div>
          <h3 className='text-sm'>Mídias da denúncia</h3>
          <div className='flex gap-2 flex-wrap'>
            {reportMidia.map(item => item.type === "image" ?


              <img key={item.id} src={getMidiaUrl(item.url)} className='h-40 object-cover rounded col-span-1' /> :
              <video controls={true} key={item.id} src={getMidiaUrl(item.url)} className='h-30 object-cover rounded col-span-1' ></video>

            )}
          </div>

        </div>

        {/* Imagens adicionadas pela ONG durante a triagem */}
        {(ngoMidia.length > 0 || canAddTriageImages) && <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Imagens da triagem
          </h4>
          {ngoMidia.length > 0
            ? <div className='flex gap-2 flex-wrap'>
              {ngoMidia.map(item => <img key={item.id} src={getMidiaUrl(item.url)} className='h-40 object-cover rounded col-span-1' />)}
            </div>
            : <p className="text-sm text-gray-500">Nenhuma imagem adicionada pela ONG ainda.</p>}

          {canAddTriageImages && <div className="space-y-1">
            <div className="flex gap-2 items-center">
              <input
                key={triageImages ? 'selected' : 'empty'}
                type="file"
                accept={ACCEPTED_IMAGES}
                multiple
                name="triageImages"
                className="border-2 grow rounded-sm py-1 text-sm"
                onChange={(e) => setTriageImages(e.target.files)}
              />
              <Button variant={'secondary'} onClick={handleAddTriageImages} disabled={uploadingTriageImages}>
                {uploadingTriageImages ? 'Enviando...' : 'Adicionar imagens'}
              </Button>
            </div>
            {triageImagesError && <p className="text-red-600 text-xs text-right">Selecione ao menos uma imagem</p>}
          </div>}
        </div>}

        {/* Andamento da denúncia */}
        {report.statusComment && <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Andamento da denúncia
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">
              {report.statusComment}
            </p>
          </div>
        </div>}

        {/* Motivo da rejeição */}
        {report.rejectReason && <div className="space-y-2">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Motivo da rejeição
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">
              {report.rejectReason}
            </p>
          </div>
        </div>}
      </div>

      {actionError && <p className="text-red-600 text-sm text-right">{actionError}</p>}

      {isResponsibleNgo && <div>
        <label htmlFor="" className='mb-2'>
          Comentário: <input type="text" name="statusComment" value={statusComment} className="border-2 w-full rounded-sm py-1" onChange={(e) => setStatusComment(e.target.value)} />
        </label>
        {statusCommentError && <p className="text-red-600 text-xs text-right">Um comentário é necessário para avançar no status ou concluir a denúncia</p>}
        <div className='flex gap-2 mt-2'>
          <Button variant={'secondary'} disabled={updatingStatus} onClick={() => handleProgress('progress')}>Avançar progresso</Button>
          <Button variant={'destructive'} disabled={updatingStatus} onClick={() => handleProgress('unresolved')}>Concluir sem resolução</Button>
          <Button variant={'secondary'} disabled={updatingStatus} onClick={() => handleProgress('resolved')} className='bg-green-500 grow'>Concluir</Button>
        </div>
      </div >}
    </DialogContent>
  );
}
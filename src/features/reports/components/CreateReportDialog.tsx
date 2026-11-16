import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react'
import { api } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';

import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import type { LeafletEvent } from 'leaflet';
import { ACCEPTED_MIDIA, MAX_FILES_PER_UPLOAD, MAX_FILE_SIZE_MB, validateMidiaFiles, type RejectedFile } from '../lib/midia';
import { RejectedFilesNotice } from './RejectedFilesNotice';

type reportSchemaProps = {
    description: string,
    details: string,
    ocurrenceDate: Date | null
    location: string,
    anonymous: string,
    isHouse: boolean,
    houseNumber: string,
}

// Centro do Brasil: usado quando não dá para obter a localização do usuário
const DEFAULT_CENTER: [number, number] = [-14.235, -51.925];
const DEFAULT_ZOOM = 4;

function LocationPicker({ setCoords }: { setCoords: React.Dispatch<React.SetStateAction<null | number[]>> }) {
    useMapEvents({
        click(e) {
            setCoords([e.latlng.lat, e.latlng.lng]);
        }
    })

    return null
}

export function CreateReportDialog({ setIsOpen, fetchReports }: { setIsOpen: React.Dispatch<React.SetStateAction<boolean>>, fetchReports: () => Promise<void> }) {
    const { register, handleSubmit, watch } = useForm<reportSchemaProps>()
    const isHouse = watch("isHouse")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    // Os avisos de itens obrigatórios só aparecem depois da primeira tentativa de envio
    const [submitted, setSubmitted] = useState(false);
    const [coords, setCoords] = useState<null | number[]>(null);
    // 'pending' enquanto o navegador não responde; 'unavailable' se o usuário negar ou não houver suporte
    const [geoStatus, setGeoStatus] = useState<'pending' | 'ok' | 'unavailable'>('pending');
    const [address, setAddress] = useState('');
    // Arquivos acumulados entre seleções (o input de arquivo substitui a seleção anterior a cada abertura)
    const [files, setFiles] = useState<File[]>([]);
    const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);
    const [previews, setPreviews] = useState<{ url: string, type: 'image' | 'video', file: File }[]>([]);

    const hasImage = files.some(file => file.type === 'image/jpeg' || file.type === 'image/png');
    const hasVideo = files.some(file => file.type === 'video/mp4');
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const next = files
            .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
            .map(file => ({ url: URL.createObjectURL(file), type: file.type.startsWith('image/') ? 'image' as const : 'video' as const, file }));
        setPreviews(next);
        return () => next.forEach(preview => URL.revokeObjectURL(preview.url));
    }, [files])

    useEffect(() => {
        // Sem suporte (ou página aberta sem HTTPS fora do localhost): o local é escolhido no mapa
        if (!navigator.geolocation) {
            setGeoStatus('unavailable');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            position => {
                // Não sobrescreve um local que o usuário já tenha marcado no mapa
                setCoords(prev => prev ?? [position.coords.latitude, position.coords.longitude]);
                setGeoStatus('ok');
            },
            () => setGeoStatus('unavailable'),
            { timeout: 10000 }
        )
    }, [])

    useEffect(() => {
        if (!coords) return;

        const controller = new AbortController();

        async function getAddress(lat: number, lon: number) {
            try {
                // fetch puro de propósito: o cliente `api` anexa o token JWT em toda requisição
                // e ele não pode ser enviado para um serviço de terceiros
                const params = new URLSearchParams({ format: 'jsonv2', lat: String(lat), lon: String(lon), layer: 'address' });
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal: controller.signal });
                if (!response.ok) throw new Error(`Nominatim respondeu ${response.status}`);

                const data = await response.json();
                setAddress(data.display_name ?? '');
            } catch (err) {
                if (controller.signal.aborted) return;
                // O endereço é só um complemento: a denúncia segue com as coordenadas
                console.error('Erro ao buscar o endereço:', err);
                setAddress('');
            }
        }

        getAddress(coords[0], coords[1]);

        return () => controller.abort();
    }, [coords])

    async function handleCreateReport(data: reportSchemaProps) {
        setSubmitted(true)
        setError('')

        if (!hasImage || !hasVideo || !coords) return;
        if (!data.ocurrenceDate || Number.isNaN(new Date(data.ocurrenceDate).getTime())) {
            setError('Informe a data de ocorrência.');
            return;
        }

        const formData = new FormData()
        formData.append("description", data.description)
        formData.append("details", data.details)
        formData.append("ocurrenceDate", new Date(data.ocurrenceDate).toISOString())
        // O autor não é enviado: o backend usa o usuário do token
        formData.append("anonymous", String(data.anonymous))
        formData.append("location", coords.join(', '));
        formData.append("address", address);
        if (data.isHouse && data.houseNumber) formData.append("houseNumber", data.houseNumber);

        files.forEach(file => formData.append("midia", file))

        try {
            setLoading(true)
            await api.post("/api/report/register", formData)
            setIsOpen(false);
            await fetchReports();
        } catch (err) {
            console.error(err)
            setError(getApiErrorMessage(err, 'Não foi possível enviar a denúncia. Tente de novo.'))
        } finally {
            setLoading(false)
        }
    }

    const mapCenter: [number, number] = coords ? [coords[0], coords[1]] : DEFAULT_CENTER;

    return (
        <DialogContent>
            <DialogHeader className="text-left">
                <DialogTitle>Nova denúncia</DialogTitle>
                <DialogDescription>Registre uma nova denúncia</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleCreateReport)} className="space y-6">
                <div className="grid grid-cols-4">
                    <Label htmlFor="description">Descrição</Label>
                    <Input className="col-span-3" {...register('description')} id='description' required maxLength={500} placeholder='Descreve o acontecimento' />
                </div>

                <div className="pt-4 grid grid-cols-4">
                    <Label htmlFor="details">Detalhes</Label>
                    <Input className="col-span-3" id="details" {...register('details')} required maxLength={5000} placeholder='Foque nos detalhes específicos' />
                </div>

                <div className="pt-4 grid grid-cols-4">
                    <Label htmlFor="ocurrenceDate">Data de ocorrência</Label>
                    <input className="col-span-3" type="date" id="ocurrenceDate" required max={today} {...register("ocurrenceDate", { valueAsDate: true })} />
                </div>

                <div className='pt-4 grid grid-cols-1'>
                    {geoStatus === 'pending' && !coords
                        ? <p className='text-sm text-gray-500'>Obtendo sua localização...</p>
                        // A key recria o mapa quando a localização chega: o centro do MapContainer só vale na montagem
                        : <MapContainer key={geoStatus} center={mapCenter} zoom={coords ? 13 : DEFAULT_ZOOM} scrollWheelZoom={true} style={{ height: 300 }}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {coords && <Marker position={[coords[0], coords[1]]} draggable={true} eventHandlers={{
                                dragend(e: LeafletEvent) {
                                    const { lat, lng } = e.target.getLatLng();
                                    setCoords([lat, lng]);
                                }
                            }} />}
                            <LocationPicker setCoords={setCoords} />
                        </MapContainer>}
                    {geoStatus === 'unavailable' && !coords && <p className='text-xs text-gray-500 mt-1'>Não foi possível obter sua localização. Clique no mapa para marcar o local da denúncia.</p>}
                    {coords && <p className='text-xs text-gray-500 mt-1'>Clique no mapa ou arraste o marcador para alterar a localização</p>}
                    {address && <p>Endereço: {address}</p>}
                </div>

                {submitted && !coords && <p className='text-right text-l mt-1 text-red-600'>Localização é obrigatória</p>}

                <label htmlFor="isHouse" className='pt-4 flex items-center gap-2'>
                    <input type='checkbox' id="isHouse" {...register("isHouse")} /> O local é uma casa?
                </label>

                {isHouse && <div className="pt-4 grid grid-cols-4">
                    <Label htmlFor="houseNumber">Número da casa</Label>
                    <Input className="col-span-3" id="houseNumber" {...register('houseNumber')} maxLength={20} placeholder='Ex.: 123' />
                </div>}

                <div className="pt-4 grid grid-cols-4">
                    <Label htmlFor="midia">Fotos/vídeos</Label>
                    <Input className="col-span-3" id="midia" multiple type="file" accept={ACCEPTED_MIDIA} aria-describedby="midia-hint" disabled={loading} onChange={(e) => {
                        const selected = Array.from(e.target.files ?? []);
                        // Formato, tamanho e quantidade são conferidos antes do envio, com o motivo de cada recusa
                        const { accepted, rejected } = validateMidiaFiles(selected, { maxSizeMb: MAX_FILE_SIZE_MB, alreadySelected: files.length });
                        setRejectedFiles(rejected);
                        setFiles(prev => [...prev, ...accepted]);
                        // Limpa o input para permitir abrir de novo (inclusive escolhendo o mesmo arquivo)
                        e.target.value = '';
                    }} />
                </div>

                <p id="midia-hint" className='text-xs text-gray-500 mt-1 text-right'>
                    Fotos (.jpg, .png, .webp, .gif) e vídeos (.mp4, .webm, .mov), até {MAX_FILE_SIZE_MB} MB cada, no máximo {MAX_FILES_PER_UPLOAD} arquivos por envio
                </p>

                <RejectedFilesNotice files={rejectedFiles} />

                {files.length > 0 && <p className='text-xs text-gray-500 mt-1 text-right'>
                    {files.length} {files.length > 1 ? 'arquivos selecionados' : 'arquivo selecionado'}
                </p>}

                {previews.length > 0 && <div className='pt-4 flex gap-2 flex-wrap'>
                    {previews.map(preview => <div key={preview.url} className='relative'>
                        {preview.type === 'image' ?
                            <img src={preview.url} className='h-24 object-cover rounded' /> :
                            <video controls={true} src={preview.url} className='h-24 object-cover rounded'></video>}
                        <button
                            type="button"
                            aria-label="Remover arquivo"
                            className='absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-5'
                            onClick={() => setFiles(prev => prev.filter(file => file !== preview.file))}
                        >×</button>
                    </div>)}
                </div>}

                {submitted && !hasImage && <p className='text-right text-l mt-1 text-red-600'>Precisa de pelo menos uma foto (.jpg ou .png)</p>}
                {submitted && !hasVideo && <p className='text-right text-l mt-1 text-red-600'>Precisa de pelo menos um vídeo (.mp4)</p>}
                {submitted && (!hasImage || !hasVideo || !coords) && <p className='text-right text-sm mt-2 text-red-600 font-medium'>Não foi possível enviar: corrija os itens acima.</p>}
                {error && <p className='text-right text-sm mt-2 text-red-600 font-medium'>{error}</p>}
                {loading && <p className='text-right text-xl my-3 text-blue-500'>Carregando...</p>}

                <label htmlFor="anonymous" className='flex items-center gap-2 justify-end'>
                    <input type='checkbox' id="anonymous" value={'true'} {...register("anonymous")} /> Denúncia anônima?
                </label>

                <DialogFooter className="flex-row justify-end mt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="destructive" className="px-6">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" variant="default" className="px-8" disabled={loading}>Enviar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}

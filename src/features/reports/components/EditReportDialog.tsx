import { Controller, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react'
import { api } from '@/lib/api';

import { Button } from "@/components/ui/button";
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/features/auth/contexts/AuthContext';
import type { User } from '@/features/auth/types';
import type { Report } from '../types/report.types';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';



type reportSchemaProps = {
    description: string,
    details: string,
    ocurrenceDate: string
    location: string,
    isHouse: boolean,
    houseNumber: string,
    user?: User
}

export function EditReportDialog({ report, setIsOpen, fetchReports }: { report: Report, setIsOpen: React.Dispatch<React.SetStateAction<boolean>>, fetchReports?: () => Promise<void> }) {



    const { register, control, handleSubmit, watch } = useForm<reportSchemaProps>({
        defaultValues: {
            description: report.description,
            details: report.details,
            ocurrenceDate: new Date(report.ocurrenceDate).toISOString().split("T")[0],
            location: report.location,
            isHouse: !!report.houseNumber,
            houseNumber: report.houseNumber ?? '',

        }
    })
    const isHouse = watch("isHouse")
    const [loading, setLoading] = useState(false)
    const [display, setDisplay] = useState(false);
    // Mídias existentes marcadas para remoção e arquivos novos acumulados entre seleções
    const [removedMidiaIds, setRemovedMidiaIds] = useState<number[]>([]);
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<{ url: string, type: 'image' | 'video', file: File }[]>([]);
    const { user } = useAuth()

    const currentMidia = report.midia?.filter(item => !item.addedByNgo && !removedMidiaIds.includes(item.id)) ?? [];

    useEffect(() => {
        const next = files
            .filter(file => file.type.startsWith('image/') || file.type.startsWith('video/'))
            .map(file => ({ url: URL.createObjectURL(file), type: file.type.startsWith('image/') ? 'image' as const : 'video' as const, file }));
        setPreviews(next);
        return () => next.forEach(preview => URL.revokeObjectURL(preview.url));
    }, [files])


    async function handleEditReport(data: reportSchemaProps) {
        const formData = new FormData()
        formData.append("description", data.description)
        formData.append("details", data.details)
        formData.append("ocurrenceDate", new Date(data.ocurrenceDate).toISOString())
        formData.append("location", report.location);
        formData.append("address", report.address ?? '');
        if (data.isHouse && data.houseNumber) formData.append("houseNumber", data.houseNumber);

        files.forEach(file => formData.append("midia", file))
        if (removedMidiaIds.length) formData.append("removedMidia", JSON.stringify(removedMidiaIds))


        if (user) formData.append("user", JSON.stringify(user))


        try {
            setLoading(true);
            await api.put(`/api/report/${report.id}`, formData)
            setLoading(false)
            setDisplay(true);
            setIsOpen(false);
            if (fetchReports) {
                await fetchReports();
            }
        } catch (error) {
            console.log(error)
        }

    }

    const [lat, long] = report.location.split(', ')

    return (
        <DialogContent>
            <DialogHeader className="text-left">
                <DialogTitle>Editar denúncia {report.id}</DialogTitle>
                <DialogDescription>Editar denúncia</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleEditReport)} className="space y-6">
                <div className="grid grid-cols-4">
                    <Label htmlFor="descriptioon">Descrição</Label>
                    <Input className="col-span-3" {...register('description')} id='description' placeholder='Descreve o acontecimento' />
                </div>

                <div className="pt-4 grid grid-cols-4">
                    <Label htmlFor="details">Detalhes</Label>
                    <Input className="col-span-3" id="details" {...register('details')} placeholder='Foque nos detalhes específicos' />
                </div>

                <div className="pt-4 grid grid-cols-4">
                    <Label htmlFor="ocurrenceDate">Data de ocorrência</Label>
                    <Controller
                        name="ocurrenceDate"
                        control={control}
                        defaultValue={new Date(report.ocurrenceDate).toISOString().split("T")[0]}
                        render={({ field }) => (
                            <input
                                type="date"
                                id="occurrenceDate"
                                className="col-span-3"
                                value={field.value ?? ""}
                                onChange={field.onChange}
                            />
                        )}
                    />

                </div>

                <div className="pt-4 grid grid-cols-1">
                    {(<MapContainer center={[Number(lat), Number(long)]} zoom={13} scrollWheelZoom={true} style={{ height: 300 }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[Number(lat), Number(long)]}>
                            <Popup>
                                A pretty CSS3 popup. <br /> Easily customizable.
                            </Popup>
                        </Marker>
                    </MapContainer>)}
                    {report.address && <p>Endereço: {report.address}</p>}
                </div>

                <label htmlFor="isHouse" className='pt-4 flex items-center gap-2'>
                    <input type='checkbox' id="isHouse" {...register("isHouse")} /> O local é uma casa?
                </label>

                {isHouse && <div className="pt-4 grid grid-cols-4">
                    <Label htmlFor="houseNumber">Número da casa</Label>
                    <Input className="col-span-3" id="houseNumber" {...register('houseNumber')} placeholder='Ex.: 123' />
                </div>}

                <div className="pt-4 grid grid-cols-4">
                    <Label htmlFor="midia">Fotos/vídeos</Label>
                    <Input className="col-span-3" id="midia" multiple type="file" onChange={(e) => {
                        const selected = Array.from(e.target.files ?? []);
                        setFiles(prev => [...prev, ...selected]);
                        // Limpa o input para permitir abrir de novo (inclusive escolhendo o mesmo arquivo)
                        e.target.value = '';
                    }} />
                </div>

                {previews.length > 0 && <div className='pt-4'>
                    <h3 className='text-sm'>Novas mídias</h3>
                    <div className='flex gap-2 flex-wrap'>
                        {previews.map(preview => <div key={preview.url} className='relative'>
                            {preview.type === 'image' ?
                                <img src={preview.url} className='h-24 object-cover rounded' /> :
                                <video controls={true} src={preview.url} className='h-24 object-cover rounded'></video>}
                            <button
                                type="button"
                                aria-label="Remover arquivo novo"
                                className='absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-5'
                                onClick={() => setFiles(prev => prev.filter(file => file !== preview.file))}
                            >×</button>
                        </div>)}
                    </div>
                </div>}

                <div className='pt-4'>
                    {!display && <h3 className='text-sm'>Mídias da denúncia</h3>}
                    <div className='flex gap-2 flex-wrap'>
                        {!display && currentMidia.map(item => <div key={item.id} className='relative'>
                            {item.type === "image" ?
                                <img src={`${import.meta.env.VITE_API_URL}${item.url}`} className='h-40 object-cover rounded col-span-1' /> :
                                <video controls={true} src={`${import.meta.env.VITE_API_URL}${item.url}`} className='h-30 object-cover rounded col-span-1' ></video>}
                            <button
                                type="button"
                                aria-label="Remover mídia"
                                className='absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 text-xs leading-5'
                                onClick={() => setRemovedMidiaIds(prev => [...prev, item.id])}
                            >×</button>
                        </div>)}
                    </div>
                    {removedMidiaIds.length > 0 && <p className='text-xs text-gray-500 mt-1'>
                        {removedMidiaIds.length} {removedMidiaIds.length > 1 ? 'mídias serão removidas' : 'mídia será removida'} ao enviar.{' '}
                        <button type="button" className='underline' onClick={() => setRemovedMidiaIds([])}>Desfazer</button>
                    </p>}
                </div>

                {loading && <p className='text-right text-xl my-3 text-blue-500'>Carregando...</p>}

                <DialogFooter className="flex-row justify-end mt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="destructive" className="px-6">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" variant="default" className="px-8">Enviar</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    )
}
import { getImageUrl } from "@/lib/getImageURL";

// Mesma lista aceita pelo backend (backend/src/middlewares/multer.ts)
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

export const ACCEPTED_IMAGES = IMAGE_EXTENSIONS.join(',');
export const ACCEPTED_MIDIA = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].join(',');

// Mesmos limites do backend
export const MAX_FILES_PER_UPLOAD = 10;
export const MAX_FILE_SIZE_MB = 50;
export const MAX_TRIAGE_IMAGE_SIZE_MB = 10;

function hasExtension(file: File, extensions: string[]) {
    const name = file.name.toLowerCase();
    return extensions.some(extension => name.endsWith(extension));
}

export const isImageFile = (file: File) => hasExtension(file, IMAGE_EXTENSIONS);
export const isVideoFile = (file: File) => hasExtension(file, VIDEO_EXTENSIONS);
export const isAcceptedMidia = (file: File) => isImageFile(file) || isVideoFile(file);

export function getMidiaUrl(url: string) {
    return getImageUrl(url) ?? '';
}

export interface RejectedFile {
    name: string
    reason: string
}

type ValidateOptions = {
    // true na triagem da ONG, que só aceita imagens
    onlyImages?: boolean
    maxSizeMb: number
    // Quantos arquivos já estão selecionados (para o limite por envio)
    alreadySelected?: number
}

// Separa os arquivos escolhidos entre aceitos e recusados, com o motivo de cada recusa.
// O backend faz as mesmas checagens, mas recusa a requisição inteira; aqui o usuário é avisado antes de enviar.
export function validateMidiaFiles(selected: File[], { onlyImages = false, maxSizeMb, alreadySelected = 0 }: ValidateOptions) {
    const accepted: File[] = [];
    const rejected: RejectedFile[] = [];
    const formats = onlyImages
        ? 'envie imagem .jpg, .png, .webp ou .gif'
        : 'envie foto .jpg, .png, .webp, .gif ou vídeo .mp4, .webm, .mov';

    selected.forEach(file => {
        const validType = onlyImages ? isImageFile(file) : isAcceptedMidia(file);

        if (!validType) {
            rejected.push({ name: file.name, reason: `formato não aceito (${formats})` });
        } else if (file.size > maxSizeMb * 1024 * 1024) {
            rejected.push({ name: file.name, reason: `maior que ${maxSizeMb} MB` });
        } else if (alreadySelected + accepted.length >= MAX_FILES_PER_UPLOAD) {
            rejected.push({ name: file.name, reason: `limite de ${MAX_FILES_PER_UPLOAD} arquivos por envio` });
        } else {
            accepted.push(file);
        }
    });

    return { accepted, rejected };
}

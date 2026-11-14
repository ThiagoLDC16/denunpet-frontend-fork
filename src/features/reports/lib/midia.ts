import { getImageUrl } from "@/lib/getImageURL";

// Mesma lista aceita pelo backend (backend/src/middlewares/multer.ts)
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov'];

export const ACCEPTED_IMAGES = IMAGE_EXTENSIONS.join(',');
export const ACCEPTED_MIDIA = [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS].join(',');

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

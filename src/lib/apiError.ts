import { isAxiosError } from "axios";

// Códigos de erro devolvidos pela API -> mensagem para o usuário
const MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: 'Usuário ou senha incorretos.',
    EMAIL_ALREADY_REGISTERED: 'Esse e-mail já foi utilizado em outro cadastro.',
    CPF_ALREADY_REGISTERED: 'Esse CPF já foi utilizado em outro cadastro.',
    CNPJ_ALREADY_REGISTERED: 'Esse CNPJ já foi utilizado em outro cadastro.',
    VALIDATION_ERROR: 'Alguns campos estão inválidos. Confira os dados e tente de novo.',
    TOO_MANY_REQUESTS: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    INVALID_FILE_TYPE: 'Tipo de arquivo não permitido. Envie fotos (.jpg, .png, .webp, .gif) ou vídeos (.mp4, .webm, .mov).',
    INVALID_FILE_CONTENT: 'Um dos arquivos não é uma foto ou vídeo válido (o conteúdo não bate com a extensão).',
    FILE_TOO_LARGE: 'Arquivo grande demais. O limite é 50 MB por arquivo (10 MB para as imagens da triagem).',
    TOO_MANY_FILES: 'Envie no máximo 10 arquivos por vez.',
    IMAGE_AND_VIDEO_REQUIRED: 'A denúncia precisa de pelo menos uma foto e um vídeo.',
    NO_FILES: 'Selecione ao menos uma imagem.',
    INVALID_LOCATION: 'Localização inválida.',
    FORBIDDEN: 'Você não tem permissão para fazer isso.',
    NOT_FOUND: 'Denúncia não encontrada.',
    REPORT_NOT_FOUND: 'Denúncia não encontrada.',
    REPORT_STATUS_NEED_BE_PENDING: 'Essa denúncia não está mais pendente. Atualize a página.',
    REPORT_STATUS_NEED_BE_UNDER_REVIEW_OR_IN_PROGRESS: 'Essa denúncia não está mais em triagem ou em andamento.',
}

export function getApiErrorMessage(error: unknown, fallback = 'Ocorreu um erro. Tente de novo.'): string {
    if (!isAxiosError(error)) return fallback;
    if (!error.response) return 'Não foi possível conectar ao servidor.';

    const code = error.response.data?.code;
    return (typeof code === 'string' && MESSAGES[code]) || fallback;
}

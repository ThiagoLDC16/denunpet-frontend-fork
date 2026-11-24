export interface Midia {
    id: number
    type: string
    extension: string
    url: string
    addedByNgo: boolean
    reportId: number
}

// A API só devolve id e nome dos usuários ligados à denúncia.
// Telefone e e-mail do denunciante vêm apenas para a ONG responsável pela denúncia.
export interface ReportUser {
    id: number
    name: string
    email?: string
    phone?: string | null
}

export interface Report {
    id: number
    description: string
    details: string
    ocurrenceDate: Date,
    updatedAt: Date
    createdAt: Date
    midia: Midia[]
    location: string
    address: string | null
    houseNumber: string | null
    status: ReportStatus
    statusComment: string | null
    // null quando a denúncia é anônima
    userId: number | null
    ngoId: number | null
    rejectReason: string | null
    user: ReportUser | null
    ngo: ReportUser | null
}

export const ReportStatus = {
    PENDING: "PENDING",
    UNDER_REVIEW: "UNDER_REVIEW",
    REJECTED: "REJECTED",
    IN_PROGRESS: "IN_PROGRESS",
    RESOLVED: "RESOLVED",
    UNRESOLVED: "UNRESOLVED"
} as const;

export type ReportStatus = typeof ReportStatus[keyof typeof ReportStatus];

// Filtros aceitos por GET /api/report/my
export interface ReportFilters {
  status?: ReportStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

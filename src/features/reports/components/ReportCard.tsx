import { ReportStatus, type Report } from "../types/report.types"
import { EditReportDialogButton } from "./EditReportDialogButton";
import { DeleteButton } from "./DeleteButton";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { UserType } from "@/features/auth/types";
import { SendReportToReviewDialogButton } from "./SendReportToReviewDialogButton";
import { ViewReportButton } from "./ViewReportButton";

// Texto e etapa (0 a 3) da barra de progresso para cada status
const STATUS_INFO: Record<ReportStatus, { message: string, step: number }> = {
    [ReportStatus.PENDING]: { message: "Pendente", step: 0 },
    [ReportStatus.REJECTED]: { message: "Rejeitado", step: 0 },
    [ReportStatus.UNDER_REVIEW]: { message: "Em Triagem", step: 1 },
    [ReportStatus.IN_PROGRESS]: { message: "Em progresso", step: 2 },
    [ReportStatus.RESOLVED]: { message: "Resolvido", step: 3 },
    [ReportStatus.UNRESOLVED]: { message: "Não resolvido", step: 3 },
}

export const ReportCard = ({ report, fetchReports }: { report: Report, fetchReports?: () => Promise<void> }) => {
    const { user } = useAuth();

    const { message: statusMessage, step: count } = STATUS_INFO[report.status] ?? { message: "Desconhecido", step: 0 };

    // Mesmas regras do backend: só o denunciante edita e exclui, e só enquanto
    // a denúncia está pendente ou rejeitada (antes de uma ONG assumir)
    const isOwner = user?.type === UserType.USER && report.userId === user.id;
    const canEdit = isOwner && (report.status === ReportStatus.PENDING || report.status === ReportStatus.REJECTED);
    const canDelete = canEdit;
    const canReview = user?.type === UserType.ONG && report.status === ReportStatus.PENDING;

    return (<div className="report-card">
        <div className="report-card-header">
            <div className="report-card-heading">
                <h3>Denúncia nº <span>{report.id}</span></h3>
                <p className="report-card-description">{report.description}</p>
            </div>


            <div className="report-card-actions">
                <ViewReportButton report={report} fetchReports={fetchReports} />
                {canEdit && <EditReportDialogButton report={report} fetchReports={fetchReports} />}
                {canDelete && <DeleteButton id={report.id} fetchReports={fetchReports} />}
                {canReview && <SendReportToReviewDialogButton id={report.id} fetchReports={fetchReports} />}
            </div>
        </div>


        <p className="report-status-line">Status: <strong>{statusMessage}</strong></p>

        <div className="report-progress" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => <span key={index} className={`report-progress-segment ${index + 1 <= count && count != 0 ? "is-active" : ""}`} />)}
        </div>
        <p className="report-media">{report.midia.length} {report.midia.length > 1 ? "mídias" : "mídia"}</p>

    </div>)
}

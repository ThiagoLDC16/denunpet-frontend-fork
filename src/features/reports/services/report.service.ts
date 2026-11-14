import { api } from '@/lib/api';
import type { Report, ReportFilters } from '../types/report.types';

export const reportService = {

  async getMyReports(filters?: ReportFilters): Promise<Report[] | null> {
    const response = await api.get("/api/report/my", { params: filters })
    return response.data.reports
  },

  async getPendingReports(): Promise<Report[] | null> {
    const response = await api.get("/api/report/pending")
    return response.data.reports
  },

  async getReportById(id: number): Promise<Report> {
    const response = await api.get(`/api/report/${id}`);
    return response.data;
  },

}

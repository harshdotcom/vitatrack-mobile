import { api } from '../api/axios';
import { ENDPOINTS } from '../api/endpoints';
import type {
  CalendarResponse,
  CreateDocumentPayload,
  DocumentAnalysis,
  DocumentDetails,
  FileUrlResponse,
  UploadedFileResponse,
} from '../types/dashboard.types';

interface UploadAsset {
  uri: string;
  name: string;
  type: string;
}

export const dashboardService = {
  getMonthlyReports: async (month: number, year: number): Promise<CalendarResponse> => {
    const { data } = await api.post<CalendarResponse>(ENDPOINTS.DOCUMENTS_CALENDAR, {
      month,
      year,
    });
    return data;
  },

  uploadFile: async (
    asset: UploadAsset,
    fileType = 'lab_report',
  ): Promise<UploadedFileResponse> => {
    const form = new FormData();
    form.append('files', asset as unknown as Blob);
    form.append('file_type', fileType);

    const { data } = await api.post<UploadedFileResponse>(ENDPOINTS.FILES_UPLOAD, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return data;
  },

  submitDocument: async (payload: CreateDocumentPayload) => {
    const { data } = await api.post(ENDPOINTS.DOCUMENTS, payload);
    return data;
  },

  getDocumentDetails: async (id: string): Promise<DocumentDetails> => {
    const { data } = await api.get<DocumentDetails>(ENDPOINTS.document(id));
    return data;
  },

  getFileUrl: async (id: string): Promise<FileUrlResponse> => {
    const { data } = await api.get<FileUrlResponse>(ENDPOINTS.file(id));
    return data;
  },

  getAiAnalysis: async (id: string): Promise<DocumentAnalysis> => {
    const { data } = await api.get<{ json?: DocumentAnalysis } | DocumentAnalysis>(
      ENDPOINTS.fileAnalysis(id),
    );
    if (data && typeof data === 'object' && 'json' in data && data.json) {
      return data.json;
    }

    return data as DocumentAnalysis;
  },
};

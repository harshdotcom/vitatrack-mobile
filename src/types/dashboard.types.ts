export interface DashboardEntry {
  id: string;
  entry_type: 'document' | 'direct_entry';
  category: string;
  document_name: string;
  status: string;
  document_date: string;
  analysis_generated: boolean;
  metric_type?: string;
  metric_label?: string;
  metric_summary?: string;
  timestamp?: string;
  tags?: string | string[];
}

export interface CalendarDayPayload {
  count: number;
  documents: DashboardEntry[];
}

export interface CalendarResponse {
  month: number;
  year: number;
  days: Record<string, CalendarDayPayload>;
}

export interface UserUsage {
  user_id?: number;
  TotalStorageUsed?: number;
  total_storage_used?: number;
}

export interface AICreditUsage {
  usedCredit: number;
  leftCredit: number;
  totalCredit: number;
  renewDate: string;
}

export interface UploadedFileItem {
  file_id: string;
  original_name: string;
}

export interface UploadedFileResponse {
  files: UploadedFileItem[];
}

export interface CreateDocumentPayload {
  file_id: string;
  category: string;
  document_name: string;
  tags: string[];
  document_date: string;
}

export interface DocumentDetails {
  id: string;
  file_id?: string;
  category: string;
  document_name: string;
  tags?: string | string[];
  status?: string;
  document_date?: string;
  analysis_generated?: boolean;
  file_type?: string;
  file?: {
    id?: string;
    original_name?: string;
    mime_type?: string;
  };
}

export interface FileUrlResponse {
  url: string;
}

export interface AnalysisMetric {
  test_name: string;
  value: string;
  unit: string;
  reference_range: string;
  status: 'Normal' | 'High' | 'Low' | string;
}

export interface AnalysisRecommendations {
  diet?: string[];
  lifestyle?: string[];
}

export interface AnalysisReportMetadata {
  document_date?: string;
  document_name?: string;
  report_type?: string;
  hospital_or_lab_name?: string;
}

export interface DocumentAnalysis {
  report_metadata?: AnalysisReportMetadata;
  metrics?: AnalysisMetric[];
  abnormal_findings?: string[];
  simple_explanation?: string;
  overall_risk_level?: string;
  recommendations?: AnalysisRecommendations;
  follow_up_suggestions?: string[];
}

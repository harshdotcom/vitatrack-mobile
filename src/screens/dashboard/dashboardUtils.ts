import type { CalendarResponse, DashboardEntry } from '../../types/dashboard.types';

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getCalendarGrid(baseDate: Date) {
  const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const gridStart = new Date(startOfMonth);
  gridStart.setDate(startOfMonth.getDate() - startOfMonth.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export function normalizeEntry(entry: DashboardEntry): DashboardEntry {
  return {
    id: entry.id,
    entry_type: entry.entry_type === 'direct_entry' ? 'direct_entry' : 'document',
    category: entry.category || 'Document',
    document_name: entry.document_name || entry.metric_label || 'Untitled',
    status: entry.status || 'uploaded',
    document_date: entry.document_date || entry.timestamp || '',
    analysis_generated: Boolean(entry.analysis_generated),
    metric_type: entry.metric_type,
    metric_label: entry.metric_label,
    metric_summary: entry.metric_summary,
    timestamp: entry.timestamp,
    tags: entry.tags,
  };
}

export function getEntryTitle(entry: DashboardEntry) {
  return entry.entry_type === 'direct_entry'
    ? entry.metric_label || entry.document_name || 'Direct Entry'
    : entry.document_name || 'Document';
}

export function getEntrySummary(entry: DashboardEntry) {
  return entry.entry_type === 'direct_entry'
    ? entry.metric_summary || 'Logged directly in VitaTrack'
    : entry.category || 'Document';
}

export function getEntryTime(entry: DashboardEntry) {
  const raw = entry.timestamp || entry.document_date;
  if (!raw) {
    return '';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function safeIsoDate(value: Date = new Date()) {
  return value.toISOString().split('T')[0];
}

export function getEntrySortTime(entry: DashboardEntry) {
  const raw = entry.timestamp || entry.document_date;
  const parsed = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function flattenCalendarResponse(response: CalendarResponse): DashboardEntry[] {
  return Object.values(response.days ?? {})
    .flatMap((payload) => (payload.documents ?? []).map(normalizeEntry))
    .sort((left, right) => getEntrySortTime(right) - getEntrySortTime(left));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseUnknownJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function pickTimelineEntries(source: unknown): unknown[] {
  if (Array.isArray(source)) {
    return source;
  }

  if (!isRecord(source)) {
    return [];
  }

  if (Array.isArray(source.documents)) {
    return source.documents;
  }

  if (Array.isArray(source.data)) {
    return source.data;
  }

  if (isRecord(source.data) && Array.isArray(source.data.documents)) {
    return source.data.documents;
  }

  return [];
}

function pickTimelineCursor(source: unknown): string {
  if (!isRecord(source)) {
    return '';
  }

  if (typeof source.cursor === 'string') {
    return source.cursor;
  }

  if (isRecord(source.data) && typeof source.data.cursor === 'string') {
    return source.data.cursor;
  }

  return '';
}

export function extractTimelinePayload(response: unknown) {
  const parsedResponse = parseUnknownJson(response);
  const entries = pickTimelineEntries(parsedResponse)
    .map((entry) => normalizeEntry(entry as DashboardEntry))
    .sort((left, right) => getEntrySortTime(right) - getEntrySortTime(left));

  return {
    entries,
    cursor: pickTimelineCursor(parsedResponse),
  };
}

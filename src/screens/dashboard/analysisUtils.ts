import { useAppTheme } from '../../hooks/useAppTheme';
import type { AnalysisMetric } from '../../types/dashboard.types';

export function getRiskTone(
  riskLevel: string | undefined,
  isDark: boolean,
  colors: ReturnType<typeof useAppTheme>['colors'],
) {
  const normalized = riskLevel?.toLowerCase();

  if (normalized === 'low') {
    return {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : 'rgba(22, 163, 74, 0.10)',
      textColor: colors.successText,
    };
  }

  if (normalized === 'moderate') {
    return {
      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(217, 119, 6, 0.10)',
      textColor: colors.warningText,
    };
  }

  if (normalized === 'high' || normalized === 'critical') {
    return {
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(220, 38, 38, 0.10)',
      textColor: colors.errorText,
    };
  }

  return {
    backgroundColor: colors.surfaceSubtle,
    textColor: colors.textMuted,
  };
}

export function groupMetrics(metrics: AnalysisMetric[] = []) {
  const liverTests = new Set([
    'Serum Bilirubin Total',
    'Serum Bilirubin Direct',
    'Serum Bilirubin Indirect',
    'ALT (SGPT)',
    'AST (SGOT)',
    'Alkaline Phosphatase',
    'Serum Protein Total',
    'Serum Albumin',
    'Serum Globulin',
    'A:G Ratio',
  ]);
  const kidneyTests = new Set([
    'Blood Urea',
    'Blood Urea Nitrogen (BUN)',
    'Serum Creatinine',
    'Serum Uric Acid',
  ]);
  const electrolytes = new Set([
    'Serum Sodium',
    'Serum Potassium',
    'Serum Chloride',
  ]);
  const cbc = new Set([
    'WBC Count',
    'Platelet Count',
    'RBC Count',
    'Hemoglobin',
    'Hematocrit (PCV)',
    'MCV',
    'MCH',
    'MCHC',
    'Neutrophils',
    'Lymphocytes',
    'Eosinophils',
    'Monocytes',
    'Basophils',
    'ESR (First Hour)',
    'Malaria Parasite',
  ]);

  const configs = [
    { label: 'Liver Function', keys: liverTests },
    { label: 'Kidney Function', keys: kidneyTests },
    { label: 'Electrolytes', keys: electrolytes },
    { label: 'CBC', keys: cbc },
  ];

  const matched = new Set<string>();
  const groups = configs
    .map((config) => {
      const items = metrics.filter((metric) => config.keys.has(metric.test_name));
      items.forEach((metric) => matched.add(metric.test_name));
      return { label: config.label, metrics: items };
    })
    .filter((group) => group.metrics.length > 0);

  const otherMetrics = metrics.filter((metric) => !matched.has(metric.test_name));
  if (otherMetrics.length > 0) {
    groups.push({ label: 'Other Tests', metrics: otherMetrics });
  }

  return groups;
}

export function getMetricStatusTone(
  status: string,
  isDark: boolean,
  colors: ReturnType<typeof useAppTheme>['colors'],
) {
  const normalized = status.toLowerCase();

  if (normalized === 'normal') {
    return {
      backgroundColor: isDark ? 'rgba(34, 197, 94, 0.18)' : 'rgba(22, 163, 74, 0.10)',
      color: colors.successText,
    };
  }

  if (normalized === 'high' || normalized === 'low') {
    return {
      backgroundColor: isDark ? 'rgba(248, 113, 113, 0.16)' : 'rgba(220, 38, 38, 0.10)',
      color: colors.errorText,
    };
  }

  return {
    backgroundColor: colors.surfaceSubtle,
    color: colors.textMuted,
  };
}

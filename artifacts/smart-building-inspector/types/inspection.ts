export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'SUSPENDED' | 'ARCHIVED';
export type SyncStatus = 'LOCAL' | 'PENDING' | 'SYNCING' | 'SYNCED' | 'ERROR';

export type Stage = {
  id: string;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  name: string;
  address: string;
  ownerName: string;
  ownerPhone?: string;
  caseNumber?: string;
  buildingPermitNumber?: string;
  renovationCode?: string;
  permitDate?: string;
  buildingType: string;
  numberOfFloors: number;
  startDate: string;
  currentStageId: string;
  progressPercentage: number;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  lastVisitAt?: string;
  openViolationCount: number;
  syncStatus: SyncStatus;
};

export const DEFAULT_STAGES: Stage[] = [
  'فونداسیون',
  'اسکلت سازه',
  'سقف',
  'سفت‌کاری',
  'تأسیسات',
  'نما',
  'نازک‌کاری',
  'بازدید نهایی',
].map((name, index) => ({
  id: `stage-${index + 1}`,
  name,
  order: index + 1,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}));

export const initialProjects: Project[] = [
  {
    id: 'project-niavaran',
    name: 'پروژه مسکونی نیاوران',
    address: 'تهران، نیاوران، خیابان کامرانیه',
    ownerName: 'شرکت سازه‌گستر البرز',
    ownerPhone: '۰۹۱۲۱۲۳۴۵۶۷',
    caseNumber: '۱۴۰۵/۱۸۴۲',
    buildingPermitNumber: 'پ-۸۴۲۱',
    renovationCode: 'ندارد',
    permitDate: '۱۴۰۵/۰۲/۱۶',
    buildingType: 'مسکونی',
    numberOfFloors: 7,
    startDate: '2026-02-08T00:00:00.000Z',
    currentStageId: 'stage-2',
    progressPercentage: 58,
    status: 'ACTIVE',
    createdAt: '2026-02-08T00:00:00.000Z',
    updatedAt: '2026-08-10T00:00:00.000Z',
    lastVisitAt: '2026-08-10T00:00:00.000Z',
    openViolationCount: 2,
    syncStatus: 'LOCAL',
  },
  {
    id: 'project-vanak',
    name: 'بازسازی ساختمان اداری ونک',
    address: 'تهران، ونک، خیابان ملاصدرا',
    ownerName: 'آقای امیرحسین رضایی',
    ownerPhone: '۰۹۱۰۹۸۷۶۵۴۳',
    caseNumber: '۱۴۰۴/۹۷۲',
    buildingPermitNumber: 'ن-۴۹۱۰',
    renovationCode: 'ب-۲۷۱',
    permitDate: '۱۴۰۴/۱۰/۰۳',
    buildingType: 'اداری',
    numberOfFloors: 4,
    startDate: '2025-12-24T00:00:00.000Z',
    currentStageId: 'stage-4',
    progressPercentage: 34,
    status: 'ACTIVE',
    createdAt: '2025-12-24T00:00:00.000Z',
    updatedAt: '2026-08-06T00:00:00.000Z',
    lastVisitAt: '2026-08-06T00:00:00.000Z',
    openViolationCount: 1,
    syncStatus: 'LOCAL',
  },
  {
    id: 'project-yas',
    name: 'مجتمع تجاری یاس',
    address: 'تهران، سعادت‌آباد، میدان کاج',
    ownerName: 'گروه عمران یاس',
    buildingType: 'تجاری',
    numberOfFloors: 3,
    startDate: '2025-04-12T00:00:00.000Z',
    currentStageId: 'stage-8',
    progressPercentage: 100,
    status: 'COMPLETED',
    createdAt: '2025-04-12T00:00:00.000Z',
    updatedAt: '2026-07-21T00:00:00.000Z',
    lastVisitAt: '2026-07-21T00:00:00.000Z',
    openViolationCount: 0,
    syncStatus: 'SYNCED',
  },
];

export function formatDate(value?: string) {
  if (!value) return 'ثبت نشده';
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function createLocalId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
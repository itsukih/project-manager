import type { Project, Client, OutsourcingPartner, Task, ProjectPhase, ProjectEstimate, ProjectInvoice } from '@prisma/client';
import { SalesStatus, ProgressStatus, PartnerType, TaskCategory, TaskPriority, TaskStatus, EstimateType, InvoiceType, InvoiceStatus } from '@prisma/client';

export type ProjectWithRelations = Project & {
  client: Client;
  projectPartners?: {
    id: number;
    outsourcingPartner: OutsourcingPartner;
    invoiceReceived: boolean;
    paymentMade: boolean;
    paymentDate: Date | null;
  }[];
  phases?: ProjectPhase[];
  estimates?: ProjectEstimate[];
  invoices?: ProjectInvoice[];
  // 外注支払い管理
  outsourcingInvoiceReceived?: boolean;
  outsourcingPaymentMade?: boolean;
  outsourcingPaymentDate?: Date | null;
};

export type TaskWithRelations = Task & {
  project?: Project;
  parent?: Task;
  subTasks?: Task[];
};

export type { Client, OutsourcingPartner, Task, ProjectEstimate, ProjectInvoice };
export { SalesStatus, ProgressStatus, PartnerType, TaskCategory, TaskPriority, TaskStatus, EstimateType, InvoiceType, InvoiceStatus };

export const SALES_STATUS_LABELS = {
  CONSULTING: '相談中',
  QUOTE_SUBMITTED: 'お見積り提示中',
  ORDER_CONFIRMED: '受注確定',
  IN_PROGRESS: '進行中',
  DELIVERED: '納品',
  WAITING_CONTACT: '連絡待ち',
  LOST: '失注',
} as const;

export const PROGRESS_STATUS_LABELS = {
  NOT_STARTED: '未着手',
  DESIGNING: 'デザイン中',
  CODING: 'コーディング中',
  REVIEWING: '確認中',
  REVISING: '修正中',
  DELIVERED: '納品済',
} as const;

export const PARTNER_TYPE_LABELS = {
  DESIGNER: 'デザイナー',
  CODER: 'コーダー',
} as const;

export const STATUS_OPTIONS = [
  '案件受注済み',
  '継続案件',
  '業務委託契約',
  'チャット',
  '面談済み',
  'メールやりとりのみ',
  'お祈りメール',
  '案件対応中',
  '案件断る'
] as const;

export const RANK_OPTIONS = ['VIP', 'A', 'B', 'C', 'D', 'E'] as const;

export const RANK_DESCRIPTIONS: Record<string, string> = {
  VIP: 'VIP - 案件/継続案件あり',
  A: 'A - 契約/チャット/見積り依頼',
  B: 'B - 面談/商談あり',
  C: 'C - メールのやりとりのみ',
  D: 'D - お祈りメール',
  E: 'E - お断り'
};

export const CONTACT_TYPE_OPTIONS = [
  'EMAIL',
  'CHATWORK',
  'SLACK',
  'SNS',
  'LINE',
  'OTHER'
] as const;

export const CONTACT_TYPE_LABELS: Record<string, string> = {
  EMAIL: 'メール',
  CHATWORK: 'Chatwork',
  SLACK: 'Slack',
  SNS: 'SNS',
  LINE: 'LINE',
  OTHER: 'その他'
};

export interface RegularContactTemplate {
  id: number;
  title: string;
  content: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  histories?: RegularContactHistory[];
}

export interface RegularContactHistory {
  id: number;
  templateId: number;
  title: string;
  content: string;
  year: number;
  month: number;
  createdAt: Date;
  template?: RegularContactTemplate;
}

export const TASK_CATEGORY_LABELS = {
  PROJECT: '案件',
  ADMIN: '事務',
  SALES: '営業',
  OTHER: 'その他',
} as const;

export const TASK_PRIORITY_LABELS = {
  URGENT: '🔴 緊急',
  HIGH: '🟠 高',
  MEDIUM: '🟡 中',
  LOW: '🟢 低',
} as const;

export const TASK_STATUS_LABELS = {
  PENDING: '未対応',
  IN_PROGRESS: '対応中',
} as const;

export const INVOICE_STATUS_LABELS = {
  DRAFT: '下書き',
  ISSUED: '発行済',
  PAID: '入金済',
} as const;

export const INVOICE_STATUS_LABELS_OUTSOURCING = {
  DRAFT: '未受領',
  ISSUED: '受領済',
  PAID: '支払済',
} as const;
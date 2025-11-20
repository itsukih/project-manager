import { Project, Client, OutsourcingPartner, SalesStatus, ProgressStatus, PartnerType } from '@prisma/client';

export type ProjectWithRelations = Project & {
  client: Client;
  projectPartners?: {
    outsourcingPartner: OutsourcingPartner;
  }[];
};

export { SalesStatus, ProgressStatus, Client, OutsourcingPartner, PartnerType };

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
  '未接触',
  '面談済み',
  '提案中',
  '受注',
  '失注',
  '継続中'
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
  'メール',
  '電話',
  '対面',
  'オンライン',
  'SNS'
] as const;

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
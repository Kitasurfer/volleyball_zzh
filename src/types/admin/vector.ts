export type VectorJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VectorJobSummary {
  id: string;
  contentId: string;
  title: string;
  language: string;
  status: VectorJobStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string | null;
}

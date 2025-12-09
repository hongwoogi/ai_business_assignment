export interface Grant {
  id: string;
  title: string;
  supportAmount: string;
  period: string;
  deadline: string;
  description?: string;
  region?: string;
  industry?: string;
  status?: 'Open' | 'Closed' | 'Reviewing' | 'Upcoming';
  grantType?: string;
  rawContent?: string;
  eligibility?: string;
  requiredDocuments?: string[];
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
}

export type ViewState = 'idle' | 'uploading' | 'generating';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ProcessingStatus {
  step: 'parsing' | 'analyzing' | 'embedding' | 'saving' | 'complete' | 'error';
  message: string;
  progress: number;
}

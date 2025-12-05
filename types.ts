export interface Grant {
  id: string;
  title: string;
  supportAmount: string;
  period: string;
  deadline: string;
  description?: string;
  region?: string;
  industry?: string;
  status?: 'Open' | 'Closed';
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'image' | 'other';
}

export type ViewState = 'idle' | 'uploading' | 'generating';

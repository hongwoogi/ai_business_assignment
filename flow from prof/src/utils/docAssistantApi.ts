import axios from 'axios';

// API 기본 URL 설정 (환경 변수에서 가져옴)
// .env.local, .env.development, .env.production 파일에서 설정 가능
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 개발 모드에서 환경 변수 경고
if (import.meta.env.DEV && !API_BASE_URL) {
  console.warn(
    '⚠️ VITE_API_BASE_URL이 설정되지 않았습니다.\n' +
    '.env.local 파일을 생성하고 VITE_API_BASE_URL을 설정하세요.\n' +
    '예: VITE_API_BASE_URL=http://localhost:3000'
  );
}

// 인증 토큰 가져오기 (더미 토큰 사용)
// 환경 변수에서 토큰을 가져오거나, 기본값으로 더미 토큰 사용
const getAuthToken = (): string => {
  // 환경 변수에 토큰이 설정되어 있으면 사용
  const envToken = import.meta.env.VITE_AUTH_TOKEN;
  if (envToken) {
    return envToken;
  }
  
  // localStorage에 토큰이 있으면 사용
  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    return storedToken;
  }
  
  // 기본 더미 토큰 반환
  return 'dummy-auth-token-12345';
};

// 서버 API 응답 wrapper
// 서버 응답이 { data: { ... } } 구조일 때 data를 추출
// axios의 response.data를 받은 후, 그 안의 data 속성을 추출
const unwrapResponse = <T>(response: any): T => {
  // response.data가 직접 데이터인 경우
  if (response?.data) {
    return response.data as T;
  }
  // 일반 응답인 경우
  return response as T;
};

// 세션 생성
export interface CreateSessionRequest {
  name: string;
  instructions?: string;
  model?: string;
}

export interface CreateSessionResponse {
  sessionId: number;
  assistantId: string;
  threadId: string;
}

export const createSession = async (
  name: string,
  instructions?: string,
  model?: string
): Promise<CreateSessionResponse> => {
  if (!API_BASE_URL) {
    throw new Error('API_BASE_URL이 설정되지 않았습니다. .env.local 파일을 확인하세요.');
  }

  const token = getAuthToken();
  const url = `${API_BASE_URL}/ai/doc-assistant/session`;

  console.log('세션 생성 요청:', { url, name, instructions, model });

  try {
    const response = await axios.post<CreateSessionResponse>(
      url,
      { name, instructions, model },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('세션 생성 응답:', response.data);
    return unwrapResponse<CreateSessionResponse>(response.data);
  } catch (error: any) {
    console.error('세션 생성 API 에러:', {
      message: error?.message,
      response: error?.response?.data,
      status: error?.response?.status,
      url,
    });
    throw error;
  }
};

// 파일 업로드
export interface UploadFilesResponse {
  uploadedCount: number;
  fileIds: string[];
}

export const uploadFiles = async (
  sessionId: number,
  files: File[]
): Promise<UploadFilesResponse> => {
  const token = getAuthToken();

  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('sessionId', sessionId.toString());

  const response = await axios.post<UploadFilesResponse>(
    `${API_BASE_URL}/ai/doc-assistant/upload`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return unwrapResponse<UploadFilesResponse>(response.data);
};

// 질의 요청
export interface QueryRequest {
  sessionId: number;
  question: string;
}

export interface QueryResponse {
  response: string;
  runId: string;
}

export const queryAssistant = async (
  sessionId: number,
  question: string
): Promise<QueryResponse> => {
  const token = getAuthToken();

  const response = await axios.post<QueryResponse>(
    `${API_BASE_URL}/ai/doc-assistant/query`,
    { sessionId, question },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return unwrapResponse<QueryResponse>(response.data);
};

// 세션 삭제
export interface DeleteSessionResponse {
  success: boolean;
  errors?: string[];
}

export const deleteSession = async (
  sessionId: number
): Promise<DeleteSessionResponse> => {
  const token = getAuthToken();

  const response = await axios.delete<DeleteSessionResponse>(
    `${API_BASE_URL}/ai/doc-assistant/session/${sessionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return unwrapResponse<DeleteSessionResponse>(response.data);
};


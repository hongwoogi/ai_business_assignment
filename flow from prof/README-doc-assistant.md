# Doc Assistant API - React 사용 가이드

Doc Assistant는 OpenAI Responses API를 활용한 RAG(Retrieval-Augmented Generation) 시스템입니다. PDF 파일을 업로드하고, 대화 히스토리를 유지하며 질의할 수 있습니다.

> **참고**: 이 서비스는 OpenAI의 새로운 Responses API를 사용합니다. Assistants API에서 Responses API로 마이그레이션되었습니다.

## 목차

1. [개요](#개요)
2. [TypeScript 타입 정의](#typescript-타입-정의)
3. [API 엔드포인트](#api-엔드포인트)
4. [React Custom Hooks](#react-custom-hooks)
5. [전체 예제](#전체-예제)
6. [인증 설정](#인증-설정)
7. [에러 처리](#에러-처리)
8. [주의사항](#주의사항)

---

## 개요

Doc Assistant는 다음과 같은 기능을 제공합니다:

- **세션 관리**: 각 사용자별 독립적인 세션 생성 및 관리
- **파일 업로드**: PDF 파일을 OpenAI에 업로드하여 Assistant가 분석 가능하도록 설정
- **질의 응답**: 업로드된 문서에 대한 질문 및 답변
- **대화 히스토리**: 세션별 대화 기록 조회
- **리소스 정리**: 세션 삭제 시 관련된 모든 OpenAI 리소스 자동 정리

### 기본 사용 흐름

1. 세션 생성 → 2. PDF 파일 업로드 → 3. 질의 → 4. 히스토리 조회 (선택) → 5. 세션 삭제

---

## TypeScript 타입 정의

React 프로젝트에서 사용할 타입 정의입니다.

```typescript
// API 요청/응답 타입
export interface CreateSessionRequest {
  name: string;              // 세션 이름 (필수)
  instructions?: string;     // Assistant 지시사항 (선택)
  model?: string;            // 모델명 (기본값: "gpt-4o")
}

export interface CreateSessionResponse {
  sessionId: number;         // 생성된 세션 ID
  conversationId: string;    // OpenAI Conversation ID
}

export interface UploadFilesRequest {
  sessionId: number;         // 세션 ID
  files: File[];             // 업로드할 PDF 파일 배열 (최대 10개)
}

export interface UploadFilesResponse {
  uploadedCount: number;     // 업로드된 파일 개수
  fileIds: string[];         // OpenAI File ID 배열
}

export interface QueryRequest {
  sessionId: number;         // 세션 ID
  question: string;          // 질문 내용
}

export interface QueryResponse {
  response: string;          // Assistant 응답
  responseId: string;       // OpenAI Response ID
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date | string;  // ISO 8601 형식 또는 Date 객체
}

export interface HistoryResponse {
  sessionId: number;
  history: Message[];
}

export interface DeleteSessionResponse {
  success: boolean;
  errors?: string[];         // 삭제 중 발생한 오류 (있는 경우)
}

// API 에러 타입
export interface ApiError {
  error: {
    code: string;
    message: string;
  };
  statusCode: number;
}
```

---

## API 엔드포인트

모든 엔드포인트는 `/ai/doc-assistant` 경로 하위에 있으며, 인증이 필요합니다.

### 1. 세션 생성

새로운 Doc Assistant 세션을 생성합니다. 세션 생성 시 OpenAI Conversation이 함께 생성됩니다.

**엔드포인트:** `POST /ai/doc-assistant/session`

**요청 본문:**
```typescript
{
  name: string;              // 세션 이름 (필수)
  instructions?: string;      // Assistant 지시사항 (선택)
  model?: string;             // 모델명 (기본값: "gpt-4o")
}
```

**응답:**
```typescript
{
  sessionId: number;          // 생성된 세션 ID
  conversationId: string;    // OpenAI Conversation ID
}
```

**기본 함수 예시:**
```typescript
import axios from 'axios';
import { CreateSessionRequest, CreateSessionResponse } from './types';

const createSession = async (
  request: CreateSessionRequest
): Promise<CreateSessionResponse> => {
  const response = await axios.post<CreateSessionResponse>(
    '/ai/doc-assistant/session',
    request,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );
    
    return response.data;
};

// 사용 예시
const session = await createSession({
  name: '내 문서 분석',
  instructions: '업로드된 문서를 분석하고 질문에 답변해주세요.',
  model: 'gpt-4o'
});
console.log('세션 ID:', session.sessionId);
```

---

### 2. PDF 파일 업로드

세션에 PDF 파일을 업로드합니다. 여러 파일을 한 번에 업로드할 수 있습니다 (최대 10개).

**엔드포인트:** `POST /ai/doc-assistant/upload`

**요청 형식:** `multipart/form-data`

**요청 필드:**
- `files`: PDF 파일 배열 (필수, 최대 10개)
- `sessionId`: 세션 ID (필수, form-data)

**응답:**
```typescript
{
  uploadedCount: number;      // 업로드된 파일 개수
  fileIds: string[];          // OpenAI File ID 배열
}
```

**기본 함수 예시:**
```typescript
import axios from 'axios';
import { UploadFilesRequest, UploadFilesResponse } from './types';

const uploadFiles = async (
  request: UploadFilesRequest
): Promise<UploadFilesResponse> => {
  const formData = new FormData();
  
  // 파일 추가
  request.files.forEach((file) => {
    formData.append('files', file);
  });
  
  // 세션 ID 추가
  formData.append('sessionId', request.sessionId.toString());
  
  const response = await axios.post<UploadFilesResponse>(
    '/ai/doc-assistant/upload',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );
    
    return response.data;
};

// 사용 예시
const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
const files = Array.from(fileInput.files || []);
const result = await uploadFiles({
  sessionId: 123,
  files: files
});
console.log(`업로드 완료: ${result.uploadedCount}개 파일`);
```

---

### 3. 질의 요청

업로드된 문서에 대해 질문을 합니다. 대화 히스토리가 유지됩니다.

**엔드포인트:** `POST /ai/doc-assistant/query`

**요청 본문:**
```typescript
{
  sessionId: number;          // 세션 ID (필수)
  question: string;           // 질문 내용 (필수)
}
```

**응답:**
```typescript
{
  response: string;            // Assistant 응답
  responseId: string;          // OpenAI Response ID
}
```

**기본 함수 예시:**
```typescript
import axios from 'axios';
import { QueryRequest, QueryResponse } from './types';

const queryAssistant = async (
  request: QueryRequest
): Promise<QueryResponse> => {
  const response = await axios.post<QueryResponse>(
    '/ai/doc-assistant/query',
    request,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
    }
  );
    
    return response.data;
};

// 사용 예시
const result = await queryAssistant({
  sessionId: 123,
  question: '이 문서의 주요 내용은 무엇인가요?'
});
console.log('응답:', result.response);
```

---

### 4. 대화 히스토리 조회

세션의 전체 대화 히스토리를 조회합니다. 히스토리는 AssistantResponse 엔티티에 저장되어 있습니다.

**엔드포인트:** `GET /ai/doc-assistant/history/:sessionId`

**URL 파라미터:**
- `sessionId`: 세션 ID (필수)

**응답:**
```typescript
{
  sessionId: number;
  history: Array<{
    role: 'user' | 'assistant';
    content: string;
    createdAt: string;        // ISO 8601 형식
  }>;
}
```

**기본 함수 예시:**
```typescript
import axios from 'axios';
import { HistoryResponse } from './types';

const getHistory = async (sessionId: number): Promise<HistoryResponse> => {
  const response = await axios.get<HistoryResponse>(
    `/ai/doc-assistant/history/${sessionId}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    }
  );
    
    return response.data;
};

// 사용 예시
const history = await getHistory(123);
console.log('대화 히스토리:', history.history);
```

---

### 5. 세션 삭제

세션과 관련된 모든 리소스(Conversation, Files, AssistantFile, AssistantResponse)를 삭제합니다.

**엔드포인트:** `DELETE /ai/doc-assistant/session/:sessionId`

**URL 파라미터:**
- `sessionId`: 세션 ID (필수)

**응답:**
```typescript
{
  success: boolean;
  errors?: string[];          // 삭제 중 발생한 오류 (있는 경우)
}
```

**기본 함수 예시:**
```typescript
import axios from 'axios';
import { DeleteSessionResponse } from './types';

const deleteSession = async (sessionId: number): Promise<DeleteSessionResponse> => {
  const response = await axios.delete<DeleteSessionResponse>(
    `/ai/doc-assistant/session/${sessionId}`,
    {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    }
  );
    
    return response.data;
};

// 사용 예시
const result = await deleteSession(123);
if (result.success) {
  console.log('세션 삭제 완료');
} else {
  console.warn('일부 리소스 삭제 실패:', result.errors);
}
```

---

## React Custom Hooks

재사용 가능한 React Custom Hooks를 만들어 사용하면 더 편리합니다.

### useDocAssistant Hook

```typescript
import { useState, useCallback } from 'react';
import {
  createSession,
  uploadFiles,
  queryAssistant,
  getHistory,
  deleteSession,
  CreateSessionRequest,
  UploadFilesRequest,
  QueryRequest,
} from './api';

export const useDocAssistant = () => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createNewSession = useCallback(async (request: CreateSessionRequest) => {
    setLoading(true);
    setError(null);
    try {
      const response = await createSession(request);
      setSessionId(response.sessionId);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('세션 생성 실패');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadFilesToSession = useCallback(async (request: UploadFilesRequest) => {
    if (!sessionId) {
      throw new Error('세션이 생성되지 않았습니다.');
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await uploadFiles({
        ...request,
        sessionId,
      });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('파일 업로드 실패');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const query = useCallback(async (question: string) => {
    if (!sessionId) {
      throw new Error('세션이 생성되지 않았습니다.');
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await queryAssistant({
        sessionId,
        question,
      });
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('질의 실패');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchHistory = useCallback(async () => {
    if (!sessionId) {
      throw new Error('세션이 생성되지 않았습니다.');
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await getHistory(sessionId);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('히스토리 조회 실패');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const removeSession = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const response = await deleteSession(sessionId);
      setSessionId(null);
      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('세션 삭제 실패');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  return {
    sessionId,
    loading,
    error,
    createNewSession,
    uploadFilesToSession,
    query,
    fetchHistory,
    removeSession,
  };
};
```

### useChatMessages Hook

```typescript
import { useState, useCallback } from 'react';
import { Message } from './types';

export const useChatMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const addUserMessage = useCallback((content: string) => {
    addMessage({
      role: 'user',
      content,
      createdAt: new Date(),
    });
  }, [addMessage]);

  const addAssistantMessage = useCallback((content: string) => {
    addMessage({
      role: 'assistant',
      content,
      createdAt: new Date(),
    });
  }, [addMessage]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const loadHistory = useCallback((history: Message[]) => {
    setMessages(history);
  }, []);

  return {
    messages,
    addUserMessage,
    addAssistantMessage,
    clearMessages,
    loadHistory,
  };
};
```

---

## 전체 예제

### 완전한 React 컴포넌트 예제

```typescript
import React, { useState, useEffect, useRef } from 'react';
import { useDocAssistant } from './hooks/useDocAssistant';
import { useChatMessages } from './hooks/useChatMessages';

const DocAssistantApp: React.FC = () => {
  const {
    sessionId,
    loading,
    error,
    createNewSession,
    uploadFilesToSession,
    query,
    fetchHistory,
    removeSession,
  } = useDocAssistant();

  const {
    messages,
    addUserMessage,
    addAssistantMessage,
    loadHistory,
  } = useChatMessages();

  const [question, setQuestion] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 세션 생성
  useEffect(() => {
    const initSession = async () => {
      try {
        await createNewSession({
          name: '문서 분석 세션',
          instructions: '업로드된 문서를 분석하고 질문에 정확하게 답변해주세요.',
          model: 'gpt-4o',
        });
      } catch (err) {
        console.error('세션 초기화 실패:', err);
      }
    };

    initSession();
  }, []);

  // 히스토리 로드
  useEffect(() => {
    if (sessionId) {
      const loadHistoryData = async () => {
        try {
          const history = await fetchHistory();
          loadHistory(history.history.map(msg => ({
            ...msg,
            createdAt: typeof msg.createdAt === 'string' 
              ? new Date(msg.createdAt) 
              : msg.createdAt,
          })));
        } catch (err) {
          console.error('히스토리 로드 실패:', err);
        }
      };

      loadHistoryData();
    }
  }, [sessionId]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 파일 업로드 핸들러
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf');
    
    if (pdfFiles.length === 0) {
      alert('PDF 파일만 업로드 가능합니다.');
      return;
    }

    if (!sessionId) {
      alert('세션이 생성되지 않았습니다.');
      return;
    }

    setUploading(true);
    try {
      await uploadFilesToSession({
        sessionId,
        files: pdfFiles,
      });
      setUploadedFiles(prev => [...prev, ...pdfFiles]);
      alert(`업로드 완료: ${pdfFiles.length}개 파일`);
    } catch (err) {
      console.error('파일 업로드 실패:', err);
      alert('파일 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  // 질의 핸들러
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim() || !sessionId) return;

    const userQuestion = question;
    setQuestion('');
    addUserMessage(userQuestion);

    try {
      const result = await query(userQuestion);
      addAssistantMessage(result.response);
    } catch (err) {
      console.error('질의 실패:', err);
      addAssistantMessage('죄송합니다. 질의 처리 중 오류가 발생했습니다.');
    }
  };

  // 세션 삭제 핸들러
  const handleDeleteSession = async () => {
    if (!sessionId) return;
    
    if (window.confirm('세션을 삭제하시겠습니까?')) {
      try {
        await removeSession();
        setUploadedFiles([]);
        loadHistory([]);
        alert('세션이 삭제되었습니다.');
      } catch (err) {
        console.error('세션 삭제 실패:', err);
      }
    }
  };

  // 컴포넌트 언마운트 시 세션 정리
  useEffect(() => {
    return () => {
      if (sessionId) {
        removeSession().catch(err => 
          console.error('세션 정리 실패:', err)
        );
      }
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <div className="loading-container">
        <p>세션 생성 중...</p>
        {error && <p className="error">오류: {error.message}</p>}
      </div>
    );
  }

  return (
    <div className="doc-assistant-app">
      <header className="app-header">
      <h1>Doc Assistant</h1>
        <button 
          onClick={handleDeleteSession}
          className="delete-button"
          disabled={loading}
        >
          세션 삭제
        </button>
      </header>
      
      {/* 파일 업로드 섹션 */}
      <section className="file-upload-section">
        <h2>PDF 파일 업로드</h2>
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={uploading || loading}
        />
        {uploading && <p className="upload-status">업로드 중...</p>}
        {uploadedFiles.length > 0 && (
          <div className="uploaded-files">
            <h3>업로드된 파일 ({uploadedFiles.length}개)</h3>
          <ul>
              {uploadedFiles.map((file, idx) => (
              <li key={idx}>{file.name}</li>
            ))}
          </ul>
      </div>
        )}
      </section>

      {/* 채팅 인터페이스 */}
      <section className="chat-section">
        <h2>질의하기</h2>
        <div className="messages-container">
          {messages.length === 0 ? (
            <p className="empty-message">대화를 시작하세요.</p>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.role}`}>
                <div className="message-header">
                  <strong>{msg.role === 'user' ? '사용자' : 'Assistant'}</strong>
                  <span className="message-time">
                    {new Date(msg.createdAt).toLocaleString()}
                  </span>
            </div>
                <div className="message-content">
                  {msg.content.split('\n').map((line, lineIdx) => (
                    <p key={lineIdx}>{line}</p>
                  ))}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="message message-assistant">
              <p className="loading-indicator">응답 생성 중...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={handleQuery} className="query-form">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="질문을 입력하세요..."
            disabled={loading}
            className="query-input"
          />
          <button 
            type="submit" 
            disabled={loading || !question.trim()}
            className="submit-button"
          >
            전송
          </button>
        </form>
      </section>

      {error && (
        <div className="error-container">
          <p className="error-message">오류: {error.message}</p>
      </div>
      )}
    </div>
  );
};

export default DocAssistantApp;
```

### 기본 스타일 예시 (CSS)

```css
.doc-assistant-app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.delete-button {
  padding: 8px 16px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.delete-button:hover:not(:disabled) {
  background-color: #c82333;
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.file-upload-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.uploaded-files ul {
  list-style: none;
  padding: 0;
  margin-top: 10px;
}

.uploaded-files li {
  padding: 8px;
  background-color: white;
  margin-bottom: 5px;
  border-radius: 4px;
}

.chat-section {
  display: flex;
  flex-direction: column;
  height: 600px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.message {
  margin-bottom: 20px;
  padding: 15px;
  border-radius: 8px;
}

.message-user {
  background-color: #007bff;
  color: white;
  margin-left: 20%;
}

.message-assistant {
  background-color: white;
  border: 1px solid #e0e0e0;
  margin-right: 20%;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 0.9em;
  opacity: 0.8;
}

.message-content {
  line-height: 1.6;
}

.query-form {
  display: flex;
  gap: 10px;
}

.query-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
}

.submit-button {
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.submit-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-container {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
}
```

---

## 인증 설정

모든 API 요청에는 인증 토큰이 필요합니다. axios interceptor를 사용하여 자동으로 토큰을 추가할 수 있습니다.

### API 클라이언트 설정

```typescript
// api/client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

// 토큰 가져오기 함수 (프로젝트에 맞게 수정)
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken'); // 또는 다른 저장소
};

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://your-api-domain.com',
  timeout: 30000, // 30초
});

// 요청 인터셉터: 모든 요청에 토큰 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 에러 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### API 함수들

```typescript
// api/docAssistant.ts
import apiClient from './client';
import {
  CreateSessionRequest,
  CreateSessionResponse,
  UploadFilesRequest,
  UploadFilesResponse,
  QueryRequest,
  QueryResponse,
  HistoryResponse,
  DeleteSessionResponse,
} from './types';

export const createSession = async (
  request: CreateSessionRequest
): Promise<CreateSessionResponse> => {
  const response = await apiClient.post<CreateSessionResponse>(
    '/ai/doc-assistant/session',
    request
  );
  return response.data;
};

export const uploadFiles = async (
  request: UploadFilesRequest
): Promise<UploadFilesResponse> => {
  const formData = new FormData();
  request.files.forEach((file) => {
    formData.append('files', file);
  });
  formData.append('sessionId', request.sessionId.toString());

  const response = await apiClient.post<UploadFilesResponse>(
    '/ai/doc-assistant/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

export const queryAssistant = async (
  request: QueryRequest
): Promise<QueryResponse> => {
  const response = await apiClient.post<QueryResponse>(
    '/ai/doc-assistant/query',
    request
  );
  return response.data;
};

export const getHistory = async (
  sessionId: number
): Promise<HistoryResponse> => {
  const response = await apiClient.get<HistoryResponse>(
    `/ai/doc-assistant/history/${sessionId}`
  );
  return response.data;
};

export const deleteSession = async (
  sessionId: number
): Promise<DeleteSessionResponse> => {
  const response = await apiClient.delete<DeleteSessionResponse>(
    `/ai/doc-assistant/session/${sessionId}`
  );
  return response.data;
};
```

---

## 에러 처리

모든 API는 다음과 같은 에러 응답을 반환할 수 있습니다:

```typescript
{
  error: {
    code: string;
    message: string;
  };
  statusCode: number;
}
```

### 에러 처리 유틸리티

```typescript
// utils/errorHandler.ts
import { AxiosError } from 'axios';
import { ApiError } from './types';

export const handleApiError = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response) {
      // 서버 응답이 있는 경우
      const apiError = error.response.data as ApiError;
      return apiError.error?.message || '서버 오류가 발생했습니다.';
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      return '네트워크 오류가 발생했습니다. 연결을 확인해주세요.';
    } else {
      // 요청 설정 중 에러
      return `요청 설정 오류: ${error.message}`;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return '알 수 없는 오류가 발생했습니다.';
};

// 사용 예시
try {
  const result = await queryAssistant({ sessionId: 123, question: '질문' });
  // 성공 처리
} catch (error) {
  const errorMessage = handleApiError(error);
  console.error('에러:', errorMessage);
  // 사용자에게 에러 메시지 표시
}
```

---

## 주의사항

### 1. 파일 형식 및 크기
- **파일 형식**: PDF 파일만 업로드 가능합니다.
- **파일 개수**: 한 번에 최대 10개까지 업로드 가능합니다.
- **파일 크기**: 서버 설정에 따라 파일 크기 제한이 있을 수 있습니다. (일반적으로 10MB~50MB)

### 2. 세션 관리
- 세션은 사용자가 명시적으로 삭제하지 않으면 유지됩니다.
- 불필요한 세션은 삭제하여 리소스를 절약하세요.
- 컴포넌트 언마운트 시 세션을 정리하는 것을 권장합니다.

### 3. 비동기 처리
- 파일 업로드와 질의는 시간이 걸릴 수 있습니다 (수 초 ~ 수십 초).
- 적절한 로딩 상태를 표시하여 사용자 경험을 개선하세요.
- 타임아웃 설정을 고려하세요.

### 4. 에러 처리
- 네트워크 오류, 인증 오류, 서버 오류 등 다양한 상황에 대비한 에러 처리를 구현하세요.
- 사용자에게 명확한 에러 메시지를 제공하세요.

### 5. 성능 최적화
- 대용량 파일 업로드 시 진행률 표시를 고려하세요.
- 메시지 히스토리가 많을 경우 가상 스크롤링을 고려하세요.
- React Query나 SWR 같은 데이터 페칭 라이브러리를 사용하면 더 효율적입니다.

### 6. 보안
- 인증 토큰을 안전하게 저장하세요 (httpOnly 쿠키 권장).
- 민감한 정보가 포함된 문서 업로드 시 주의하세요.
- HTTPS를 사용하세요.

---

## 추가 리소스

- [OpenAI Responses API 문서](https://platform.openai.com/docs/assistants/migration)
- [OpenAI Responses API 마이그레이션 가이드](https://platform.openai.com/docs/assistants/migration)
- [React 공식 문서](https://react.dev/)
- [Axios 문서](https://axios-http.com/)

## 주요 변경사항 (Responses API 마이그레이션)

### API 구조 변경
- **Assistants API** → **Responses API**로 전환
- **Threads** → **Conversations**로 변경
- **Runs** → **Responses**로 변경

### 데이터 저장 방식 변경
- **히스토리 저장**: 세션 props의 `conversationHistory` 대신 `AssistantResponse` 엔티티에 저장
- **파일 정보**: 세션 props의 `fileIds` 대신 `AssistantFile` 엔티티에 저장
- **Conversation 관리**: 세션 생성 시 `openai.conversations.create()`로 Conversation 생성

### 응답 형식 변경
- 세션 생성 응답: `assistantId`, `threadId` → `conversationId`
- 질의 응답: `runId` → `responseId`

---

**작성일**: 2025년 1월 27일  
**최종 수정일**: 2025년 12월 8일  
**작성자**: Bruce.Park, the Eng/DBA

**업데이트 내역**:
- 2025년 12월 8일: Responses API로 마이그레이션, DB 히스토리 저장 방식 변경

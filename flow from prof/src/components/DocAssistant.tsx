import React, { useState, useEffect, useRef } from 'react';
import {
  createSession,
  uploadFiles,
  queryAssistant,
  deleteSession,
} from '../utils/docAssistantApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const DocAssistant: React.FC = () => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 세션 자동 생성
  useEffect(() => {
    const initSession = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('세션 생성 시작...');
        const session = await createSession(
          '문서 분석 세션',
          '업로드된 문서를 분석하고 질문에 정확하게 답변해주세요.'
        );
        console.log('세션 생성 성공:', session);
        if (session && session.sessionId) {
          setSessionId(session.sessionId);
          console.log('세션 ID 설정됨:', session.sessionId);
        } else {
          console.error('세션 응답에 sessionId가 없습니다:', session);
          setError('세션 생성 응답이 올바르지 않습니다.');
        }
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error?.message || err?.message || '세션 생성에 실패했습니다.';
        setError(`세션 생성 실패: ${errorMessage}`);
        console.error('세션 생성 실패:', err);
        if (err?.response) {
          console.error('응답 데이터:', err.response.data);
          console.error('응답 상태:', err.response.status);
        }
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  // 세션 삭제 (컴포넌트 언마운트 시)
  useEffect(() => {
    return () => {
      if (sessionId) {
        deleteSession(sessionId).catch((err) =>
          console.error('세션 삭제 실패:', err)
        );
      }
    };
  }, [sessionId]);

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 파일 업로드
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter((file) => file.type === 'application/pdf');

    if (pdfFiles.length === 0) {
      setError('PDF 파일만 업로드 가능합니다.');
      return;
    }

    if (!sessionId) {
      setError('세션이 생성되지 않았습니다.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await uploadFiles(sessionId, pdfFiles);
      setUploadedFiles((prev) => [...prev, ...pdfFiles]);
    } catch (err) {
      setError('파일 업로드에 실패했습니다.');
      console.error('파일 업로드 실패:', err);
    } finally {
      setUploading(false);
    }
  };

  // 질의 요청
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!question.trim() || !sessionId) return;

    const userQuestion = question;
    setQuestion('');
    setMessages((prev) => [...prev, { role: 'user', content: userQuestion }]);
    setLoading(true);
    setError(null);

    try {
      const response = await queryAssistant(sessionId, userQuestion);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.response },
      ]);
    } catch (err) {
      setError('질의 처리에 실패했습니다.');
      console.error('질의 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId && loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>세션 생성 중...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ marginBottom: '20px' }}>Doc Assistant</h1>

      {/* 세션 상태 표시 */}
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: sessionId ? '#e8f5e9' : '#fff3e0', borderRadius: '4px' }}>
        <strong>세션 상태: </strong>
        {sessionId ? (
          <span style={{ color: '#2e7d32' }}>연결됨 (ID: {sessionId})</span>
        ) : loading ? (
          <span style={{ color: '#f57c00' }}>세션 생성 중...</span>
        ) : (
          <span style={{ color: '#e65100' }}>세션 없음</span>
        )}
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div
          style={{
            padding: '10px',
            marginBottom: '20px',
            backgroundColor: '#fee',
            color: '#c33',
            borderRadius: '4px',
          }}
        >
          {error}
        </div>
      )}

      {/* 파일 업로드 */}
      <div style={{ marginBottom: '30px' }}>
        <h2>PDF 파일 업로드</h2>
        <input
          type="file"
          multiple
          accept=".pdf"
          onChange={handleFileUpload}
          disabled={uploading || !sessionId}
          style={{ marginBottom: '10px' }}
        />
        {uploading && <p>업로드 중...</p>}
        {uploadedFiles.length > 0 && (
          <div>
            <p>업로드된 파일 ({uploadedFiles.length}개):</p>
            <ul>
              {uploadedFiles.map((file, idx) => (
                <li key={idx}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 채팅 인터페이스 */}
      <div style={{ marginBottom: '30px' }}>
        <h2>질의하기</h2>
        <div
          style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '15px',
            marginBottom: '15px',
            height: '400px',
            overflowY: 'auto',
            backgroundColor: '#f9f9f9',
          }}
        >
          {messages.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', marginTop: '50%' }}>
              질문을 입력하세요...
            </p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: '15px',
                  padding: '10px',
                  backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#fff',
                  borderRadius: '4px',
                  textAlign: msg.role === 'user' ? 'right' : 'left',
                }}
              >
                <strong>{msg.role === 'user' ? '사용자' : 'Assistant'}:</strong>
                <p style={{ margin: '5px 0 0 0' }}>{msg.content}</p>
              </div>
            ))
          )}
          {loading && (
            <p style={{ color: '#999', textAlign: 'center' }}>
              응답 생성 중...
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="질문을 입력하세요..."
              disabled={loading || !sessionId}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
              }}
            />
            <button
              type="submit"
              disabled={loading || !sessionId || !question.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading || !sessionId ? 'not-allowed' : 'pointer',
                opacity: loading || !sessionId ? 0.5 : 1,
              }}
            >
              전송
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocAssistant;


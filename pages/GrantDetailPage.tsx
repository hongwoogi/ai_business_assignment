import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import GeneratingModal from '../components/GeneratingModal';
import { Grant, ChatMessage } from '../types';
import { getGrantById } from '../services/grantService';
import { askQuestion, createMessage } from '../services/ragService';

const GrantDetailPage: React.FC = () => {
  const { grantId } = useParams();
  const [grant, setGrant] = useState<Grant | undefined>(undefined);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isGenerating, setGenerating] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadGrant = async () => {
      if (grantId) {
        const foundGrant = await getGrantById(grantId);
        if (foundGrant) {
          setGrant(foundGrant);
        }
      }

      // Reset chat when grant changes
      setMessages([]);
    };

    loadGrant();
  }, [grantId]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleGenerateClick = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
    }, 3000);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !grantId || isSending) return;

    const userMessage = createMessage('user', inputMessage.trim());
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const response = await askQuestion(grantId, userMessage.content);
      const assistantMessage = createMessage('assistant', response);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting response:', error);
      const errorMessage = createMessage('assistant', '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!grant) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-medium-gray">
        공고 내용을 불러오는 중입니다...
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Open': return '접수중';
      case 'Closed': return '마감';
      case 'Reviewing': return '심사중';
      case 'Upcoming': return '접수전';
      default: return status;
    }
  };

  const isUploadedGrant = grant.id.startsWith('GRANT-');

  return (
    <div className="flex h-full flex-col relative">
      {/* Scrollable Content Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 md:p-10 max-w-7xl mx-auto w-full scroll-smooth"
      >
        {/* Main Info Card */}
        <div className="w-full bg-neutral-white rounded-xl border border-slate-200 p-8 shadow-sm mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {isUploadedGrant && (
                  <span className="text-xs font-medium text-white bg-green-500 px-2 py-0.5 rounded">
                    AI 분석 완료
                  </span>
                )}
                {grant.grantType && (
                  <span className="text-xs font-medium text-corporate-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {grant.grantType}
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold text-neutral-dark-gray tracking-tight">{grant.title}</h1>
              <p className="text-sm font-medium text-neutral-medium-gray mt-2 flex items-center gap-2">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 border border-slate-200">ID: #{grant.id}</span>
                {grant.industry && grant.industry.split(',').map((ind, idx) => (
                  <span key={idx} className="bg-blue-50 px-2 py-0.5 rounded text-xs text-corporate-blue border border-blue-100">
                    {ind.trim()}
                  </span>
                ))}
              </p>
            </div>
            {grant.status === 'Open' ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full border border-green-200">
                {getStatusLabel(grant.status)}
              </span>
            ) : grant.status === 'Upcoming' ? (
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full border border-blue-200">
                {getStatusLabel(grant.status)}
              </span>
            ) : (
              <span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm font-semibold rounded-full border border-slate-200">
                {getStatusLabel(grant.status || '')}
              </span>
            )}
          </div>

          <p className="mt-6 text-neutral-dark-gray leading-relaxed max-w-4xl break-keep">
            {grant.description}
          </p>

          {grant.eligibility && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <p className="text-sm font-medium text-amber-800">
                <span className="font-semibold">신청 자격:</span> {grant.eligibility}
              </p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon="payments"
              label="지원 규모"
              value={grant.supportAmount}
            />
            <StatCard
              icon="event_available"
              label="접수 기간"
              value={grant.period}
            />
            <StatCard
              icon="event_upcoming"
              label="결과보고 마감일"
              value={grant.deadline}
            />
          </div>
        </div>

        {/* Chat Messages */}
        {messages.length > 0 && (
          <div className="space-y-4 mb-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-3 shadow-sm ${msg.role === 'user'
                    ? 'bg-corporate-blue text-white'
                    : 'bg-white border border-slate-200 text-neutral-dark-gray'
                    }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                      <span className="material-symbols-outlined text-sm text-corporate-blue">smart_toy</span>
                      <span className="text-xs font-medium text-corporate-blue">AI 상담사</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse flex gap-1">
                      <div className="w-2 h-2 bg-corporate-blue rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-corporate-blue rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-corporate-blue rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-sm text-neutral-medium-gray">응답 생성 중...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fixed Bottom Area: Action Buttons & Chat Input */}
      <div className="p-6 md:p-8 bg-white border-t border-slate-200 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-10 w-full">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <ActionButton
              icon="upload_file"
              label="내 정보 업로드"
              onClick={() => setUploadModalOpen(true)}
              variant="secondary"
            />
            <ActionButton
              icon="edit_document"
              label="사업계획서 초안 작성"
              onClick={handleGenerateClick}
              variant="secondary"
            />
            <ActionButton
              icon="assignment"
              label="결과보고서 초안 작성"
              onClick={() => { }}
              variant="secondary"
            />
          </div>

          {/* Chat Input */}
          <div className="relative group w-full">
            <div className="absolute inset-0 bg-corporate-blue/5 rounded-xl blur-sm group-focus-within:bg-corporate-blue/10 transition-colors"></div>
            <textarea
              className="relative w-full resize-none rounded-xl border border-slate-300 bg-neutral-white p-4 pr-16 text-neutral-dark-gray placeholder:text-neutral-medium-gray focus:border-corporate-blue focus:ring-2 focus:ring-corporate-blue/20 focus:outline-none shadow-sm transition-all text-base"
              placeholder={isUploadedGrant
                ? "이 공고에 대해 AI에게 궁금한 점을 질문해보세요... (RAG 기반 응답)"
                : "이 공고에 대해 AI에게 궁금한 점을 질문해보세요..."
              }
              rows={2}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            ></textarea>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isSending}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-lg bg-corporate-blue text-white hover:bg-corporate-blue/90 disabled:bg-slate-300 transition-transform active:scale-95 shadow-sm"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : (
                <span className="material-symbols-outlined text-xl">send</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {isUploadModalOpen && <UploadModal onClose={() => setUploadModalOpen(false)} />}
      {isGenerating && <GeneratingModal />}
    </div>
  );
};

const StatCard: React.FC<{ icon: string; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors group">
    <div className="p-3 bg-white rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
      <span className="material-symbols-outlined text-3xl text-corporate-blue">{icon}</span>
    </div>
    <p className="text-sm font-medium text-neutral-medium-gray">{label}</p>
    <p className="text-lg font-bold text-neutral-dark-gray mt-1 text-center">{value}</p>
  </div>
);

const ActionButton: React.FC<{
  icon: string;
  label: string;
  onClick: () => void;
  variant: 'primary' | 'secondary'
}> = ({ icon, label, onClick, variant }) => {
  const baseClasses = "flex items-center gap-2 justify-center rounded-lg px-6 py-3.5 text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md active:scale-95";
  const variants = {
    primary: "bg-corporate-blue text-white hover:bg-corporate-blue/90 ring-2 ring-transparent focus:ring-corporate-blue/40",
    secondary: "bg-white border border-slate-200 text-neutral-dark-gray hover:bg-slate-50 hover:border-slate-300"
  };

  return (
    <button onClick={onClick} className={`${baseClasses} ${variants[variant]}`}>
      <span className="material-symbols-outlined text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default GrantDetailPage;
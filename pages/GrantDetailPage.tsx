import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UploadModal from '../components/UploadModal';
import GeneratingModal from '../components/GeneratingModal';
import { MOCK_GRANTS } from '../constants';
import { Grant } from '../types';

const GrantDetailPage: React.FC = () => {
  const { grantId } = useParams();
  const [grant, setGrant] = useState<Grant | undefined>(undefined);
  const [isUploadModalOpen, setUploadModalOpen] = useState(false);
  const [isGenerating, setGenerating] = useState(false);

  useEffect(() => {
    const foundGrant = MOCK_GRANTS.find(g => g.id === grantId);
    setGrant(foundGrant);
  }, [grantId]);

  const handleGenerateClick = () => {
    setGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      setGenerating(false);
    }, 3000);
  };

  if (!grant) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-medium-gray">
        공고 내용을 불러오는 중입니다...
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'Open': return '접수중';
      case 'Closed': return '마감';
      case 'Reviewing': return '심사중';
      default: return status;
    }
  };

  return (
    <div className="flex h-full flex-col p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col h-full">
        {/* Main Info Card */}
        <div className="w-full bg-neutral-white rounded-xl border border-slate-200 p-8 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-neutral-dark-gray tracking-tight">{grant.title}</h1>
              <p className="text-sm font-medium text-neutral-medium-gray mt-2 flex items-center gap-2">
                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600 border border-slate-200">ID: #{grant.id}</span>
                <span className="bg-blue-50 px-2 py-0.5 rounded text-xs text-corporate-blue border border-blue-100">{grant.industry}</span>
              </p>
            </div>
            {grant.status === 'Open' ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full border border-green-200">
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

        {/* Spacer to push controls to bottom if needed, or just standard flow */}
        <div className="flex-grow min-h-[4rem]"></div>

        {/* Action Area */}
        <div className="w-full mt-6 space-y-6">
          <div className="flex flex-wrap justify-center gap-4">
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
              onClick={() => {}} 
              variant="secondary"
            />
          </div>

          {/* Chat Interface */}
          <div className="relative group">
            <div className="absolute inset-0 bg-corporate-blue/5 rounded-xl blur-sm group-focus-within:bg-corporate-blue/10 transition-colors"></div>
            <textarea 
              className="relative w-full resize-none rounded-xl border border-slate-300 bg-neutral-white p-4 pr-16 text-neutral-dark-gray placeholder:text-neutral-medium-gray focus:border-corporate-blue focus:ring-2 focus:ring-corporate-blue/20 focus:outline-none shadow-sm transition-all text-base" 
              placeholder="이 공고에 대해 AI에게 궁금한 점을 질문해보세요..." 
              rows={3}
            ></textarea>
            <button className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-lg bg-corporate-blue text-white hover:bg-corporate-blue/90 disabled:bg-slate-300 transition-transform active:scale-95 shadow-sm">
              <span className="material-symbols-outlined text-xl">send</span>
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
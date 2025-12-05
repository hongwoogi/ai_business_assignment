import React from 'react';

const GeneratingModal: React.FC = () => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-neutral-dark-gray/40 backdrop-blur-md animate-fade-in">
      <div className="flex flex-col items-center gap-6 rounded-xl bg-neutral-white p-10 shadow-2xl w-full max-w-sm text-center border border-white/20">
        <div className="relative">
          <div className="absolute inset-0 bg-corporate-blue/20 rounded-full animate-ping"></div>
          <div className="relative z-10 bg-white p-2 rounded-full shadow-lg">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-corporate-blue"></div>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-neutral-dark-gray mb-2">문서 생성 중...</h2>
          <p className="text-neutral-medium-gray text-sm leading-relaxed">
            AI가 업로드된 문서를 분석하여 <span className="font-semibold text-corporate-blue">사업계획서 초안</span>을 작성하고 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneratingModal;
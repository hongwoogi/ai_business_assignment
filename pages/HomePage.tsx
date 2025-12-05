import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-8 bg-slate-50/50">
      <div className="text-center max-w-md">
        <div className="mx-auto h-24 w-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
           <span className="material-symbols-outlined text-5xl text-slate-300">dashboard</span>
        </div>
        <h2 className="text-2xl font-bold text-neutral-dark-gray">정부지원사업 공고 해결사</h2>
        <p className="mt-3 text-base text-neutral-medium-gray break-keep">
          좌측 목록에서 공고를 선택하여 상세 내용을 확인하고, 서류 업로드 및 AI 사업계획서 자동 작성 기능을 이용해보세요.
        </p>
      </div>
    </div>
  );
};

export default HomePage;
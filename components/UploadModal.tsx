import React, { useRef, useState } from 'react';

interface UploadModalProps {
  onClose: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<{name: string, size: string, color: string}[]>([
    { name: '2024년_사업계획서_초안.pdf', size: '1.2 MB', color: 'text-red-500' },
    { name: '재무제표_2023.xlsx', size: '450 KB', color: 'text-green-500' }
  ]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((f: File) => ({
         name: f.name,
         size: `${(f.size / 1024).toFixed(1)} KB`,
         color: 'text-blue-500'
      }));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-dark-gray/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl rounded-xl bg-neutral-white shadow-2xl overflow-hidden scale-100 animate-scale-in">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
          <h2 className="text-lg font-semibold text-neutral-dark-gray">서류 업로드</h2>
          <button onClick={onClose} className="text-neutral-medium-gray hover:text-neutral-dark-gray">
             <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6 bg-slate-50/50">
          <div 
            className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 p-10 text-center bg-white hover:bg-slate-50 transition-colors cursor-pointer"
            onClick={handleBrowseClick}
          >
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef} 
              multiple 
              onChange={handleFileChange}
            />
            <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-corporate-blue">cloud_upload</span>
            </div>
            <p className="text-lg font-medium text-neutral-dark-gray">파일을 이곳에 드래그 앤 드롭하세요</p>
            <p className="text-sm text-neutral-medium-gray mt-1 mb-3">지원 형식: PDF, DOCX, XLSX</p>
            <button className="text-sm font-semibold text-corporate-blue hover:underline">파일 찾기</button>
          </div>

          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-xs font-semibold text-neutral-medium-gray uppercase tracking-wider ml-1">첨부된 파일 ({files.length})</p>
              {files.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <svg className={`h-8 w-8 ${file.color}`} fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM18 20H6V4H13V9H18V20ZM8 14.5V13H16V14.5L13.5 17L16 19.5V21H8V19.5L10.5 17L8 14.5Z"></path>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-neutral-dark-gray">{file.name}</p>
                      <p className="text-xs text-neutral-medium-gray">{file.size}</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                    className="p-2 text-neutral-medium-gray hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-white">
          <button 
            onClick={onClose} 
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-neutral-dark-gray hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button 
            onClick={onClose} 
            className="rounded-lg bg-corporate-blue px-6 py-2 text-sm font-semibold text-white hover:bg-corporate-blue/90 shadow-sm transition-all hover:shadow-md"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;
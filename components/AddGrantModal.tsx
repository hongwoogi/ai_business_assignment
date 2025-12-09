import React, { useRef, useState } from 'react';
import { processGrantDocument, ProcessingStatus } from '../services/grantService';
import { Grant } from '../types';

interface AddGrantModalProps {
    onClose: () => void;
    onGrantAdded: (grant: Grant) => void;
}

const AddGrantModal: React.FC<AddGrantModalProps> = ({ onClose, onGrantAdded }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<ProcessingStatus | null>(null);

    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.type === 'application/pdf') {
                setSelectedFile(file);
                setStatus(null);
            } else {
                alert('PDF 파일만 업로드할 수 있습니다.');
            }
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setStatus(null);
        } else {
            alert('PDF 파일만 업로드할 수 있습니다.');
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleProcess = async () => {
        if (!selectedFile) return;

        setIsProcessing(true);
        try {
            const grant = await processGrantDocument(selectedFile, setStatus);
            onGrantAdded(grant);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error) {
            console.error('Error processing document:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const getStepIcon = (step: string) => {
        switch (step) {
            case 'parsing': return 'description';
            case 'analyzing': return 'psychology';
            case 'embedding': return 'data_array';
            case 'saving': return 'cloud_upload';
            case 'complete': return 'check_circle';
            case 'error': return 'error';
            default: return 'pending';
        }
    };

    const getStepColor = (step: string) => {
        switch (step) {
            case 'complete': return 'text-green-500';
            case 'error': return 'text-red-500';
            default: return 'text-corporate-blue';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-dark-gray/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl bg-neutral-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-white">
                    <h2 className="text-lg font-semibold text-neutral-dark-gray">새 공고 추가</h2>
                    <button onClick={onClose} className="text-neutral-medium-gray hover:text-neutral-dark-gray" disabled={isProcessing}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 bg-slate-50/50">
                    {/* File Upload Area */}
                    <div
                        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors cursor-pointer
              ${selectedFile ? 'border-corporate-blue bg-blue-50' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
                        onClick={!isProcessing ? handleBrowseClick : undefined}
                        onDrop={!isProcessing ? handleDrop : undefined}
                        onDragOver={handleDragOver}
                    >
                        <input
                            type="file"
                            className="hidden"
                            ref={fileInputRef}
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={isProcessing}
                        />

                        {selectedFile ? (
                            <>
                                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-corporate-blue">picture_as_pdf</span>
                                </div>
                                <p className="text-lg font-medium text-neutral-dark-gray">{selectedFile.name}</p>
                                <p className="text-sm text-neutral-medium-gray mt-1">
                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {!isProcessing && (
                                    <button
                                        className="mt-3 text-sm font-semibold text-red-500 hover:underline"
                                        onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
                                    >
                                        파일 제거
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                    <span className="material-symbols-outlined text-4xl text-corporate-blue">upload_file</span>
                                </div>
                                <p className="text-lg font-medium text-neutral-dark-gray">공고문 PDF를 업로드하세요</p>
                                <p className="text-sm text-neutral-medium-gray mt-1 mb-3">파일을 드래그 앤 드롭하거나 클릭하여 선택</p>
                                <button className="text-sm font-semibold text-corporate-blue hover:underline">파일 찾기</button>
                            </>
                        )}
                    </div>

                    {/* Processing Status */}
                    {status && (
                        <div className="mt-6 p-4 rounded-lg bg-white border border-slate-200">
                            <div className="flex items-center gap-3">
                                <div className={`${getStepColor(status.step)} ${status.step !== 'complete' && status.step !== 'error' ? 'animate-pulse' : ''}`}>
                                    <span className="material-symbols-outlined text-2xl">{getStepIcon(status.step)}</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-neutral-dark-gray">{status.message}</p>
                                    {status.step !== 'error' && status.step !== 'complete' && (
                                        <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-corporate-blue transition-all duration-500 ease-out"
                                                style={{ width: `${status.progress}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4 bg-white">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-neutral-dark-gray hover:bg-slate-50 transition-colors"
                        disabled={isProcessing}
                    >
                        취소
                    </button>
                    <button
                        onClick={handleProcess}
                        disabled={!selectedFile || isProcessing}
                        className="rounded-lg bg-corporate-blue px-6 py-2 text-sm font-semibold text-white hover:bg-corporate-blue/90 shadow-sm transition-all hover:shadow-md disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isProcessing ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                <span>처리 중...</span>
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">auto_awesome</span>
                                <span>AI로 분석하기</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddGrantModal;

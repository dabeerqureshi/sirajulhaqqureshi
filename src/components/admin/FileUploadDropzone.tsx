'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FileUploadDropzoneProps {
  label: string;
  sublabel?: string;
  accept: string; // e.g. "image/png, image/jpeg, image/webp" or "application/pdf" or "image/*, application/pdf"
  allowedExtensionsText: string; // e.g. "PNG, JPEG, WEBP" or "PDF"
  maxSizeMB?: number;
  value?: string | null;
  onFileSelect: (fileDataUrl: string, fileName: string, fileType: string) => void;
  onClear?: () => void;
}

export default function FileUploadDropzone({
  label,
  sublabel,
  accept,
  allowedExtensionsText,
  maxSizeMB = 25,
  value,
  onFileSelect,
  onClear
}: FileUploadDropzoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const processFile = (file: File) => {
    setErrorMessage(null);

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds maximum size limit of ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setSelectedFileName(file.name);
      setSelectedFileType(file.type);
      onFileSelect(dataUrl, file.name, file.type);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file.');
    };

    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFileName(null);
    setSelectedFileType(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onClear) onClear();
  };

  const isImage = value && (value.startsWith('data:image') || value.includes('unsplash') || value.endsWith('.jpg') || value.endsWith('.png'));
  const isPdf = value && (value.startsWith('data:application/pdf') || value.endsWith('.pdf'));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-[11px] text-stone-400 font-medium">
          Allowed: {allowedExtensionsText} (Max {maxSizeMB}MB)
        </span>
      </div>

      {sublabel && (
        <p className="text-xs text-stone-500">{sublabel}</p>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File Upload Active Preview */}
      {value ? (
        <div className="relative p-4 rounded-xl border border-stone-200 bg-stone-50/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            {isImage ? (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-stone-200 shrink-0 bg-stone-900">
                <img src={value} alt="Preview" className="w-full h-full object-cover" />
              </div>
            ) : isPdf ? (
              <div className="w-16 h-16 rounded-lg bg-rose-100 text-rose-700 flex flex-col items-center justify-center shrink-0 border border-rose-200">
                <FileText className="w-7 h-7" />
                <span className="text-[10px] font-bold mt-0.5">PDF</span>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7" />
              </div>
            )}

            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-stone-800 truncate">
                {selectedFileName || 'Attached Asset'}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Ready to publish</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-stone-300 text-stone-700 hover:bg-stone-50"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-amber-700 bg-amber-50/70'
              : 'border-stone-300 bg-stone-50/50 hover:bg-stone-50 hover:border-amber-600'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />

          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center mx-auto mb-3">
            <UploadCloud className="w-6 h-6 text-amber-800" />
          </div>

          <p className="text-sm font-semibold text-stone-800">
            Click to upload or drag & drop
          </p>
          <p className="text-xs text-stone-500 mt-1">
            Accepts {allowedExtensionsText} (Up to {maxSizeMB}MB)
          </p>
        </div>
      )}
    </div>
  );
}

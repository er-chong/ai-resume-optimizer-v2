"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, CheckCircle } from "lucide-react";
import { clsx } from "clsx";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
}

export default function FileUpload({
  onFileSelect,
  selectedFile,
  onClear,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validExtensions = [".pdf", ".docx"];

    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));

    if (!validTypes.includes(file.type) && !validExtensions.includes(ext)) {
      setError("请上传 PDF 或 Word 文件（.pdf, .docx）");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("文件大小不能超过 10MB");
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && validateFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (selectedFile) {
    return (
      <div className="border-2 border-green-200 rounded-xl p-6 bg-green-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <button
            onClick={onClear}
            className="p-2 hover:bg-green-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
        isDragging
          ? "border-primary-500 bg-primary-50"
          : "border-gray-300 hover:border-primary-400 hover:bg-gray-50",
        error && "border-red-300 bg-red-50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-input")?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
        {error ? (
          <X className="w-8 h-8 text-red-500" />
        ) : (
          <Upload className="w-8 h-8 text-gray-400" />
        )}
      </div>

      <p className="text-lg font-medium text-gray-700 mb-1">
        {error ? error : "拖拽简历文件到此处，或点击上传"}
      </p>
      <p className="text-sm text-gray-500">支持 PDF 和 Word 格式，最大 10MB</p>
    </div>
  );
}

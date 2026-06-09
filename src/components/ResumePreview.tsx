"use client";

import { FileText, ArrowRight } from "lucide-react";
import { ParsedResume } from "@/lib/types";

interface ResumePreviewProps {
  resume: ParsedResume | null;
  onStartAction: () => void;
  actionLabel: string;
  isLoading?: boolean;
}

export default function ResumePreview({
  resume,
  onStartAction,
  actionLabel,
  isLoading,
}: ResumePreviewProps) {
  if (!resume) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-500" />
          <div>
            <h3 className="font-medium text-gray-900">{resume.fileName}</h3>
            <p className="text-sm text-gray-500">
              识别到 {resume.sections.length} 个简历段落
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 max-h-96 overflow-y-auto">
        {resume.sections.map((section, index) => (
          <div key={index} className="mb-6 last:mb-0">
            <h4 className="text-sm font-medium text-primary-600 mb-2">
              {section.title}
            </h4>
            <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
              {section.content}
            </p>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={onStartAction}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>处理中...</span>
            </>
          ) : (
            <>
              <span>{actionLabel}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

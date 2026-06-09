"use client";

import { CheckCircle, AlertCircle, Copy, Download } from "lucide-react";
import { OptimizationResult } from "@/lib/types";
import { useState } from "react";

interface OptimizationResultViewProps {
  result: OptimizationResult;
  onCopy: () => void;
  onExport: () => void;
}

export default function OptimizationResultView({
  result,
  onCopy,
  onExport,
}: OptimizationResultViewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-green-50 px-6 py-4 border-b border-green-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-900">优化完成</h3>
              <p className="text-sm text-green-700">
                已优化 {result.optimizedSections.length} 个简历段落
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCopy}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Copy className="w-4 h-4" />
              复制
            </button>
            <button
              onClick={onExport}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-h-[500px] overflow-y-auto space-y-6">
        {result.optimizedSections.map((section, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">{section.original.title}</h4>
            </div>

            <div className="grid md:grid-cols-2 divide-x divide-gray-200">
              <div className="p-4">
                <p className="text-xs font-medium text-gray-500 mb-2">原文</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {section.original.content}
                </p>
              </div>

              <div className="p-4 bg-green-50">
                <p className="text-xs font-medium text-green-600 mb-2">优化后</p>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {section.optimized.content}
                </p>
              </div>
            </div>

            {section.changes.length > 0 && (
              <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
                <div className="flex items-center gap-2 text-xs text-blue-700">
                  <AlertCircle className="w-3 h-3" />
                  {section.changes.join(" | ")}
                </div>
              </div>
            )}
          </div>
        ))}

        {/* 优化总结 */}
        {result.summary && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}

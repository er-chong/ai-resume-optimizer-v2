"use client";

import { AlertTriangle, AlertCircle, CheckCircle, Lightbulb } from "lucide-react";
import { DiagnosisResult } from "@/lib/types";

interface DiagnosisResultProps {
  result: DiagnosisResult;
}

export default function DiagnosisResultView({ result }: DiagnosisResultProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "medium":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "low":
        return <Lightbulb className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-900">诊断报告</h3>
          </div>
          <div className={`text-2xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}/100
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 诊断总结 */}
        {result.summary && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.summary}</p>
          </div>
        )}

        {/* 问题列表 */}
        {result.issues.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">问题与改进建议</h4>
            <div className="space-y-3">
              {result.issues.map((issue, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getSeverityIcon(issue.severity)}
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getSeverityColor(issue.severity)}`}
                    >
                      {issue.severity === "high" ? "严重" : issue.severity === "medium" ? "中等" : "建议"}
                    </span>
                    <span className="text-xs text-gray-500">{issue.category}</span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium mb-1">
                    问题：{issue.description}
                  </p>
                  <p className="text-sm text-gray-600">
                    建议：{issue.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { CheckCircle, AlertCircle, XCircle, Lightbulb, Target } from "lucide-react";
import { MatchResult } from "@/lib/types";

interface MatchResultViewProps {
  result: MatchResult;
}

export default function MatchResultView({ result }: MatchResultViewProps) {
  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case "strengthen":
        return <Target className="w-4 h-4 text-blue-600" />;
      case "add":
        return <Lightbulb className="w-4 h-4 text-yellow-600" />;
      case "highlight":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return null;
    }
  };

  const getSuggestionLabel = (type: string) => {
    switch (type) {
      case "strengthen":
        return "强化经历";
      case "add":
        return "补充技能";
      case "highlight":
        return "突出能力";
      default:
        return "";
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-purple-600" />
            <h3 className="font-medium text-purple-900">岗位匹配报告</h3>
          </div>
          <div className={`text-2xl font-bold ${getMatchScoreColor(result.matchScore)}`}>
            {result.matchScore}%
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* 匹配总结 */}
        {result.summary && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.summary}</p>
          </div>
        )}

        {/* 技能匹配情况 */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* 已匹配技能 */}
          <div>
            <h4 className="font-medium text-green-700 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              已匹配技能 ({result.matchedSkills.length})
            </h4>
            <div className="space-y-2">
              {result.matchedSkills.map((skill, index) => (
                <div
                  key={index}
                  className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800"
                >
                  {skill}
                </div>
              ))}
              {result.matchedSkills.length === 0 && (
                <p className="text-sm text-gray-500">暂无匹配技能</p>
              )}
            </div>
          </div>

          {/* 缺少技能 */}
          <div>
            <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              缺少技能 ({result.missingSkills.length})
            </h4>
            <div className="space-y-2">
              {result.missingSkills.map((skill, index) => (
                <div
                  key={index}
                  className="p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800"
                >
                  {skill}
                </div>
              ))}
              {result.missingSkills.length === 0 && (
                <p className="text-sm text-gray-500">无明显缺少技能</p>
              )}
            </div>
          </div>
        </div>

        {/* 优化建议 */}
        {result.suggestions.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-600" />
              优化建议
            </h4>
            <div className="space-y-3">
              {result.suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-lg flex items-start gap-3"
                >
                  {getSuggestionIcon(suggestion.type)}
                  <div>
                    <span className="text-xs text-gray-500">
                      {getSuggestionLabel(suggestion.type)}
                    </span>
                    <p className="text-sm text-gray-700">{suggestion.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

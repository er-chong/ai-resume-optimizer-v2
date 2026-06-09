"use client";

import { useState } from "react";
import { Sparkles, Settings, Copy, Download, ArrowLeft } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import ModeSelector from "@/components/ModeSelector";
import ResumePreview from "@/components/ResumePreview";
import DiagnosisResultView from "@/components/DiagnosisResultView";
import OptimizationResultView from "@/components/OptimizationResultView";
import MatchResultView from "@/components/MatchResultView";
import { ParsedResume, DiagnosisResult, OptimizationResult, MatchResult, AIProvider, OptimizationMode } from "@/lib/types";
import { AI_PROVIDERS } from "@/services/ai-service";

export default function HomePage() {
  // 文件状态
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  
  // 模式选择
  const [mode, setMode] = useState<OptimizationMode>("optimize");
  
  // 输入状态
  const [targetPosition, setTargetPosition] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  // AI配置
  const [aiProvider, setAiProvider] = useState<AIProvider>("siliconflow");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  
  // 结果状态
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  
  // UI状态
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理文件上传
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);
    setDiagnosisResult(null);
    setOptimizationResult(null);
    setMatchResult(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "解析文件失败");
      }

      const resume = await response.json();
      setParsedResume(resume);
    } catch (err) {
      console.error("解析文件失败:", err);
      setError(`解析文件失败: ${err}`);
      setSelectedFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 清空
  const handleClear = () => {
    setSelectedFile(null);
    setParsedResume(null);
    setDiagnosisResult(null);
    setOptimizationResult(null);
    setMatchResult(null);
    setError(null);
    setTargetPosition("");
    setJobDescription("");
  };

  // 执行操作
  const handleAction = async () => {
    if (!parsedResume) return;

    const key = apiKey.trim();
    if (!key) {
      setError("请先输入 API Key");
      setShowSettings(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setDiagnosisResult(null);
    setOptimizationResult(null);
    setMatchResult(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2分钟超时

      if (mode === "diagnose" || mode === "both") {
        // 执行诊断
        const response = await fetch("/api/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume: parsedResume,
            provider: aiProvider,
            apiKey: key,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "诊断失败");
        }

        const result = await response.json();
        setDiagnosisResult(result);
      }

      if (mode === "optimize" || mode === "both") {
        // 执行优化
        const response = await fetch("/api/optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume: parsedResume,
            provider: aiProvider,
            apiKey: key,
            targetPosition: targetPosition.trim(),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "优化失败");
        }

        const result = await response.json();
        setOptimizationResult(result);
      }

      if (mode === "match") {
        // 执行岗位匹配
        if (!jobDescription.trim()) {
          throw new Error("请输入岗位描述");
        }

        const response = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume: parsedResume,
            jobDescription: jobDescription.trim(),
            provider: aiProvider,
            apiKey: key,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "匹配分析失败");
        }

        const result = await response.json();
        setMatchResult(result);
      }

      clearTimeout(timeoutId);
    } catch (err: any) {
      console.error("处理失败:", err);
      if (err.name === "AbortError") {
        setError("请求超时，请检查网络连接或尝试使用更快的AI提供商");
      } else {
        setError(`处理失败: ${err.message || err}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 复制结果
  const handleCopy = async () => {
    let content = "";
    if (optimizationResult) {
      content = optimizationResult.optimizedSections
        .map((r) => `${r.optimized.title}\n${r.optimized.content}`)
        .join("\n\n");
    } else if (diagnosisResult) {
      content = JSON.stringify(diagnosisResult, null, 2);
    } else if (matchResult) {
      content = JSON.stringify(matchResult, null, 2);
    }

    if (content) {
      await navigator.clipboard.writeText(content);
      alert("已复制到剪贴板");
    }
  };

  // 导出结果
  const handleExport = () => {
    let content = "";
    let fileName = "";

    if (optimizationResult) {
      content = optimizationResult.optimizedSections
        .map((r) => `${r.optimized.title}\n${r.optimized.content}`)
        .join("\n\n");
      fileName = `优化简历_${selectedFile?.name || "output"}.txt`;
    } else if (diagnosisResult) {
      content = JSON.stringify(diagnosisResult, null, 2);
      fileName = `诊断报告_${selectedFile?.name || "output"}.json`;
    } else if (matchResult) {
      content = JSON.stringify(matchResult, null, 2);
      fileName = `岗位匹配报告_${selectedFile?.name || "output"}.json`;
    }

    if (content) {
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 获取操作按钮文字
  const getActionLabel = () => {
    switch (mode) {
      case "diagnose":
        return "开始诊断分析";
      case "optimize":
        return "开始AI优化";
      case "both":
        return "开始诊断+优化";
      case "match":
        return "开始岗位匹配分析";
    }
  };

  // 检查是否有结果
  const hasResult = diagnosisResult || optimizationResult || matchResult;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">AI 简历优化器 v2.0</h1>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <h3 className="font-medium text-gray-900 mb-3">AI 配置</h3>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  选择 AI 提供商
                </label>
                <select
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as AIProvider)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((key) => (
                    <option key={key} value={key}>
                      {AI_PROVIDERS[key].name}
                      {AI_PROVIDERS[key].free ? " (免费)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-600 mb-1">
                  API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 API Key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              你的 API Key 仅在本地使用，不会发送给任何第三方服务
            </p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* 上传简历 */}
        {!parsedResume && !hasResult && (
          <div className="max-w-xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                上传你的简历
              </h2>
              <p className="text-gray-600">
                支持 PDF 和 Word 格式，AI 将自动分析并优化简历内容
              </p>
            </div>

            <FileUpload
              onFileSelect={handleFileSelect}
              selectedFile={selectedFile}
              onClear={handleClear}
            />
          </div>
        )}

        {/* 模式选择 + 简历预览 */}
        {parsedResume && !hasResult && (
          <div>
            <button
              onClick={handleClear}
              className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> 上传其他文件
            </button>

            <div className="space-y-6">
              {/* 模式选择 */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  选择处理模式
                </h3>
                <ModeSelector
                  selectedMode={mode}
                  onModeChange={setMode}
                />
              </div>

              {/* 目标岗位输入（优化模式） */}
              {(mode === "optimize" || mode === "both") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标岗位 <span className="text-gray-400">(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={targetPosition}
                    onChange={(e) => setTargetPosition(e.target.value)}
                    placeholder="例如：AI产品经理、前端开发工程师、数据分析师"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    输入目标岗位可以让 AI 更精准地优化简历内容
                  </p>
                </div>
              )}

              {/* 岗位描述输入（匹配模式） */}
              {mode === "match" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    目标岗位描述 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="粘贴目标岗位的职责和要求..."
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    粘贴完整的岗位描述（JD），AI将分析你的简历与该岗位的匹配度
                  </p>
                </div>
              )}

              {/* 简历预览 */}
              <ResumePreview
                resume={parsedResume}
                onStartAction={handleAction}
                actionLabel={getActionLabel()}
                isLoading={isLoading}
              />
            </div>
          </div>
        )}

        {/* 结果展示 */}
        {hasResult && (
          <div>
            <button
              onClick={() => {
                setDiagnosisResult(null);
                setOptimizationResult(null);
                setMatchResult(null);
              }}
              className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> 返回重新处理
            </button>

            <div className="space-y-6">
              {/* 诊断结果 */}
              {diagnosisResult && (
                <DiagnosisResultView result={diagnosisResult} />
              )}

              {/* 优化结果 */}
              {optimizationResult && (
                <OptimizationResultView
                  result={optimizationResult}
                  onCopy={handleCopy}
                  onExport={handleExport}
                />
              )}

              {/* 岗位匹配结果 */}
              {matchResult && (
                <MatchResultView result={matchResult} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          <p>使用 AI 技术优化简历，让你的求职更具竞争力</p>
        </div>
      </footer>
    </div>
  );
}

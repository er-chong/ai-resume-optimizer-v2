"use client";

import { CheckCircle, FileText, Sparkles, Target, BarChart3 } from "lucide-react";
import { OptimizationMode } from "@/lib/types";
import { clsx } from "clsx";

interface ModeSelectorProps {
  selectedMode: OptimizationMode;
  onModeChange: (mode: OptimizationMode) => void;
}

const MODES: { mode: OptimizationMode; title: string; description: string; icon: React.ReactNode }[] = [
  {
    mode: "diagnose",
    title: "诊断模式",
    description: "找出简历问题并给出改进建议",
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    mode: "optimize",
    title: "优化模式",
    description: "AI直接优化重写简历内容",
    icon: <Sparkles className="w-5 h-5" />,
  },
  {
    mode: "both",
    title: "诊断+优化",
    description: "先诊断后优化，全面了解",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    mode: "match",
    title: "岗位匹配",
    description: "分析简历与目标岗位的匹配度",
    icon: <Target className="w-5 h-5" />,
  },
];

export default function ModeSelector({ selectedMode, onModeChange }: ModeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {MODES.map(({ mode, title, description, icon }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={clsx(
            "p-4 rounded-xl border-2 transition-all text-left",
            selectedMode === mode
              ? "border-primary-500 bg-primary-50"
              : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <div
              className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                selectedMode === mode
                  ? "bg-primary-100 text-primary-600"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {icon}
            </div>
            <h3 className="font-medium text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </button>
      ))}
    </div>
  );
}

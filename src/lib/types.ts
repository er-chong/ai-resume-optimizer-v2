export interface ResumeSection {
  type: SectionType;
  title: string;
  content: string;
}

export type SectionType = 
  | 'personal'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'other';

export interface ParsedResume {
  fileName: string;
  fileType: 'pdf' | 'docx';
  sections: ResumeSection[];
  rawText: string;
}

export type AIProvider = 'openai' | 'anthropic' | 'qwen' | 'siliconflow';

export type OptimizationMode = 'diagnose' | 'optimize' | 'both' | 'match';

// 诊断结果
export interface DiagnosisResult {
  score: number;                    // 总体评分 0-100
  issues: DiagnosisIssue[];
  summary: string;                  // 诊断总结
}

export interface DiagnosisIssue {
  category: string;                 // 问题类别
  severity: 'high' | 'medium' | 'low';
  description: string;              // 问题描述
  suggestion: string;               // 改进建议
}

// 优化结果
export interface OptimizationResult {
  optimizedSections: OptimizedSection[];
  summary: string;                  // 优化总结
}

export interface OptimizedSection {
  original: ResumeSection;
  optimized: ResumeSection;
  changes: string[];                // 修改说明
}

// 岗位匹配结果
export interface MatchResult {
  matchScore: number;               // 匹配度 0-100
  matchedSkills: string[];          // 已匹配技能
  missingSkills: string[];          // 缺少的技能
  suggestions: MatchSuggestion[];
  summary: string;                  // 匹配总结
}

export interface MatchSuggestion {
  type: 'strengthen' | 'add' | 'highlight';
  content: string;
}

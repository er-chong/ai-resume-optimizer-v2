// AI 优化服务 - 支持多种AI厂商

import { ParsedResume, ResumeSection, OptimizationResult, DiagnosisResult, MatchResult, AIProvider } from "@/lib/types";
import { generateDiagnosisPrompt, generateOptimizePrompt, generateMatchPrompt } from "./prompts";

// 清理文本中的特殊字符
function cleanText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/[\uD800-\uDFFF]/g, "")
    .replace(/[\uFFFE\uFFFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// AI厂商配置
export const AI_PROVIDERS: Record<AIProvider, { name: string; model: string; free: boolean }> = {
  openai: { name: "OpenAI (GPT)", model: "gpt-4o-mini", free: false },
  anthropic: { name: "Anthropic (Claude)", model: "claude-3-5-haiku-20241022", free: false },
  qwen: { name: "阿里云百炼 (Qwen)", model: "qwen-plus", free: true },
  siliconflow: { name: "硅基流动 (免费)", model: "Qwen/Qwen2.5-7B-Instruct", free: true },
};

// 调用 OpenAI API
async function callOpenAI(apiKey: string, content: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_PROVIDERS.openai.model,
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 调用 Anthropic Claude API
async function callAnthropic(apiKey: string, content: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AI_PROVIDERS.anthropic.model,
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// 调用阿里云百炼（通义千问）API
async function callQwen(apiKey: string, content: string): Promise<string> {
  const response = await fetch(
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_PROVIDERS.qwen.model,
        messages: [
          {
            role: "user",
            content: content,
          },
        ],
        temperature: 0.7,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`阿里云百炼 API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 调用硅基流动API（免费）
async function callSiliconFlow(apiKey: string, content: string): Promise<string> {
  const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: AI_PROVIDERS.siliconflow.model,
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`硅基流动 API 错误: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 根据提供商调用对应的API
async function callAI(provider: AIProvider, apiKey: string, content: string): Promise<string> {
  switch (provider) {
    case "openai":
      return await callOpenAI(apiKey, content);
    case "anthropic":
      return await callAnthropic(apiKey, content);
    case "qwen":
      return await callQwen(apiKey, content);
    case "siliconflow":
      return await callSiliconFlow(apiKey, content);
    default:
      throw new Error(`不支持的 AI 提供商: ${provider}`);
  }
}

// 诊断简历
export async function diagnoseResume(
  resume: ParsedResume,
  provider: AIProvider,
  apiKey: string
): Promise<DiagnosisResult> {
  const prompt = generateDiagnosisPrompt(resume.rawText);
  const response = await callAI(provider, apiKey, prompt);
  
  // 尝试解析JSON
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("无法解析诊断结果");
  } catch (e) {
    return {
      score: 0,
      issues: [{
        category: "解析错误",
        severity: "high",
        description: "诊断结果解析失败",
        suggestion: response,
      }],
      summary: response,
    };
  }
}

// 优化简历
export async function optimizeResume(
  resume: ParsedResume,
  provider: AIProvider,
  apiKey: string,
  targetPosition?: string
): Promise<OptimizationResult> {
  const prompt = generateOptimizePrompt(resume.rawText, targetPosition);
  const optimizedContent = await callAI(provider, apiKey, prompt);
  
  return {
    optimizedSections: resume.sections.map((section, index) => ({
      original: section,
      optimized: {
        ...section,
        content: cleanText(optimizedContent),
      },
      changes: [`已根据优化规则重写${section.title}部分`],
    })),
    summary: cleanText(optimizedContent),
  };
}

// 岗位匹配分析
export async function analyzeJobMatch(
  resume: ParsedResume,
  jobDescription: string,
  provider: AIProvider,
  apiKey: string
): Promise<MatchResult> {
  const prompt = generateMatchPrompt(resume.rawText, jobDescription);
  const response = await callAI(provider, apiKey, prompt);
  
  // 尝试解析JSON
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("无法解析匹配结果");
  } catch (e) {
    return {
      matchScore: 0,
      matchedSkills: [],
      missingSkills: [],
      suggestions: [],
      summary: response,
    };
  }
}

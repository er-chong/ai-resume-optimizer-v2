# 技术架构文档 - AI简历优化器 v2.0

## 1. 技术栈概览

### 1.1 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14+ | React框架，SSR/SSG支持 |
| React | 18+ | UI组件库 |
| TypeScript | 5+ | 类型安全 |
| Tailwind CSS | 3+ | 原子化CSS |
| Lucide React | 最新 | 图标库 |

### 1.2 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js API Routes | 14+ | API接口 |
| pdf-parse | 最新 | PDF文件解析 |
| mammoth | 最新 | Word文件解析 |

### 1.3 AI服务提供商
| 提供商 | 模型 | 特点 |
|--------|------|------|
| OpenAI | gpt-4o-mini | 高质量，需要API Key |
| Anthropic | claude-3-5-haiku | 长文本处理优秀 |
| 阿里云百炼 | qwen-plus | 国内服务，中文优化好 |
| 硅基流动 | Qwen2.5-7B | 完全免费，国内服务 |

## 2. 项目结构

```
ai-resume-optimizer-v2/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API路由
│   │   │   ├── upload/               # 文件上传接口
│   │   │   │   └── route.ts          # 处理简历上传和解析
│   │   │   ├── diagnose/             # 简历诊断接口
│   │   │   │   └── route.ts          # AI诊断简历问题
│   │   │   ├── optimize/             # AI优化接口
│   │   │   │   └── route.ts          # AI优化重写简历
│   │   │   └── match/                # 岗位匹配接口
│   │   │       └── route.ts          # 分析岗位匹配度
│   │   ├── layout.tsx                # 根布局
│   │   ├── page.tsx                  # 主页面
│   │   └── globals.css               # 全局样式
│   ├── components/                   # React组件
│   │   ├── FileUpload.tsx            # 文件上传组件
│   │   ├── ModeSelector.tsx          # 模式选择器
│   │   ├── JobInput.tsx              # 目标岗位输入
│   │   ├── DiagnosisResult.tsx       # 诊断结果展示
│   │   ├── OptimizationResult.tsx    # 优化结果展示
│   │   ├── MatchResult.tsx           # 匹配结果展示
│   │   └── ExportButtons.tsx         # 导出按钮组件
│   ├── lib/
│   │   └── types.ts                  # TypeScript类型定义
│   └── services/
│       ├── parser.ts                 # 文件解析服务
│       ├── ai-service.ts             # AI服务集成
│       └── prompts.ts                # AI提示词管理
├── public/                           # 静态资源
├── package.json                      # 项目依赖
└── ...
```

## 3. 核心模块设计

### 3.1 文件解析服务 (parser.ts)

```typescript
// 核心功能
interface ParsedResume {
  fileName: string;
  fileType: 'pdf' | 'docx';
  sections: ResumeSection[];
  rawText: string;
}

interface ResumeSection {
  type: SectionType;
  title: string;
  content: string;
}

// 主要函数
async function parseFile(buffer: Buffer, fileName: string): Promise<ParsedResume>
async function parsePDF(buffer: Buffer): Promise<string>
async function parseWord(buffer: Buffer): Promise<string>
function cleanText(text: string): string
```

### 3.2 AI服务集成 (ai-service.ts)

```typescript
// AI提供商类型
type AIProvider = 'openai' | 'anthropic' | 'qwen' | 'siliconflow';

// 核心功能
async function diagnoseResume(content: string, provider: AIProvider, apiKey: string): Promise<DiagnosisResult>
async function optimizeResume(content: string, targetPosition?: string, provider: AIProvider, apiKey: string): Promise<OptimizationResult>
async function analyzeJobMatch(resume: string, jobDescription: string, provider: AIProvider, apiKey: string): Promise<MatchResult>

// 内部函数
async function callOpenAI(apiKey: string, messages: Message[]): Promise<string>
async function callAnthropic(apiKey: string, messages: Message[]): Promise<string>
async function callQwen(apiKey: string, messages: Message[]): Promise<string>
async function callSiliconFlow(apiKey: string, messages: Message[]): Promise<string>
```

### 3.3 提示词管理 (prompts.ts)

```typescript
// 诊断模式提示词
function generateDiagnosisPrompt(resume: string): string

// 优化模式提示词
function generateOptimizePrompt(resume: string, targetPosition?: string): string

// 岗位匹配提示词
function generateMatchPrompt(resume: string, jobDescription: string): string

// 岗位关键词库
const POSITION_KEYWORDS: Record<string, string[]>
```

## 4. API接口设计

### 4.1 文件上传接口 `/api/upload`

```typescript
// 请求
POST /api/upload
Content-Type: multipart/form-data
Body: File (PDF/DOCX)

// 响应
{
  fileName: string;
  fileType: 'pdf' | 'docx';
  sections: ResumeSection[];
  rawText: string;
}
```

### 4.2 诊断接口 `/api/diagnose`

```typescript
// 请求
POST /api/diagnose
Content-Type: application/json
Body: {
  resume: ParsedResume;
  provider: AIProvider;
  apiKey: string;
}

// 响应
{
  score: number;                    // 总体评分 0-100
  issues: {
    category: string;               // 问题类别
    severity: 'high' | 'medium' | 'low';
    description: string;            // 问题描述
    suggestion: string;             // 改进建议
  }[];
  summary: string;                  // 诊断总结
}
```

### 4.3 优化接口 `/api/optimize`

```typescript
// 请求
POST /api/optimize
Content-Type: application/json
Body: {
  resume: ParsedResume;
  targetPosition?: string;
  provider: AIProvider;
  apiKey: string;
}

// 响应
{
  optimizedSections: {
    original: ResumeSection;
    optimized: ResumeSection;
    changes: string[];              // 修改说明
  }[];
  summary: string;                  // 优化总结
}
```

### 4.4 岗位匹配接口 `/api/match`

```typescript
// 请求
POST /api/match
Content-Type: application/json
Body: {
  resume: ParsedResume;
  jobDescription: string;
  provider: AIProvider;
  apiKey: string;
}

// 响应
{
  matchScore: number;               // 匹配度 0-100
  matchedSkills: string[];          // 已匹配技能
  missingSkills: string[];          // 缺少的技能
  suggestions: {
    type: 'strengthen' | 'add' | 'highlight';
    content: string;
  }[];
  summary: string;                  // 匹配总结
}
```

## 5. 状态管理

### 5.1 主页面状态

```typescript
interface AppState {
  // 文件状态
  selectedFile: File | null;
  parsedResume: ParsedResume | null;
  
  // 模式选择
  mode: 'diagnose' | 'optimize' | 'both' | 'match';
  
  // 输入状态
  targetPosition: string;
  jobDescription: string;
  
  // AI配置
  aiProvider: AIProvider;
  apiKey: string;
  
  // 结果状态
  diagnosisResult: DiagnosisResult | null;
  optimizationResult: OptimizationResult | null;
  matchResult: MatchResult | null;
  
  // UI状态
  isLoading: boolean;
  error: string | null;
  showSettings: boolean;
}
```

## 6. 错误处理

### 6.1 错误类型

| 错误类型 | 处理方式 | 用户提示 |
|---------|---------|---------|
| 文件上传失败 | 重试机制 | "文件上传失败，请重试" |
| 文件解析失败 | 备用解析方法 | "文件解析失败，请尝试其他格式" |
| API超时 | 超时提示 | "请求超时，请检查网络连接" |
| AI服务错误 | 错误详情展示 | "AI服务错误：[具体错误]" |
| 网络错误 | 重试建议 | "网络错误，请检查连接后重试" |

### 6.2 超时设置
- 文件上传：30秒
- AI诊断：60秒
- AI优化：90秒
- 岗位匹配：60秒

## 7. 性能优化

### 7.1 前端优化
- 组件懒加载
- 图片优化（Next.js Image）
- 代码分割
- 缓存策略

### 7.2 后端优化
- 文件流式处理
- 并发请求控制
- 响应压缩
- 错误快速返回

## 8. 安全考虑

### 8.1 数据安全
- API Key本地存储，不上传
- 文件处理后自动清理
- 无服务器端存储

### 8.2 输入验证
- 文件类型验证（PDF/DOCX）
- 文件大小限制（10MB）
- API Key格式验证

## 9. 扩展性设计

### 9.1 支持新AI提供商
```typescript
// 只需在 ai-service.ts 中添加新的调用函数
async function callNewProvider(apiKey: string, messages: Message[]): Promise<string>

// 在 AI_PROVIDERS 配置中添加
const AI_PROVIDERS = {
  // ... 现有配置
  newProvider: { name: '新提供商', model: '模型名', free: false }
}
```

### 9.2 支持新模板
```typescript
// 在 prompts.ts 中添加新的提示词模板
function generateNewTemplate(resume: string, options: TemplateOptions): string
```

### 9.3 支持多语言
```typescript
// 添加语言配置
type Language = 'zh' | 'en' | 'ja';

// 根据语言选择对应提示词
function getPromptByLanguage(language: Language): PromptTemplates
```

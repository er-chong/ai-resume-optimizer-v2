# AI 产品设计心得 #2：踩坑实录——AI 简历优化器的技术挑战与解决方案

> **前言**：这篇文章记录我在开发 AI 简历优化器过程中遇到的真实技术挑战和解决方案。希望能帮到正在开发 AI 应用的你。

## 一、文件解析：中文字符的"编码陷阱"

### 问题描述

用户上传中文简历后，AI 返回错误：

```
TypeError: Cannot convert argument to a ByteString because the character 
at index 164 has a value of 20803 which is greater than 255.
```

### 根本原因

PDF 和 Word 文件中的中文字符在传输到 AI API 时，某些 HTTP 库要求 ByteString（仅支持 0-255 的字符），而中文字符的 Unicode 值远超这个范围。

### 错误的解决方案

**❌ 方案 1：直接转义**

```typescript
// 问题：转义后 AI 无法理解内容
const encoded = encodeURIComponent(chineseText);
```

**❌ 方案 2：强制转换**

```typescript
// 问题：丢失中文字符
const byteString = text.split('').map(char => char.charCodeAt(0) & 0xFF).join('');
```

### 正确的解决方案

**✅ 文本清理函数**

```typescript
function cleanText(text: string): string {
  if (!text) return '';
  
  return text
    // 1. 移除控制字符（但保留换行、制表符）
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    // 2. 移除 Unicode 代理对（无效字符）
    .replace(/[\uDC00-\uDFFF]/g, '')
    // 3. 移除零宽字符
    .replace(/[\u200B-\u200F\uFEFF]/g, '')
    // 4. 规范化空白字符
    .replace(/\s+/g, ' ')
    // 5. 保留所有可见字符（包括中文、emoji 等）
    .trim();
}

// 在发送到 AI 之前清理
const cleanedResume = cleanText(parsedResume.rawText);
```

**关键点：**

- ✅ 只移除真正有害的控制字符
- ✅ 保留所有可见字符（中文、日文、emoji 等）
- ✅ 规范化空白字符，提高可读性

### 额外优化：多解析方法备用

```typescript
async function parseWord(buffer: Buffer): Promise<string> {
  try {
    // 方法 1：mammoth（推荐，保留格式）
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  } catch (error) {
    try {
      // 方法 2：作为 ZIP 解压（备用方案）
      // Word 文件本质是 ZIP，可以提取 XML 解析
      return await parseWordAsZip(buffer);
    } catch {
      throw new Error('无法解析 Word 文件，请尝试转换为 PDF 后重新上传');
    }
  }
}
```

## 二、API 超时：网络问题的优雅处理

### 问题场景

用户反馈：

```
优化失败：TypeError: Failed to fetch
优化失败：TypeError: fetch failed
[cause]: ConnectTimeoutError: Connect Timeout Error
```

### 原因分析

1. **海外 AI 服务连接不稳定**（OpenAI、Anthropic）
2. **默认超时时间太短**（通常 10 秒）
3. **没有重试机制**

### 解决方案

#### 1. 分层超时设置

```typescript
// 不同操作设置不同超时时间
const TIMEOUT_CONFIG = {
  FILE_UPLOAD: 30 * 1000,      // 30 秒
  AI_DIAGNOSIS: 60 * 1000,     // 60 秒
  AI_OPTIMIZATION: 90 * 1000,  // 90 秒（最耗时）
  JOB_MATCH: 60 * 1000,        // 60 秒
};

// 实现带超时的 fetch
async function fetchWithTimeout(
  url: string, 
  options: RequestInit, 
  timeoutMs: number
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`请求超时（${timeoutMs / 1000}秒），请重试`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

#### 2. 前端超时提示

```typescript
const handleStartOptimization = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    setError('优化请求超时（5 分钟），请检查网络连接或更换 AI 服务商');
    setIsLoading(false);
  }, 5 * 60 * 1000); // 5 分钟超时
  
  try {
    const response = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resume: parsedResume,
        targetPosition,
        provider: aiProvider,
        apiKey,
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    // ... 处理响应
  } catch (error) {
    clearTimeout(timeoutId);
    // ... 错误处理
  }
};
```

#### 3. 推荐国内 AI 服务

```typescript
// 在界面上明确标注
const AI_PROVIDERS = {
  qwen: { 
    name: '阿里云百炼', 
    free: true,
    description: '国内服务，稳定快速，免费额度',
    recommended: true  // 标注推荐
  },
  siliconflow: { 
    name: '硅基流动', 
    free: true,
    description: '完全免费，国内服务',
    recommended: true
  },
  openai: { 
    name: 'OpenAI', 
    free: false,
    description: '需要稳定的国际网络连接',
    warning: '可能因网络问题超时'
  },
};
```

## 三、提示词工程：从"能用"到"好用"的迭代

### 第一版：过于简单

```
请优化这份简历
```

**问题：** AI 不知道优化的标准是什么，输出质量不稳定。

### 第二版：添加规则

```
你是一名资深 HR，请优化这份简历

优化标准：
1. 量化成果
2. STAR 法则
3. 专业术语
```

**问题：** 有改进，但格式混乱，用户看不懂。

### 第三版：结构化输出

```typescript
function generateOptimizePrompt(resume: string, targetPosition?: string) {
  return `
你是一名资深 HR，请根据以下规则优化简历：

【优化规则】
1. 语言风格
   - 使用专业、简洁的商务语言
   - 避免口语化表达
   - 动词开头（主导、负责、优化、实现）

2. 成果量化
   - 每项工作经历必须包含具体数字
   - 使用"从 X 提升到 Y"的格式
   - 量化指标：效率提升%、成本节省金额、用户增长数

3. STAR 法则
   - 情境 (Situation)：项目背景
   - 任务 (Task)：你的职责
   - 行动 (Action)：你做了什么
   - 结果 (Result)：取得什么成果

4. 关键词优化
   ${targetPosition ? `- 目标岗位：${targetPosition}` : ''}
   ${targetPosition ? `- 融入相关岗位关键词` : ''}

5. 格式要求
   - 每段经历 2-4 个 bullet points
   - 每个 bullet point 1-2 行
   - 使用分号、逗号分隔，避免过长句子

【输出格式】
优化后的简历内容（保持原有结构）：

### 工作经历

**公司名称** | 职位名称
202X.XX - 202X.XX

• 优化后的工作内容 1（量化成果）
• 优化后的工作内容 2（量化成果）
• 优化后的工作内容 3（量化成果）

【修改说明】
- 说明主要改进点
- 解释为什么这样修改
`;
}
```

**效果：** 输出质量稳定，格式统一，用户能理解修改原因。

### 关键洞察

**提示词设计的 3 个层次：**

1. **任务描述**：告诉 AI 要做什么
2. **规则约束**：告诉 AI 怎么做
3. **输出示例**：给 AI 看参考格式

**示例的力量：**

```
❌ 没有示例：AI 可能输出任何格式
✅ 有示例：AI 会模仿示例的格式和风格
```

## 四、状态管理：React 复杂表单的挑战

### 问题场景

主页面需要管理：

- 文件上传状态
- 解析后的简历数据
- 用户选择的模式
- 目标岗位输入
- AI 服务商配置
- API Key
- 诊断结果
- 优化结果
- 加载状态
- 错误信息

### 初始方案：分散的 useState

```typescript
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
const [mode, setMode] = useState<OptimizationMode>('diagnose');
const [targetPosition, setTargetPosition] = useState('');
// ... 20+ 个状态
```

**问题：**

- ❌ 状态同步困难
- ❌ 代码难以维护
- ❌ 容易出现状态不一致

### 改进方案：useReducer

```typescript
interface AppState {
  selectedFile: File | null;
  parsedResume: ParsedResume | null;
  mode: OptimizationMode;
  targetPosition: string;
  aiProvider: AIProvider;
  apiKey: string;
  diagnosisResult: DiagnosisResult | null;
  optimizationResult: OptimizationResult | null;
  isLoading: boolean;
  error: string | null;
}

type Action =
  | { type: 'SET_FILE'; payload: File }
  | { type: 'SET_PARSED_RESUME'; payload: ParsedResume }
  | { type: 'SET_MODE'; payload: OptimizationMode }
  | { type: 'SET_TARGET_POSITION'; payload: string }
  | { type: 'SET_AI_PROVIDER'; payload: AIProvider }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_DIAGNOSIS_RESULT'; payload: DiagnosisResult }
  | { type: 'SET_OPTIMIZATION_RESULT'; payload: OptimizationResult }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

function resumeReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FILE':
      return { ...state, selectedFile: action.payload };
    case 'SET_PARSED_RESUME':
      return { ...state, parsedResume: action.payload };
    // ... 其他 case
    case 'RESET':
      return INITIAL_STATE;
    default:
      return state;
  }
}

// 使用
const [state, dispatch] = useReducer(resumeReducer, INITIAL_STATE);
```

**优点：**

- ✅ 状态变更可追踪
- ✅ 相关状态可以原子性更新
- ✅ 便于调试（可以记录 action log）

### 最终方案：Zustand（更简洁）

```typescript
import { create } from 'zustand';

interface ResumeStore {
  // 状态
  selectedFile: File | null;
  parsedResume: ParsedResume | null;
  mode: OptimizationMode;
  targetPosition: string;
  
  // 结果
  diagnosisResult: DiagnosisResult | null;
  optimizationResult: OptimizationResult | null;
  
  // 操作
  setFile: (file: File) => void;
  setParsedResume: (resume: ParsedResume) => void;
  setMode: (mode: OptimizationMode) => void;
  setTargetPosition: (position: string) => void;
  setDiagnosisResult: (result: DiagnosisResult) => void;
  setOptimizationResult: (result: OptimizationResult) => void;
  reset: () => void;
}

const useResumeStore = create<ResumeStore>((set) => ({
  // 初始状态
  selectedFile: null,
  parsedResume: null,
  mode: 'diagnose',
  targetPosition: '',
  diagnosisResult: null,
  optimizationResult: null,
  
  // 操作
  setFile: (file) => set({ selectedFile: file }),
  setParsedResume: (resume) => set({ parsedResume: resume }),
  setMode: (mode) => set({ mode }),
  setTargetPosition: (position) => set({ targetPosition: position }),
  setDiagnosisResult: (result) => set({ diagnosisResult: result }),
  setOptimizationResult: (result) => set({ optimizationResult: result }),
  reset: () => set({
    selectedFile: null,
    parsedResume: null,
    diagnosisResult: null,
    optimizationResult: null,
    mode: 'diagnose',
    targetPosition: '',
  }),
}));
```

**选择建议：**

- 简单组件：`useState`
- 复杂表单：`useReducer`
- 跨组件状态：`Zustand` / `Redux`

## 五、TypeScript 类型安全：血泪教训

### 问题：隐式 any 类型

```typescript
// ❌ 错误示例
<FileUpload onFileSelect={(file) => setSelectedFile(file)} />

// TypeScript 报错：
// JSX 元素隐式具有类型 "any"，因为参数 'file' 没有类型声明
```

### 正确做法

```typescript
// ✅ 方案 1：显式声明事件类型
<FileUpload 
  onFileSelect={(file: File) => setSelectedFile(file)} 
/>

// ✅ 方案 2：使用 React 事件类型
const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    setSelectedFile(file);
  }
};

// ✅ 方案 3：在组件定义时声明类型
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  acceptedTypes = ['pdf', 'docx'],
  maxSize = 10 * 1024 * 1024,
}) => {
  // ...
};
```

### 类型定义的最佳实践

```typescript
// ❌ 不好的做法：到处用 any
interface ParsedResume {
  fileName: any;
  fileType: any;
  sections: any[];
}

// ✅ 好的做法：完整的类型定义
type SectionType = 
  | 'personal_info'
  | 'work_experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications';

interface ResumeSection {
  type: SectionType;
  title: string;
  content: string;
  bulletPoints?: string[];
}

interface ParsedResume {
  fileName: string;
  fileType: 'pdf' | 'docx';
  sections: ResumeSection[];
  rawText: string;
  metadata?: {
    fileSize: number;
    uploadTime: string;
    parseMethod: string;
  };
}
```

**收益：**

- ✅ 编译时错误检查
- ✅ IDE 智能提示
- ✅ 重构更安全
- ✅ 文档即代码

## 六、性能优化：意想不到的瓶颈

### 问题：大文件上传卡顿

用户上传 10MB 的 PDF 文件时，界面卡死 5 秒。

### 原因

文件解析是同步操作，阻塞了主线程。

```typescript
// ❌ 同步解析（错误）
const handleUpload = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // 同步解析，阻塞主线程
  const parsed = parsePDF(buffer);  // 耗时 3-5 秒
  
  setParsedResume(parsed);  // 界面卡在这里
};
```

### 解决方案：Web Worker

```typescript
// ✅ 使用 Web Worker 异步解析
// worker/file-parser.worker.ts
const worker = new Worker();

worker.onmessage = (event) => {
  const { parsedResume, error } = event.data;
  if (error) {
    setError(error);
  } else {
    setParsedResume(parsedResume);
  }
  setIsLoading(false);
};

const handleUpload = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  
  // 发送到 Worker，不阻塞主线程
  worker.postMessage({ 
    file: arrayBuffer, 
    fileName: file.name,
    fileType: file.name.endsWith('.pdf') ? 'pdf' : 'docx'
  });
};
```

**效果：**

- ❌ 优化前：界面卡死 5 秒
- ✅ 优化后：界面流畅，显示进度条

### 另一个优化：懒加载组件

```typescript
// ❌ 一次性加载所有组件
import DiagnosisResultView from '@/components/DiagnosisResultView';
import OptimizationResultView from '@/components/OptimizationResultView';
import MatchResultView from '@/components/MatchResultView';

// ✅ 按需懒加载
import dynamic from 'next/dynamic';

const DiagnosisResultView = dynamic(
  () => import('@/components/DiagnosisResultView'),
  { loading: () => <p>加载中...</p> }
);

const OptimizationResultView = dynamic(
  () => import('@/components/OptimizationResultView'),
  { loading: () => <p>加载中...</p> }
);
```

## 七、总结：AI 应用开发的 7 条军规

### 1. 文本清理是必须的
```typescript
function cleanText(text: string): string {
  // 移除控制字符，保留可见字符
}
```

### 2. 超时处理要分层
```typescript
const TIMEOUT_CONFIG = {
  FILE_UPLOAD: 30 * 1000,
  AI_OPTIMIZATION: 90 * 1000,
};
```

### 3. 提示词需要结构化
```
任务描述 + 规则约束 + 输出示例 = 高质量输出
```

### 4. 状态管理要趁早
```
简单用 useState，复杂用 useReducer，跨组件用 Zustand
```

### 5. TypeScript 类型要完整
```typescript
// 拒绝 any，定义完整的类型系统
```

### 6. 性能优化要前置
```
大文件处理用 Web Worker，组件按需懒加载
```

### 7. 错误处理要友好
```typescript
// 不只是 throw error，要告诉用户：
// 1. 发生了什么
// 2. 为什么发生
// 3. 如何解决
```

---

**最后的建议**

开发 AI 应用，技术只有一半，另一半是**对人性的理解**：

- 用户需要透明，不要黑盒
- 用户需要控制，不要强制
- 用户需要理解，不要猜测

希望这些经验能帮到你！

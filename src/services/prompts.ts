// AI 提示词管理

import { AIProvider, DiagnosisResult, OptimizationResult, MatchResult } from "@/lib/types";

// 岗位关键词映射
const POSITION_KEYWORDS: Record<string, string[]> = {
  "ai产品经理": ["AI产品", "大模型", "LLM", "RAG", "Prompt工程", "模型选型", "AI落地", "智能化"],
  "产品经理": ["产品设计", "需求分析", "用户增长", "数据驱动", "迭代优化", "商业化", "产品策略"],
  "前端开发": ["React", "Vue", "TypeScript", "性能优化", "响应式设计", "组件化", "微前端"],
  "后端开发": ["Java", "Go", "微服务", "高并发", "数据库优化", "API设计", "分布式"],
  "算法工程师": ["机器学习", "深度学习", "NLP", "推荐系统", "模型训练", "特征工程"],
  "数据分析师": ["数据分析", "SQL", "Python", "数据可视化", "BI工具", "数据建模"],
  "数据科学家": ["数据挖掘", "统计分析", "机器学习", "数据工程", "预测建模"],
  "测试工程师": ["自动化测试", "功能测试", "性能测试", "测试框架", "质量保障"],
  "运维工程师": ["DevOps", "CI/CD", "容器化", "K8s", "监控告警", "云原生"],
  "UI设计师": ["UI设计", "Figma", "用户体验", "交互设计", "设计系统"],
  "运营": ["用户运营", "活动运营", "内容运营", "增长策略", "数据分析"],
  "市场营销": ["品牌推广", "转化率", "ROI", "广告投放", "市场调研"],
  "人力资源": ["招聘", "绩效管理", "培训发展", "员工关系", "组织发展"],
  "财务": ["财务分析", "预算管理", "成本控制", "财务报表", "合规审计"],
  "项目经理": ["项目管理", "进度把控", "风险管理", "跨团队协作", "敏捷开发"],
};

// 根据岗位获取关键词
export function getPositionKeywords(position: string): string[] {
  const lowerPosition = position.toLowerCase();
  
  // 精确匹配
  for (const [key, keywords] of Object.entries(POSITION_KEYWORDS)) {
    if (lowerPosition.includes(key)) {
      return keywords;
    }
  }
  
  return ["项目管理", "团队协作", "沟通协调", "问题解决", "责任心"];
}

// 根据岗位生成行业描述
export function getIndustryDescription(position: string): string {
  const lowerPosition = position.toLowerCase();
  
  if (lowerPosition.includes("ai") || lowerPosition.includes("人工智能")) {
    return "人工智能领域，包括大模型应用、智能产品开发、AI技术落地";
  }
  if (lowerPosition.includes("产品")) {
    return "互联网产品领域，包括产品设计、用户增长、商业化运营";
  }
  if (lowerPosition.includes("开发") || lowerPosition.includes("工程师")) {
    return "技术开发领域，包括软件开发、系统架构、技术攻关";
  }
  if (lowerPosition.includes("数据")) {
    return "数据领域，包括数据分析、数据挖掘、数据驱动决策";
  }
  if (lowerPosition.includes("运营")) {
    return "运营领域，包括用户运营、活动运营、内容运营";
  }
  if (lowerPosition.includes("市场")) {
    return "市场营销领域，包括品牌推广、广告投放、市场策略";
  }
  
  return "通用职场领域";
}

// 生成诊断模式提示词
export function generateDiagnosisPrompt(resume: string): string {
  return `你的身份是一名资深HR，请找出我的简历中的主要问题，并给出具体的改进建议。

请从以下几个维度审查简历：

1. **内容问题**
   - 描述是否清晰、具体？
   - 是否有量化成果展示？
   - 是否突出了个人贡献？

2. **语言表达**
   - 用词是否专业、准确？
   - 是否有语法或表述问题？
   - 是否避免了模糊词汇（如"参与"、"协助"）？

3. **结构优化**
   - 信息是否按重要性排序？
   - 段落结构是否清晰？

4. **关键词匹配**
   - 简历中是否体现了行业相关能力？

5. **改进建议**
   - 针对每个问题给出具体、可操作的改进建议

简历内容：
${resume}

请以以下JSON格式输出：
{
  "score": 75,
  "issues": [
    {
      "category": "内容问题",
      "severity": "high",
      "description": "工作经历缺乏量化成果",
      "suggestion": "添加具体数字，如'提升效率30%'"
    }
  ],
  "summary": "总体评价..."
}

请直接输出JSON，不要添加其他内容：`;
}

// 生成优化模式提示词
export function generateOptimizePrompt(resume: string, targetPosition?: string): string {
  const keywords = targetPosition ? getPositionKeywords(targetPosition) : [];
  
  return `你是一位资深的简历优化专家，精通各行各业的简历撰写技巧。请按照以下要求严格优化简历内容：

${targetPosition ? `**目标岗位：** ${targetPosition}
**行业领域：** ${getIndustryDescription(targetPosition)}` : ''}

**优化规则（请严格遵守）：**

1. **语言风格**：
   - 使用**动词开头**的行动语句（如"设计"、"开发"、"优化"、"主导"、"负责"）
   - 避免模糊词汇（如"参与"、"协助"、"了解"）
   - 使用专业术语，但保持简洁易懂

2. **成果量化（至关重要）**：
   - 每项经历必须包含可量化的成果
   - 使用具体数字："提升效率30%"、"节省成本50万元"、"服务用户10万+"
   - 包含对比数据：同比增长、环比提升、行业对比

3. **STAR法则**：
   - Situation：背景和挑战
   - Task：职责和目标
   - Action：具体行动
   - Result：量化成果

4. **关键词优化**：
   ${keywords.length > 0 ? `融入以下关键词：${keywords.join("、")}` : `根据内容自动识别行业并融入相关专业术语`}

5. **格式要求（必须遵守）**：
   - 每项经历单独成行，使用"• "开头
   - 使用短句，每句不超过20字
   - 数字和关键数据加粗显示
   - 保持段落清晰，使用空行分隔不同内容

**输出格式示例：**

工作经历
• **主导**电商平台架构重构，优化核心链路性能，响应时间**降低40%**
• **负责**用户增长策略制定，季度新增用户**突破10万**，同比增长**50%**
• **设计**数据分析体系，搭建BI报表平台，决策效率**提升60%**

项目经验
• **产品名称**：智能客服系统 | **角色**：产品负责人 | **周期**：6个月
• **核心职责**：需求分析、原型设计、跨团队协调
• **关键成果**：上线后客服效率**提升80%**，运营成本**降低35%**

---

**原始内容：**
${resume}

---

**请直接输出优化后的简历内容，不要添加任何额外解释：**`;
}

// 生成岗位匹配提示词
export function generateMatchPrompt(resume: string, jobDescription: string): string {
  return `你是一位资深的招聘专家和HR，请分析以下简历与目标岗位描述的匹配度。

**目标岗位描述：**
${jobDescription}

**候选人简历：**
${resume}

请从以下几个维度分析：

1. **技能匹配度**：简历中的技能是否符合岗位要求
2. **经验匹配度**：工作经历是否符合岗位要求
3. **关键词覆盖率**：简历中是否包含岗位JD中的关键词
4. **能力缺口**：缺少的关键能力或经验

请以以下JSON格式输出：
{
  "matchScore": 75,
  "matchedSkills": ["已匹配的技能1", "已匹配的技能2"],
  "missingSkills": ["缺少的技能1", "缺少的技能2"],
  "suggestions": [
    {
      "type": "strengthen",
      "content": "建议在简历中强化XXX经历"
    },
    {
      "type": "add",
      "content": "建议补充XXX关键词"
    }
  ],
  "summary": "总体匹配分析..."
}

其中 type 可以是：
- "strengthen"：建议在简历中强化某经历
- "add"：建议补充某关键词或技能
- "highlight"：建议突出某能力或经验

请直接输出JSON，不要添加其他内容：`;
}

// 文件解析服务 - 支持 PDF 和 Word 文档

import { ParsedResume, ResumeSection, SectionType } from "@/lib/types";

// 清理文本中的特殊字符
function cleanText(text: string): string {
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // 移除控制字符
    .replace(/[\uD800-\uDFFF]/g, "") // 移除无效的 Unicode 代理对
    .replace(/[\uFFFE\uFFFF]/g, "") // 移除特殊标记字符
    .replace(/[\u2000-\u20FF]/g, "") // 移除特殊空格和连字符
    .replace(/[\u2700-\u27BF]/g, "") // 移除符号类字符
    .replace(/[\u2600-\u26FF]/g, "") // 移除杂项符号
    .replace(/[^\x00-\xFF\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af\w\s\n\r\t。，！？、；：（）【】《》""''""''\-]/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

// 段落类型识别
function identifySectionType(title: string, content: string): SectionType {
  const text = (title + " " + content).toLowerCase();
  
  if (/姓名|联系|电话|邮箱|个人/.test(text)) return 'personal';
  if (/总结|简介|概述|自我评价/.test(text)) return 'summary';
  if (/工作|实习|经历|公司/.test(text)) return 'experience';
  if (/教育|学校|大学|学位|学历/.test(text)) return 'education';
  if (/技能|技术|语言|工具|熟悉/.test(text)) return 'skills';
  if (/项目|产品|系统|开发/.test(text)) return 'projects';
  if (/证书|认证|资格/.test(text)) return 'certifications';
  
  return 'other';
}

// 解析简历内容，按段落分割
function parseSections(rawText: string): ResumeSection[] {
  const lines = rawText.split("\n").filter(line => line.trim());
  const sections: ResumeSection[] = [];
  
  let currentTitle = "";
  let currentContent = "";
  let currentType: SectionType = 'other';
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 检查是否是标题（通常是短行或以特定关键词开头）
    const isTitle = 
      trimmedLine.length < 30 && 
      (/(?:^|\s)(?:教育|工作|实习|项目|技能|证书|总结|简介|个人|经验|荣誉|获奖)/.test(trimmedLine) ||
       trimmedLine.endsWith(":") ||
       trimmedLine.endsWith("："));
    
    if (isTitle && currentTitle && currentContent) {
      sections.push({
        type: currentType,
        title: currentTitle,
        content: currentContent.trim(),
      });
      currentTitle = "";
      currentContent = "";
    }
    
    if (isTitle || !currentTitle) {
      if (isTitle) {
        currentTitle = trimmedLine.replace(/[：:]/g, "").trim();
        currentType = identifySectionType(currentTitle, "");
      } else {
        currentContent += trimmedLine + "\n";
      }
    } else {
      currentContent += trimmedLine + "\n";
    }
  }
  
  // 添加最后一个段落
  if (currentTitle || currentContent) {
    sections.push({
      type: currentType || identifySectionType("", currentContent),
      title: currentTitle || "其他信息",
      content: currentContent.trim(),
    });
  }
  
  // 如果没有识别到任何段落，将整个文本作为一个段落
  if (sections.length === 0 && rawText.trim()) {
    sections.push({
      type: 'other',
      title: "简历内容",
      content: rawText.trim(),
    });
  }
  
  return sections;
}

// 解析 PDF 文件
export async function parsePDF(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default;
  const data = await pdfParse(buffer);
  return cleanText(data.text);
}

// 解析 Word 文件
export async function parseWord(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  
  // 方法1: 直接使用 buffer
  try {
    const result = await mammoth.extractRawText({ buffer });
    return cleanText(result.value);
  } catch (error) {
    console.log("方法1 (buffer) 失败:", error);
  }
  
  // 方法2: 使用 Uint8Array
  try {
    const uint8Array = new Uint8Array(buffer);
    const result = await mammoth.extractRawText({ arrayBuffer: uint8Array.buffer });
    return cleanText(result.value);
  } catch (error) {
    console.log("方法2 (arrayBuffer) 失败:", error);
  }
  
  // 方法3: 使用 base64
  try {
    const base64 = buffer.toString('base64');
    const result = await mammoth.extractRawText({ base64 });
    return cleanText(result.value);
  } catch (error) {
    console.log("方法3 (base64) 失败:", error);
  }
  
  throw new Error('所有解析方法都失败了，请尝试使用 PDF 文件');
}

// 根据文件类型解析文件
export async function parseFile(buffer: Buffer, fileName: string): Promise<string> {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  
  if (ext === ".pdf") {
    return await parsePDF(buffer);
  } else if (ext === ".docx") {
    return await parseWord(buffer);
  }
  
  throw new Error("不支持的文件格式，请上传 PDF 或 Word (.docx) 文件");
}

// 解析简历内容
export function parseResumeContent(text: string, fileName: string): ParsedResume {
  const ext = fileName.toLowerCase().slice(fileName.lastIndexOf("."));
  const fileType = ext === ".pdf" ? "pdf" : "docx";
  
  const sections = parseSections(text);
  
  return {
    fileName,
    fileType,
    sections,
    rawText: text,
  };
}

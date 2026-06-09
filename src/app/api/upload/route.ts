import { NextRequest, NextResponse } from "next/server";
import { parseFile, parseResumeContent } from "@/services/parser";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "没有上传文件" },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileName = file.name.toLowerCase();
    const ext = fileName.slice(fileName.lastIndexOf("."));
    if (![".pdf", ".docx"].includes(ext)) {
      return NextResponse.json(
        { error: "仅支持 PDF 和 Word (.docx) 文件" },
        { status: 400 }
      );
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "文件大小不能超过 10MB" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parseFile(buffer, file.name);
    const resume = parseResumeContent(text, file.name);

    return NextResponse.json(resume);
  } catch (error) {
    console.error("文件上传失败:", error);
    return NextResponse.json(
      { error: `文件处理失败: ${error}` },
      { status: 500 }
    );
  }
}

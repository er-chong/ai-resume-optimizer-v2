import { NextRequest, NextResponse } from "next/server";
import { diagnoseResume, AIProvider } from "@/services/ai-service";
import { ParsedResume } from "@/lib/types";

const SUPPORTED_PROVIDERS: AIProvider[] = ["openai", "anthropic", "qwen", "siliconflow"];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resume, provider, apiKey } = body as {
      resume: ParsedResume;
      provider: AIProvider;
      apiKey: string;
    };

    if (!resume || !provider || !apiKey) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    if (!SUPPORTED_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { error: `不支持的 AI 提供商: ${provider}` },
        { status: 400 }
      );
    }

    const result = await diagnoseResume(resume, provider, apiKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error("诊断请求失败:", error);
    return NextResponse.json(
      { error: `诊断失败: ${error}` },
      { status: 500 }
    );
  }
}

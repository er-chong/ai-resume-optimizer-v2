import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI简历优化器 v2.0 - 简历诊断 | AI优化 | 岗位匹配",
  description: "专业的AI简历优化平台，提供简历诊断、AI优化重写、岗位匹配分析功能，助你提升求职竞争力",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}

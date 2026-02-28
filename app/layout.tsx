import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnonymousUserProvider } from "@/components/AnonymousUserProvider";
import { PageViewTracker } from "@/components/PageViewTracker";
import { Analytics } from '@vercel/analytics/react'
import "./globals.css";

// Editorial 杂志风格字体
const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "AI PRD Agent - 智能产品需求文档生成器",
  description: "AI 驱动的产品需求文档生成工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${playfairDisplay.variable} ${lato.variable} antialiased`}
      >
        <AnonymousUserProvider>
          <PageViewTracker />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AnonymousUserProvider>
        <Analytics />
      </body>
    </html>
  );
}

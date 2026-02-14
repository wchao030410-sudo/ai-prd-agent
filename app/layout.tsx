import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AnonymousUserProvider } from "@/components/AnonymousUserProvider";
import { PageViewTracker } from "@/components/PageViewTracker";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnonymousUserProvider>
          <PageViewTracker />
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </AnonymousUserProvider>
      </body>
    </html>
  );
}

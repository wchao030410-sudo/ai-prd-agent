'use client';

import { useRef, useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import remarkGfm from 'remark-gfm';

// 初始化 Mermaid
if (typeof window !== 'undefined') {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
}

interface PRDDocumentPreviewProps {
  content: string;
  title: string;
}

export function PRDDocumentPreview({ content, title }: PRDDocumentPreviewProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Mermaid 组件
  const MermaidBlock = ({ code }: { code: string }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
      if (!mermaidRef.current) return;

      const renderMermaid = async () => {
        try {
          setHasError(false);
          // 检查代码是否为空或无效
          if (!code || code.trim().length < 5) {
            setHasError(true);
            return;
          }
          const id = `mermaid-${Math.random().toString(36).substring(7)}`;
          const { svg } = await mermaid.render(id, code);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (error) {
          console.error('Mermaid render error:', error);
          setHasError(true);
          if (mermaidRef.current) {
            // 错误时显示原始代码，但不显示错误信息
            mermaidRef.current.innerHTML = '';
          }
        }
      };

      renderMermaid();
    }, [code]);

    if (hasError) {
      return null; // 渲染失败时不显示任何内容
    }

    return (
      <div
        ref={mermaidRef}
        className="flex justify-center my-6 p-4 bg-[#F5F3F0] dark:bg-[#1E2532] rounded-sm border border-[#E0E3E8] dark:border-[#2D3748]"
      />
    );
  };

  // 代码块组件
  const CodeBlock = ({ children, className, node, ...props }: any) => {
    // 提取语言类型
    const match = /language-(\w+)/.exec(className || '');

    // 处理 children（可能是字符串或数组）
    const codeContent = Array.isArray(children)
      ? children.join('')
      : String(children || '');

    // 移除可能的 markdown 代码块标记
    const cleanCode = codeContent
      .replace(/^```mermaid\n/, '')
      .replace(/```$/, '')
      .trim();

    // 检查是否是 mermaid 代码块 - 只通过 language 或图表类型关键字判断
    const isMermaidLang = match?.[1] === 'mermaid';
    // 检查代码是否以有效的 mermaid 图表类型开头（更严格的判断）
    const mermaidChartTypes = ['journey', 'flowchart', 'graph', 'mindmap', 'sequencediagram', 'classdiagram', 'statediagram', 'erdiagram', 'gantt', 'pie', 'block', 'c4graph'];
    const startsWithMermaidChart = mermaidChartTypes.some(type =>
      cleanCode.toLowerCase().startsWith(type.toLowerCase())
    ) || /^(TD|BT|RL|LR)/.test(cleanCode);  // 流程图方向

    const isMermaid = isMermaidLang || startsWithMermaidChart;

    if (isMermaid) {
      return <MermaidBlock code={cleanCode || codeContent} />;
    }

    // 检查是否是 pre 标签的子元素（代码块）
    const isPre = node?.parent?.tagName === 'PRE';

    if (!match && !isPre) {
      return <code className="font-mono text-sm bg-[#F1F3F6] dark:bg-[#2D3748] px-1.5 py-0.5 rounded-sm text-[#4A5A7A] dark:text-[#A0AEC0]">{children}</code>;
    }

    return (
      <div className="group relative my-6">
        <div className="flex items-center justify-between px-4 py-2 bg-[#1A1A1A] dark:bg-[#0D1117] rounded-t-sm border-b border-[#2D3748]">
          <span className="text-xs text-[#9AA5B1] dark:text-[#6B7B8C] font-mono">
            {match ? match[1].toUpperCase() : 'CODE'}
          </span>
        </div>
        <pre className="!mt-0 p-4 bg-[#F5F3F0] dark:bg-[#1E2532] rounded-b-sm border border-t-0 border-[#E0E3E8] dark:border-[#2D3748] overflow-x-auto">
          <code className={`font-mono text-sm text-[#1A1A1A] dark:text-[#E2E8F0] ${className || ''}`}>
            {children}
          </code>
        </pre>
      </div>
    );
  };

  // 自定义标题渲染 - 紧凑杂志风格
  const renderHeading = (level: number) => {
    return ({ children, ...props }: any) => {
      if (level === 1) return (
        <h1 className="font-serif text-4xl md:text-5xl mt-12 mb-6 text-[#1A1A1A] dark:text-[#F1F3F6] pb-4 border-b-2 border-[#1A1A1A] dark:border-[#F1F3F6]">
          {children}
        </h1>
      );
      if (level === 2) return (
        <div className="mt-8 mb-4">
          <h2 className="font-serif text-2xl md:text-3xl text-[#1A1A1A] dark:text-[#F1F3F6] pb-2 border-b border-[#E0E3E8] dark:border-[#2D3748]">
            {children}
          </h2>
        </div>
      );
      if (level === 3) return (
        <div className="mt-6 mb-3">
          <h3 className="font-serif text-xl text-[#1A1A1A] dark:text-[#F1F3F6] flex items-center gap-3">
            <span className="w-2 h-2 bg-[#1A1A1A] dark:bg-[#F1F3F6]" />
            {children}
          </h3>
        </div>
      );
      if (level === 4) return (
        <h4 className="font-sans text-lg mt-5 mb-2 font-medium text-[#3A3A3A] dark:text-[#A0AEC0]">
          {children}
        </h4>
      );
      if (level === 5) return (
        <h5 className="font-sans text-base mt-4 mb-1.5 font-medium text-[#3A3A3A] dark:text-[#A0AEC0]">
          {children}
        </h5>
      );
      return (
        <h6 className="font-sans text-sm mt-3 mb-1.5 font-medium text-[#6B7B8C] dark:text-[#6B7B8C]">
          {children}
        </h6>
      );
    };
  };

  return (
    <div className="editorial-paper min-h-screen">
      {/* 主文档内容 */}
      <main className="min-h-screen">
        <div className="max-w-4xl mx-auto px-8 md:px-12 lg:px-16 py-8 md:py-12">
          {/* Markdown 内容 */}
          <div
            ref={contentRef}
            className="font-serif text-lg leading-relaxed text-[#3A3A3A] dark:text-[#A0AEC0]"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: (props: any) => renderHeading(1)(props),
                h2: (props: any) => renderHeading(2)(props),
                h3: (props: any) => renderHeading(3)(props),
                h4: (props: any) => renderHeading(4)(props),
                h5: (props: any) => renderHeading(5)(props),
                h6: (props: any) => renderHeading(6)(props),
                p: ({ children, ...props }: any) => (
                  <p className="font-sans text-base md:text-lg leading-relaxed text-[#3A3A3A] dark:text-[#A0AEC0] mb-5 last:mb-0" {...props}>
                    {children}
                  </p>
                ),
                table: ({ node, ...props }: any) => (
                  <div className="my-6 overflow-hidden rounded-sm border border-[#E0E3E8] dark:border-[#2D3748]">
                    <table {...props} />
                  </div>
                ),
                thead: ({ node, ...props }: any) => (
                  <thead {...props} className="border-b-2 border-[#E0E3E8] dark:border-[#2D3748]" />
                ),
                th: ({ node, ...props }: any) => (
                  <th
                    {...props}
                    className="px-4 py-3 text-left text-xs font-medium text-[#6B7B8C] dark:text-[#9AA5B1] uppercase tracking-wider font-sans border-b border-[#E0E3E8] dark:border-[#2D3748]"
                  />
                ),
                td: ({ node, ...props }: any) => (
                  <td
                    {...props}
                    className="px-4 py-3 text-sm text-[#3A3A3A] dark:text-[#A0AEC0] border-b border-[#E0E3E8]/50 dark:border-[#2D3748]/50 font-sans"
                  />
                ),
                tr: ({ node, ...props }: any) => (
                  <tr {...props} className="border-b border-[#E0E3E8]/30 dark:border-[#2D3748]/30 last:border-0" />
                ),
                blockquote: ({ children, ...props }: any) => (
                  <blockquote className="border-l-4 border-[#1A1A1A] dark:border-[#F1F3F6] pl-6 my-6 py-3 bg-[#F5F3F0] dark:bg-[#1E2532] rounded-r-sm" {...props}>
                    <p className="font-serif text-lg italic text-[#3A3A3A] dark:text-[#A0AEC0] mb-0">
                      {children}
                    </p>
                  </blockquote>
                ),
                ul: ({ children, ...props }: any) => (
                  <ul className="font-sans text-base space-y-2 my-4 list-none pl-0" {...props}>
                    {children}
                  </ul>
                ),
                ol: ({ children, ...props }: any) => (
                  <ol className="font-sans text-base space-y-2 my-4 list-decimal pl-6" {...props}>
                    {children}
                  </ol>
                ),
                li: ({ children, ...props }: any) => (
                  <li className="pl-3 text-[#3A3A3A] dark:text-[#A0AEC0] py-1 border-l-2 border-[#E0E3E8] dark:border-[#2D3748] ml-1" {...props}>
                    {children}
                  </li>
                ),
                hr: ({ node, ...props }: any) => (
                  <hr className="h-px bg-[#1A1A1A]/20 dark:bg-[#F1F3F6]/20 border-0 my-8" {...props} />
                ),
                strong: ({ children, ...props }: any) => (
                  <strong className="font-medium text-[#1A1A1A] dark:text-[#F1F3F6]" {...props}>
                    {children}
                  </strong>
                ),
                em: ({ children, ...props }: any) => (
                  <em className="italic text-[#3A3A3A] dark:text-[#A0AEC0]" {...props}>
                    {children}
                  </em>
                ),
                code: CodeBlock,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* 文档结束标记 */}
          <footer className="mt-16 pt-6 border-t border-[#E0E3E8] dark:border-[#2D3748] text-center">
            <div className="w-12 h-px bg-[#1A1A1A]/30 dark:bg-[#F1F3F6]/30 mx-auto mb-4" />
            <p className="font-sans text-xs text-[#9AA5B1]">
              由 AI PRD Agent 生成
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

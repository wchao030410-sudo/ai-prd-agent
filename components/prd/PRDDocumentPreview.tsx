'use client';

import { useEffect, useRef, useState } from 'react';
import { FileText, Copy, Check } from 'lucide-react';
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

interface HeadingNode {
  id: string;
  level: number;
  text: string;
}

export function PRDDocumentPreview({ content, title }: PRDDocumentPreviewProps) {
  const [headings, setHeadings] = useState<HeadingNode[]>([]);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // 提取标题并生成目录
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!contentRef.current) return;

      const headingElements = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const extractedHeadings: HeadingNode[] = [];

      headingElements.forEach((heading, index) => {
        const id = `heading-${index}`;
        const elem = heading as HTMLElement;
        elem.id = id;
        extractedHeadings.push({
          id,
          level: parseInt(heading.tagName.charAt(1)),
          text: heading.textContent || '',
        });
      });

      setHeadings(extractedHeadings);
    }, 300);

    return () => clearTimeout(timer);
  }, [content]);

  // 监听滚动，高亮当前章节
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current || headings.length === 0) return;

      const headingElements = contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const scrollPosition = window.scrollY + 120;

      for (let i = headingElements.length - 1; i >= 0; i--) {
        const heading = headingElements[i] as HTMLElement;
        if (heading.offsetTop <= scrollPosition) {
          setActiveHeading(heading.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  const scrollToHeading = (id: string) => {
    setTimeout(() => {
      const element = document.getElementById(id);
      if (element) {
        const offset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  // Mermaid 组件
  const MermaidBlock = ({ code }: { code: string }) => {
    const mermaidRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!mermaidRef.current) return;

      const renderMermaid = async () => {
        try {
          const id = `mermaid-${Math.random().toString(36).substring(7)}`;
          const { svg } = await mermaid.render(id, code);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (error) {
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<pre class="text-red-500 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg overflow-auto">${code}</pre>`;
          }
        }
      };

      renderMermaid();
    }, [code]);

    return (
      <div
        ref={mermaidRef}
        className="flex justify-center my-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm"
      />
    );
  };

  // 代码块组件
  const CodeBlock = ({ children, className, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = String(children).replace(/\n$/, '');

    // Mermaid 代码块
    if (match?.[1] === 'mermaid') {
      return <MermaidBlock code={codeContent} />;
    }

    const codeId = `code-${Math.random().toString(36).substring(7)}`;

    // 区分行内代码和代码块
    // 1. 如果有 language- 前缀，说明是代码块（来自 Markdown 的 ```代码）
    // 2. 检查 node.parent 的 tagName，如果是 pre 则是代码块
    const isCodeBlock = match || props?.node?.parent?.tagName === 'PRE';

    if (!isCodeBlock) {
      // 行内代码：返回简单的 code 元素
      return <code className={className} {...props}>{children}</code>;
    }

    // 代码块：渲染为带复制按钮的代码块
    return (
      <div className="group relative my-6">
        <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-slate-950 rounded-t-lg border border-slate-700 dark:border-slate-700">
          <span className="text-xs text-slate-300 dark:text-slate-400 font-mono font-semibold">
            {match ? match[1].toUpperCase() : 'CODE'}
          </span>
          <button
            onClick={() => copyCode(codeContent, codeId)}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-300 dark:text-slate-400 hover:text-white bg-slate-700 dark:bg-slate-800 hover:bg-slate-600 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            {copiedCode === codeId ? (
              <>
                <Check className="h-3 w-3" />
                已复制
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                复制
              </>
            )}
          </button>
        </div>
        <pre className="!mt-0 p-4 bg-slate-900 dark:bg-slate-950 rounded-b-lg overflow-x-auto border-x border-b border-slate-700 dark:border-slate-800">
          <code
            className={`text-slate-100 dark:text-slate-200 ${className || 'font-mono text-sm'}`}
            {...props}
          >
            {children}
          </code>
        </pre>
      </div>
    );
  };

  // 自定义标题渲染
  const renderHeading = (level: number, index: number) => {
    return ({ children, ...props }: any) => {
      const text = children?.toString() || '';
      const headingId = `heading-${index}`;

      const baseStyles = {
        1: 'text-4xl mt-16 mb-8 font-bold text-slate-900 dark:text-white tracking-tight border-b-2 border-blue-200 dark:border-blue-900 pb-4',
        2: 'text-2xl mt-14 mb-6 font-bold text-blue-900 dark:text-blue-100 tracking-tight border-b-2 border-blue-300 dark:border-blue-700 pb-3',
        3: 'text-xl mt-10 mb-4 font-bold text-slate-800 dark:text-slate-200 tracking-tight',
        4: 'text-lg mt-8 mb-3 font-semibold text-slate-700 dark:text-slate-300',
        5: 'text-base mt-6 mb-2 font-semibold text-slate-700 dark:text-slate-300',
        6: 'text-sm mt-4 mb-2 font-medium text-slate-600 dark:text-slate-400',
      };

      const headingClass = baseStyles[level as keyof typeof baseStyles];

      return (
        <div className="relative" id={headingId}>
          {level === 1 && <h1 className={headingClass}>{children}</h1>}
          {level === 2 && <h2 className={headingClass}>{children}</h2>}
          {level === 3 && <h3 className={headingClass}>{children}</h3>}
          {level === 4 && <h4 className={headingClass}>{children}</h4>}
          {level === 5 && <h5 className={headingClass}>{children}</h5>}
          {level === 6 && <h6 className={headingClass}>{children}</h6>}
        </div>
      );
    };
  };

  // 渲染所有标题
  let headingIndex = 0;
  const getHeadingIndex = () => headingIndex++;

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* 主文档内容 */}
      <main className="pb-20">
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          {/* 文档标题 */}
          <div className="px-8 pt-10 pb-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-900">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                  {title}
                </h1>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  产品需求文档 (PRD) - 完整版 · {new Date().toLocaleDateString('zh-CN')}
                </p>
              </div>
            </div>
          </div>

          {/* Markdown 内容 */}
          <div
            ref={contentRef}
            className="px-8 py-8 prose prose-slate dark:prose-invert max-w-none
                /* 全局行间距和颜色 */
                prose-p:text-slate-700 dark:prose-p:text-slate-300 prose-p:leading-8 prose-p:text-base
                prose-li:text-slate-700 dark:prose-li:text-slate-300 prose-li:leading-7
                prose-strong:text-slate-900 dark:prose-strong:text-white prose-strong:font-bold

                /* 链接 */
                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline prose-a:font-medium prose-a:hover:underline

                /* 行内代码 */
                prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-2 prose-code:py-1 prose-code:rounded-md prose-code:text-sm prose-code:font-mono prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:font-bold prose-code:border prose-code:border-slate-200 dark:prose-code:border-slate-700

                /* 引用块 */
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-950/20 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:my-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:shadow-sm
                prose-blockquote:text-slate-700 dark:prose-blockquote:text-slate-300

                /* 列表 */
                prose-ul:space-y-3 prose-ul:my-6
                prose-ol:space-y-3 prose-ol:my-6

                /* 表格 */
                prose-table:my-8
                prose-table:w-full
                prose-table:overflow-hidden
                prose-table:rounded-xl
                prose-table:border prose-table:border-slate-200 dark:prose-table:border-slate-800
                prose-table:shadow-sm
                prose-table:scroll-my-0
              "
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: (props: any) => renderHeading(1, getHeadingIndex())(props),
                  h2: (props: any) => renderHeading(2, getHeadingIndex())(props),
                  h3: (props: any) => renderHeading(3, getHeadingIndex())(props),
                  h4: (props: any) => renderHeading(4, getHeadingIndex())(props),
                  h5: (props: any) => renderHeading(5, getHeadingIndex())(props),
                  h6: (props: any) => renderHeading(6, getHeadingIndex())(props),
                  table: ({ node, ...props }: any) => (
                    <div className="my-8 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <table {...props} />
                    </div>
                  ),
                  thead: ({ node, ...props }: any) => (
                    <thead {...props} className="bg-slate-100 dark:bg-slate-800" />
                  ),
                  th: ({ node, ...props }: any) => (
                    <th
                      {...props}
                      className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-700"
                    />
                  ),
                  td: ({ node, ...props }: any) => (
                    <td
                      {...props}
                      className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 last:border-b-0"
                    />
                  ),
                  tr: ({ node, ...props }: any) => (
                    <tr
                      {...props}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    />
                  ),
                  a: ({ node, ...props }: any) => (
                    <a {...props} target="_blank" rel="noopener noreferrer" />
                  ),
                  code: CodeBlock,
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </main>
    </div>
  );
}

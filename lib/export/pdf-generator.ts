/**
 * PDF 生成工具 - 支持中文
 * 使用 pdfkit 库生成 PDF 文档
 */

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface PDFGenerationOptions {
  title: string;
  author?: string;
  subject?: string;
}

/**
 * 将 PDFDocument 输出转换为 Buffer
 */
function pdfKitToBuffer(pdfDoc: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream: Readable = pdfDoc.pipe(
      new WritableStream({
        write(chunk: Buffer) {
          chunks.push(chunk);
        },
      } as any)
    );

    stream.on('finish', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// 简单的 WritableStream 实现
class WritableStream {
  constructor(private opts: any) {}

  on(event: string, handler: any) {
    // 简化实现
    return this;
  }

  write(chunk: Buffer) {
    this.opts.write(chunk);
    return true;
  }
}

/**
 * 生成支持中文的 PDF
 */
export async function generatePDF(
  markdown: string,
  options: PDFGenerationOptions
): Promise<Buffer> {
  const { title, author = 'AI PRD Agent', subject = 'Product Requirements Document' } = options;

  return new Promise((resolve, reject) => {
    try {
      // 创建 PDF 文档
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: title,
          Author: author,
          Subject: subject,
        },
      } as any);

      // 收集所有数据块
      const chunks: Buffer[] = [];

      // 自定义输出流
      const stream = doc.pipe({
        write: (chunk: Buffer) => chunks.push(chunk),
        end: () => {},
        on: (event: string, handler: any) => {
          if (event === 'finish') handler();
        },
      } as any);

      // 注册中文字体 - 使用 Noto Sans CJK 的简化版本
      // 注意：这里使用一个技巧，从 CDN 获取字体数据
      const fontUrl = 'https://cdn.jsdelivr.net/npm/source-han-sans-cn@1.0.0/SourceHanSansCN-Regular.otf';

      fetch(fontUrl)
        .then(response => response.arrayBuffer())
        .then(fontBuffer => {
          // 注册中文字体
          doc.registerFont('Chinese', 'SourceHanSansCN', Buffer.from(fontBuffer));
          const chineseFont = doc.font('Chinese');

          // 开始渲染内容
          generateContent(doc, markdown, title, chineseFont);

          // 完成文档
          doc.end();
        })
        .catch((err) => {
          // 如果字体加载失败，使用默认字体（不支持中文）
          console.warn('中文字体加载失败，使用默认字体:', err);
          const defaultFont = doc.font('Helvetica');
          generateContent(doc, markdown, title, defaultFont);
          doc.end();
        });

      stream.on('finish', () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on('error', reject);

    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 生成 PDF 内容
 */
function generateContent(
  doc: any,
  markdown: string,
  title: string,
  font: any
) {
  const pageWidth = doc.page.width;
  const margin = 50;
  const maxWidth = pageWidth - margin * 2;
  let y = 80;

  // 添加文档标题
  doc.font(font.size(20)).fillColor('#000000');
  doc.text(title, { align: 'center' });
  y = doc.y;

  // 分割行并处理
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeLines: string[] = [];

  for (const line of lines) {
    // 处理代码块
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // 代码块结束 - 添加代码内容
        if (codeLines.length > 0) {
          doc.font('Courier').fontSize(9).fillColor('#333333');
          doc.moveDown();
          doc.text('[代码块 - 请查看 Markdown 版本]', {
            width: maxWidth,
            align: 'left',
          });
        }
        inCodeBlock = false;
        codeLines = [];
      } else {
        const lang = line.trim().substring(3).toLowerCase();
        if (lang !== 'mermaid') {
          // 非 mermaid 代码块
          inCodeBlock = true;
        }
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // 检查是否需要新页面
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 80;
    }

    const trimmedLine = line.trim();

    // 跳过空行
    if (!trimmedLine) {
      doc.moveDown(0.3);
      y = doc.y;
      continue;
    }

    // 处理各种 Markdown 元素
    if (trimmedLine.startsWith('# ')) {
      // 一级标题
      doc.font(font.size(16)).fillColor('#1a1a1a');
      doc.text(trimmedLine.substring(2), { width: maxWidth });
    } else if (trimmedLine.startsWith('## ')) {
      // 二级标题
      doc.font(font.size(14)).fillColor('#2a2a2a');
      doc.text(trimmedLine.substring(3), { width: maxWidth });
    } else if (trimmedLine.startsWith('### ')) {
      // 三级标题
      doc.font(font.size(12)).fillColor('#3a3a3a');
      doc.text(trimmedLine.substring(4), { width: maxWidth });
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // 列表项
      doc.font(font.size(11)).fillColor('#4a4a4a');
      doc.text(`• ${trimmedLine.substring(2)}`, { width: maxWidth - 20 });
    } else {
      // 普通文本
      doc.font(font.size(11)).fillColor('#4a4a4a');
      doc.text(trimmedLine, { width: maxWidth });
    }

    doc.moveDown(0.5);
    y = doc.y;
  }
}

/**
 * 生成 PDF 的主入口函数
 */
export async function generatePDFFromMarkdown(
  markdown: string,
  title: string
): Promise<Buffer> {
  return generatePDF(markdown, { title });
}

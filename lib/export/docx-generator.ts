/**
 * DOCX (Word) 生成工具
 * 使用 docx 库生成 Word 文档
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  UnderlineType,
  convertInchesToTwip,
  ShadingType,
} from 'docx';

export interface DocxGenerationOptions {
  title: string;
  author?: string;
}

/**
 * 处理行内 Markdown 格式（加粗、斜体、代码等）
 */
function processInlineMarkdown(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let currentIndex = 0;

  // 正则表达式匹配各种行内格式
  const patterns = [
    { regex: /`([^`]+)`/g, type: 'code' },         // 行内代码
    { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },   // 加粗
    { regex: /\*([^*]+)\*/g, type: 'italic' },     // 斜体
  ];

  // 找到所有匹配位置
  const matches: Array<{ start: number; end: number; type: string; text: string }> = [];

  patterns.forEach(({ regex, type }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        type,
        text: match[1],
      });
    }
  });

  // 按位置排序
  matches.sort((a, b) => a.start - b.start);

  // 去重和合并重叠
  const uniqueMatches: typeof matches = [];
  for (const match of matches) {
    const lastMatch = uniqueMatches[uniqueMatches.length - 1];
    if (!lastMatch || match.start >= lastMatch.end) {
      uniqueMatches.push(match);
    }
  }

  // 构建 TextRun
  for (let i = 0; i < uniqueMatches.length; i++) {
    const match = uniqueMatches[i];
    const prevEnd = i === 0 ? 0 : uniqueMatches[i - 1].end;

    // 添加普通文本
    if (match.start > prevEnd) {
      const normalText = text.substring(prevEnd, match.start);
      if (normalText.trim()) {
        runs.push(new TextRun(normalText));
      }
    }

    // 添加格式文本
    switch (match.type) {
      case 'code':
        runs.push(new TextRun({
          text: match.text,
          font: 'Consolas',
          size: 20, // 10pt
          shading: {
            type: ShadingType.SOLID,
            color: 'F5F5F5',
          },
        }));
        break;
      case 'bold':
        runs.push(new TextRun({
          text: match.text,
          bold: true,
        }));
        break;
      case 'italic':
        runs.push(new TextRun({
          text: match.text,
          italics: true,
        }));
        break;
    }
  }

  // 添加最后的普通文本
  const lastEnd = uniqueMatches.length > 0 ? uniqueMatches[uniqueMatches.length - 1].end : 0;
  if (lastEnd < text.length) {
    const remainingText = text.substring(lastEnd);
    if (remainingText.trim()) {
      runs.push(new TextRun(remainingText));
    }
  }

  return runs.length > 0 ? runs : [new TextRun(text)];
}

/**
 * 改进的 Markdown 解析，生成更友好的 Word 文档
 */
export async function generateDocx(
  markdown: string,
  options: DocxGenerationOptions
): Promise<Buffer> {
  const { title, author = 'AI PRD Agent' } = options;

  const content: Paragraph[] = [];

  // 添加文档标题
  content.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: {
        before: 200,
        after: 400,
      },
    })
  );

  // 分割行并处理
  const lines = markdown.split('\n');
  let inCodeBlock = false;
  let codeLanguage = '';
  let consecutiveEmptyLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 处理代码块
    if (trimmedLine.startsWith('```')) {
      if (inCodeBlock) {
        // 代码块结束
        inCodeBlock = false;
        codeLanguage = '';
      } else {
        // 代码块开始 - 检查是否是 mermaid
        codeLanguage = trimmedLine.substring(3).trim();
        if (codeLanguage === 'mermaid') {
          // 跳过 mermaid 代码块
          inCodeBlock = true;
        }
      }
      continue;
    }

    // 如果在代码块内，跳过（已经过滤了 mermaid）
    if (inCodeBlock) {
      continue;
    }

    // 处理空行
    if (trimmedLine === '') {
      consecutiveEmptyLines++;
      // 只保留一个空行
      if (consecutiveEmptyLines === 1) {
        content.push(
          new Paragraph({
            text: '',
            spacing: { after: 100 },
          })
        );
      }
      continue;
    }
    consecutiveEmptyLines = 0;

    // 处理各种 Markdown 元素
    if (trimmedLine.startsWith('# ')) {
      // 一级标题
      content.push(
        new Paragraph({
          text: trimmedLine.substring(2),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        })
      );
    } else if (trimmedLine.startsWith('## ')) {
      // 二级标题
      content.push(
        new Paragraph({
          text: trimmedLine.substring(3),
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 250, after: 120 },
        })
      );
    } else if (trimmedLine.startsWith('### ')) {
      // 三级标题
      content.push(
        new Paragraph({
          text: trimmedLine.substring(4),
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmedLine.startsWith('#### ') || trimmedLine.startsWith('##### ') || trimmedLine.startsWith('###### ')) {
      // 四级及以上标题 - 使用普通文本加粗
      const level = trimmedLine.match(/^#+/)?.[0].length || 4;
      const text = trimmedLine.substring(level);
      content.push(
        new Paragraph({
          children: [new TextRun({ text, bold: true })],
          spacing: { before: 150, after: 80 },
        })
      );
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      // 无序列表
      const listText = trimmedLine.substring(2);
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ', bold: true }),
            ...processInlineMarkdown(listText),
          ],
          spacing: { after: 80 },
          indent: { left: 720 },
        })
      );
    } else if (trimmedLine.match(/^\d+\.\s/)) {
      // 有序列表
      const listText = trimmedLine.replace(/^\d+\.\s*/, '');
      content.push(
        new Paragraph({
          children: [...processInlineMarkdown(listText)],
          spacing: { after: 80 },
          indent: { left: 720 },
          numbering: {
            reference: 'default-numbering',
            level: 0,
          },
        })
      );
    } else if (trimmedLine.startsWith('> ')) {
      // 引用块
      const quoteText = trimmedLine.substring(2);
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: quoteText,
              italics: true,
            }),
          ],
          spacing: { after: 100, before: 100 },
          indent: { left: 720 },
        })
      );
    } else {
      // 普通文本 - 使用行内格式处理
      content.push(
        new Paragraph({
          children: [...processInlineMarkdown(trimmedLine)],
          spacing: { after: 100 },
        })
      );
    }
  }

  // 创建文档
  const doc = new Document({
    creator: author,
    title: title,
    description: 'Product Requirements Document',
    numbering: {
      config: [
        {
          reference: 'default-numbering',
          levels: [
            {
              level: 0,
              format: 'decimal',
              text: '%1.',
              alignment: AlignmentType.LEFT,
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: content,
      },
    ],
  });

  // 生成 Buffer
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

/**
 * 生成 DOCX 的主入口函数
 */
export async function generateDocxFromMarkdown(
  markdown: string,
  title: string
): Promise<Buffer> {
  return generateDocx(markdown, { title });
}

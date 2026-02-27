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
      content.push(
        new Paragraph({
          children: [
            new TextRun({ text: '• ' }),
            new TextRun(trimmedLine.substring(2)),
          ],
          spacing: { after: 80 },
          indent: { left: 720 }, // 缩进 0.4 英寸
        })
      );
    } else if (trimmedLine.match(/^\d+\.\s/)) {
      // 有序列表
      const text = trimmedLine.replace(/^\d+\.\s*/, '');
      content.push(
        new Paragraph({
          children: [
            new TextRun(text),
          ],
          spacing: { after: 80 },
          indent: { left: 720 },
          numbering: {
            reference: 'default-numbering',
            level: 0,
          },
        })
      );
    } else if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
      // 加粗文本
      content.push(
        new Paragraph({
          children: [new TextRun({ text: trimmedLine.slice(2, -2), bold: true })],
          spacing: { after: 100 },
        })
      );
    } else {
      // 普通文本
      content.push(
        new Paragraph({
          children: [new TextRun(trimmedLine)],
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

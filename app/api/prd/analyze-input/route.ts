import { NextRequest, NextResponse } from 'next/server';
import { chatWithResponse } from '@/lib/ai';
import { INPUT_ANALYSIS_SYSTEM_PROMPT, INPUT_ANALYSIS_PROMPT } from '@/lib/prompts/clarification-prompt';
import { InputAnalysisResult, ClarificationQuestion } from '@/types/prd';
import { z } from 'zod';

// 请求验证 Schema
const AnalyzeInputSchema = z.object({
  idea: z.string().min(10, '产品想法至少需要10个字符'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 验证请求
    const result = AnalyzeInputSchema.safeParse(body);
    if (!result.success) {
      // 提取更友好的错误信息 (Zod 使用 issues 而不是 errors)
      const firstIssue = result.error.issues?.[0];
      const friendlyMessage = firstIssue?.message || '产品想法描述太短啦，请至少输入10个字符';

      return NextResponse.json(
        { error: friendlyMessage },
        { status: 400 }
      );
    }

    const { idea } = result.data;

    // 调用 AI 分析输入
    const { content } = await chatWithResponse(
      INPUT_ANALYSIS_SYSTEM_PROMPT,
      INPUT_ANALYSIS_PROMPT(idea),
      [],
      'json_object'
    );

    // 解析 JSON 响应
    let analysisResult: InputAnalysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch {
      // 如果 JSON 解析失败，尝试提取 JSON 部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('AI 返回的格式不正确');
      }
    }

    // 验证并添加问题 ID
    if (analysisResult.clarifyingQuestions) {
      analysisResult.clarifyingQuestions = analysisResult.clarifyingQuestions.map((q, index) => ({
        ...q,
        id: q.id || `q_${Date.now()}_${index}`,
      }));
    }

    // 检查是否是产品需求
    if (analysisResult.isProductIdea === false) {
      return NextResponse.json(
        {
          success: false,
          error: analysisResult.suggestion || '这看起来不像是一个产品需求描述。请告诉我你想做一个什么样的产品？比如：我想做一个外卖配送应用程序',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysisResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '输入分析失败',
      },
      { status: 500 }
    );
  }
}

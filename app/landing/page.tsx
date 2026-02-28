'use client';

import { Button } from '@/components/ui/button';
import {
  FileText,
  Zap,
  Brain,
  Layers,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Lightbulb
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const features = [
    {
      icon: Brain,
      title: 'AI 驱动分析',
      description: '基于智谱 AI 大模型，深度理解产品需求，智能生成澄清问题，确保需求清晰完整。',
    },
    {
      icon: FileText,
      title: '专业 PRD 生成',
      description: '自动生成标准产品需求文档，包含背景、目标用户、功能列表、成功指标等核心要素。',
    },
    {
      icon: Layers,
      title: '可视化图表',
      description: '一键生成系统架构图、用户旅程图、功能模块图和数据流图，让复杂逻辑一目了然。',
    },
    {
      icon: CheckCircle,
      title: '多格式导出',
      description: '支持 Markdown、Word、PDF 等多种格式导出，满足不同团队的交付需求。',
    },
  ];

  const steps = [
    {
      icon: Lightbulb,
      title: '输入想法',
      description: '简单描述产品概念，AI 会智能分析需求完整性。',
    },
    {
      icon: Brain,
      title: 'AI 澄清',
      description: '针对性提问，帮你理清产品定位、目标用户和核心价值。',
    },
    {
      icon: Zap,
      title: '生成 PRD',
      description: '自动生成专业 PRD 文档，包含完整的功能描述和技术评估。',
    },
    {
      icon: Target,
      title: '可视化&导出',
      description: '生成图表辅助理解，支持多格式导出交付。',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F7] dark:bg-[#0A0F1C] bg-paper-texture">
      {/* 导航栏 - 杂志风格 */}
      <nav className="border-b border-[#E0E3E8] dark:border-[#2D3748] bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-sm border border-[#E0E3E8] dark:border-[#2D3748]">
                <FileText className="h-5 w-5 text-[#1A1A1A] dark:text-[#F1F3F6]" />
              </div>
              <span className="font-serif text-xl font-bold text-[#1A1A1A] dark:text-[#F1F3F6]">
                AI PRD Agent
              </span>
            </div>
            <Link href="/app">
              <Button className="btn-editorial btn-editorial-primary">
                开始使用
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero 区域 - 增强视觉层次 */}
      <section className="relative py-32 md:py-48 px-6 overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-[#E0E3E8] dark:border-[#2D3748] rounded-full opacity-20" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-[#E0E3E8] dark:border-[#2D3748] rounded-full opacity-20" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <div className="w-24 h-px bg-[#1A1A1A] dark:bg-[#F1F3F6] mx-auto mb-12" />

          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-[#1A1A1A] dark:text-[#F1F3F6] leading-tight mb-8">
            AI 驱动的产品<br />需求文档生成器
          </h1>

          <p className="font-sans text-lg md:text-xl text-[#6B7B8C] dark:text-[#9AA5B1] max-w-2xl mx-auto mb-12 leading-relaxed">
            输入产品想法，AI 帮你生成专业 PRD 文档。<br />
            从概念到交付，只需几分钟。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/app">
              <Button className="btn-editorial btn-editorial-primary px-10 py-7 text-base">
                <Sparkles className="h-5 w-5" />
                立即开始生成 PRD
              </Button>
            </Link>
          </div>

          <div className="w-24 h-px bg-[#1A1A1A]/30 dark:bg-[#F1F3F6]/30 mx-auto mt-20" />
        </div>
      </section>

      {/* 工作流程 - 统一卡片大小 */}
      <section className="py-24 px-6 bg-white dark:bg-[#0D1117]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="w-16 h-px bg-[#1A1A1A] dark:bg-[#F1F3F6] mx-auto mb-8" />
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] dark:text-[#F1F3F6] mb-4">
              四步完成 PRD
            </h2>
            <p className="font-sans text-lg text-[#6B7B8C] dark:text-[#9AA5B1]">
              简单直观的流程，让产品文档编写变得轻松
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={index} className="relative group">
                {/* 连接线 */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-full w-full h-px bg-gradient-to-r from-[#E0E3E8] to-transparent dark:from-[#2D3748]" />
                )}

                {/* 统一大小的卡片 */}
                <div className="h-full min-h-[280px] flex flex-col p-8 bg-[#FAF9F7] dark:bg-[#1A1D23] border border-[#E0E3E8] dark:border-[#2D3748] hover:border-[#1A1A1A] dark:hover:border-[#F1F3F6] transition-all duration-300 hover-lift-editorial">
                  {/* 步骤编号 + 图标 */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="font-sans text-xs font-medium text-[#9AA5B1] uppercase tracking-widest">
                      Step {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="p-2 rounded-sm border border-[#E0E3E8] dark:border-[#2D3748] bg-white dark:bg-[#1E2532] group-hover:border-[#1A1A1A] dark:group-hover:border-[#F1F3F6] transition-colors">
                      <step.icon className="h-5 w-5 text-[#1A1A1A] dark:text-[#F1F3F6]" />
                    </div>
                  </div>

                  {/* 标题 */}
                  <h3 className="font-serif text-xl text-[#1A1A1A] dark:text-[#F1F3F6] mb-4">
                    {step.title}
                  </h3>

                  {/* 描述 - 自动高度填充 */}
                  <p className="font-sans text-[#6B7B8C] dark:text-[#9AA5B1] leading-relaxed flex-1">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心功能 - 增加视觉层次 */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="w-16 h-px bg-[#1A1A1A] dark:bg-[#F1F3F6] mx-auto mb-8" />
            <h2 className="font-serif text-4xl md:text-5xl text-[#1A1A1A] dark:text-[#F1F3F6] mb-4">
              核心功能
            </h2>
            <p className="font-sans text-lg text-[#6B7B8C] dark:text-[#9AA5B1]">
              完整的产品文档工具链
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 border border-[#E0E3E8] dark:border-[#2D3748] bg-white dark:bg-[#0D1117] hover:border-[#1A1A1A] dark:hover:border-[#F1F3F6] transition-all duration-300 hover-lift-editorial"
              >
                <div className="flex items-start gap-5">
                  <div className="p-3 rounded-sm border border-[#E0E3E8] dark:border-[#2D3748] bg-[#FAF9F7] dark:bg-[#1A1D23] group-hover:border-[#1A1A1A] dark:group-hover:border-[#F1F3F6] transition-colors">
                    <feature.icon className="h-6 w-6 text-[#1A1A1A] dark:text-[#F1F3F6]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-serif text-2xl text-[#1A1A1A] dark:text-[#F1F3F6] mb-3">
                      {feature.title}
                    </h3>
                    <p className="font-sans text-[#6B7B8C] dark:text-[#9AA5B1] leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA 区域 - 增强设计 */}
      <section className="relative py-32 px-6 bg-[#1A1A1A] dark:bg-[#F1F3F6] overflow-hidden">
        {/* 装饰性背景 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 border border-white rounded-full" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border border-white rounded-full" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="w-24 h-px bg-white/30 mx-auto mb-12" />

          <h2 className="font-serif text-4xl md:text-6xl text-white dark:text-[#0A0F1C] mb-6">
            准备好开始了吗？
          </h2>
          <p className="font-sans text-lg text-[#9AA5B1] dark:text-[#6B7B8C] mb-10 max-w-xl mx-auto">
            立即体验 AI 驱动的 PRD 生成，让产品文档编写更高效。
          </p>
          <Link href="/app">
            <Button className="btn-editorial bg-white dark:bg-[#0A0F1C] text-[#1A1A1A] dark:text-[#F1F3F6] hover:bg-[#F1F3F6] dark:hover:bg-[#1A1A1A] gap-2 px-10 py-7 text-base">
              开始生成 PRD
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* 页脚 - 极简设计 */}
      <footer className="py-8 px-6 border-t border-[#E0E3E8] dark:border-[#2D3748]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-sm border border-[#E0E3E8] dark:border-[#2D3748]">
              <FileText className="h-4 w-4 text-[#6B7B8C] dark:text-[#9AA5B1]" />
            </div>
            <span className="font-sans text-sm text-[#6B7B8C] dark:text-[#9AA5B1]">
              AI PRD Agent - 智能产品文档工具
            </span>
          </div>
          <p className="font-sans text-sm text-[#9AA5B1]">
            Powered by 智谱 AI
          </p>
        </div>
      </footer>
    </div>
  );
}

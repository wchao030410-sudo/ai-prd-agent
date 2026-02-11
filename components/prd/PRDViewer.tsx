'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PRDDocument } from '@/types/prd';
import { CheckCircle2, Users, Target, Zap, FileText } from 'lucide-react';
import { safeMap } from '@/lib/utils';

interface PRDViewerProps {
  prd: PRDDocument;
}

export function PRDViewer({ prd }: PRDViewerProps) {
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, 'destructive' | 'secondary' | 'warning'> = {
      high: 'destructive',
      medium: 'warning',
      low: 'secondary',
    };
    const labels: Record<string, string> = {
      high: '高优先级',
      medium: '中优先级',
      low: '低优先级',
    };
    return (
      <Badge variant={variants[priority] || 'secondary'}>
        {labels[priority] || priority}
      </Badge>
    );
  };

  const getFeasibilityBadge = (overall: string) => {
    const variants: Record<string, 'destructive' | 'warning' | 'success'> = {
      easy: 'success',
      medium: 'warning',
      hard: 'destructive',
    };
    const labels: Record<string, string> = {
      easy: '容易实现',
      medium: '中等难度',
      hard: '较难实现',
    };
    return (
      <Badge variant={variants[overall] || 'secondary'}>
        {labels[overall] || overall}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* 标题和描述 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-primary" />
            {prd.title}
          </CardTitle>
          <CardDescription className="text-base">
            {prd.description}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 背景 */}
      {prd.background && (
        <Card>
          <CardHeader>
            <CardTitle>产品背景</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-line">
              {prd.background}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 目标用户 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            目标用户
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 font-semibold text-sm text-muted-foreground">
              主要用户
            </h4>
            <div className="space-y-2">
              {safeMap(prd.targetUsers?.primary, (user, i) => (
                <div key={i} className="rounded-lg bg-muted p-3">
                  {user}
                </div>
              ))}
            </div>
          </div>
          {(prd.targetUsers?.secondary?.length || 0) > 0 && (
            <div>
              <h4 className="mb-2 font-semibold text-sm text-muted-foreground">
                次要用户
              </h4>
              <div className="space-y-2">
                {safeMap(prd.targetUsers?.secondary, (user, i) => (
                  <div key={i} className="rounded-lg bg-muted p-3">
                    {user}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 用户痛点 */}
      {prd.painPoints && prd.painPoints.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              用户痛点
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {safeMap(prd.painPoints, (pain, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 text-destructive">•</span>
                  <span>{pain}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 核心价值 */}
      {prd.coreValue && prd.coreValue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              核心价值
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {safeMap(prd.coreValue, (value, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 功能列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            功能列表 ({prd.features?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {safeMap(prd.features, (feature) => (
              <div key={feature.id} className="space-y-2 rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold">{feature.name}</h4>
                  {getPriorityBadge(feature.priority)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
                <div className="flex gap-4 text-sm">
                  <span className="text-muted-foreground">
                    工作量: {feature.effort}/5
                  </span>
                  <span className="text-muted-foreground">
                    价值: {feature.value}/5
                  </span>
                </div>
                {feature.acceptanceCriteria && feature.acceptanceCriteria.length > 0 && (
                  <div>
                    <h5 className="mb-2 text-sm font-semibold">验收标准</h5>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {safeMap(feature.acceptanceCriteria, (criteria, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-3 w-3" />
                          <span>{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 成功指标 */}
      {prd.successMetrics && prd.successMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>成功指标</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {safeMap(prd.successMetrics, (metric, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                  <span>{metric}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* 技术可行性 */}
      {prd.techFeasibility && (
        <Card>
          <CardHeader>
            <CardTitle>技术可行性评估</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold">总体难度：</span>
              {getFeasibilityBadge(prd.techFeasibility.overall)}
            </div>
            {(prd.techFeasibility?.challenges?.length || 0) > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">技术挑战</h4>
                <ul className="space-y-1">
                  {safeMap(prd.techFeasibility?.challenges, (challenge, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {(prd.techFeasibility?.recommendations?.length || 0) > 0 && (
              <div>
                <h4 className="mb-2 font-semibold">建议</h4>
                <ul className="space-y-1">
                  {safeMap(prd.techFeasibility?.recommendations, (recommendation, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      • {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 竞品分析 */}
      {prd.competitors && prd.competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              竞品分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prd.competitors.map((competitor, i) => (
                <div key={i} className="rounded-lg border p-4">
                  <h4 className="mb-2 font-semibold">{competitor.name}</h4>
                  <div className="mb-2">
                    <h5 className="mb-1 text-sm font-semibold">核心功能</h5>
                    <div className="flex flex-wrap gap-1">
                      {safeMap(competitor?.features, (feature, j) => (
                        <Badge key={j} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">差异化：</span>
                    {competitor.differences}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

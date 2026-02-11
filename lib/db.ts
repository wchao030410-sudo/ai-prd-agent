// 数据库操作封装
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Session 相关操作
export async function createSession(title: string) {
  return prisma.session.create({
    data: { title },
  });
}

export async function getSession(id: string) {
  return prisma.session.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      prd: true,
    },
  });
}

export async function listSessions() {
  return prisma.session.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      prd: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
    },
  });
}

export async function updateSession(id: string, data: { title?: string; currentStep?: number }) {
  return prisma.session.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deleteSession(id: string) {
  return prisma.session.delete({
    where: { id },
  });
}

export async function linkPRDToSession(sessionId: string, prdId: string) {
  // 同时更新 Session 和 PRD，建立双向关联
  await prisma.pRD.update({
    where: { id: prdId },
    data: { sessionId },
  });

  return prisma.session.update({
    where: { id: sessionId },
    data: { prdId },
  });
}

// Message 相关操作
export async function createMessage(sessionId: string, role: string, content: string) {
  return prisma.message.create({
    data: {
      sessionId,
      role,
      content,
    },
  });
}

export async function getMessages(sessionId: string) {
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

// PRD 相关操作
export async function createPRD(data: {
  sessionId?: string;
  title: string;
  description: string;
  background?: string;
  targetUsers: string;
  painPoints?: string;
  coreValue?: string;
  features: string;
  successMetrics?: string;
  techFeasibility?: string;
  competitors?: string;
}) {
  // 先创建 PRD（不包含 sessionId，避免外键约束问题）
  const { sessionId, ...prdData } = data;
  const prd = await prisma.pRD.create({
    data: prdData,
  });

  // 然后关联到 session（如果提供了 sessionId）
  if (sessionId) {
    await linkPRDToSession(sessionId, prd.id);
  }

  return prd;
}

export async function getPRD(id: string) {
  return prisma.pRD.findUnique({
    where: { id },
    include: {
      session: true,
    },
  });
}

export async function getPRDBySession(sessionId: string) {
  return prisma.pRD.findUnique({
    where: { sessionId },
  });
}

export async function updatePRD(id: string, data: any) {
  return prisma.pRD.update({
    where: { id },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
}

export async function deletePRD(id: string) {
  return prisma.pRD.delete({
    where: { id },
  });
}

// AnalysisLog 相关操作
export async function createAnalysisLog(type: string, input: string, output: string) {
  return prisma.analysisLog.create({
    data: {
      type,
      input,
      output,
    },
  });
}

export async function getAnalysisLogs(type?: string, limit = 10) {
  return prisma.analysisLog.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

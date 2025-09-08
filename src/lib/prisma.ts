import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 10000, // 트랜잭션 시작 대기 시간 (10초)
    timeout: 15000, // 트랜잭션 타임아웃 (15초)
  },
});

export { prisma };

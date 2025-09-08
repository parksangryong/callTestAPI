// utils/token.utils.ts
import { generateTokens } from './jwt.js';
import { redis } from '../lib/redis.js';
import bcrypt from 'bcrypt';

// constants
import {
  ACCESS_TOKEN_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRATION_TIME,
} from '../constants/index.js';

interface SaveTokensParams {
  userId: number;
  name: string;
  authCode: number;
  deviceId: string;
}

// 토큰 저장 함수
const saveTokens = async ({
  userId,
  name,
  authCode,
  deviceId,
}: SaveTokensParams) => {
  const generatedTokens = generateTokens(name, userId, authCode);

  // Redis에 토큰 저장 (14일 유효기간)
  await redis.set(
    `access_token:${userId}:${deviceId}`,
    generatedTokens.accessToken,
    {
      EX: ACCESS_TOKEN_EXPIRATION_TIME * 60, // 30분
    }
  );
  await redis.set(
    `refresh_token:${userId}:${deviceId}`,
    generatedTokens.refreshToken,
    {
      EX: REFRESH_TOKEN_EXPIRATION_TIME * 24 * 60 * 60, // 14일
    }
  );

  return generatedTokens;
};

// PHP password_hash()와 호환되는 비밀번호 해시 함수
const hashPassword = async (password: string): Promise<string> => {
  // PHP의 기본 cost factor인 10을 사용
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  // $2b$를 $2y$로 변환
  return hash.replace('$2b$', '$2y$');
};

const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  // $2y$를 $2b$로 변환하여 비교
  const nodeHash = hashedPassword.replace('$2y$', '$2b$');
  return bcrypt.compare(plainPassword, nodeHash);
};

export { saveTokens, hashPassword, comparePassword };

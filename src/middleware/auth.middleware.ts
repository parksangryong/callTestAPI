import type { FastifyRequest } from "fastify";
import {
  verifyAccessToken,
  getAccessToken,
  verifyRefreshToken,
} from "../utils/jwt.js";

// lib
import { redis } from "../lib/redis.js";
// import { prisma } from "../lib/prisma.js";

// constants
import { Errors } from "../constants/index.js";

interface JwtPayload {
  userId: number;
  name: string;
}

export const authenticateToken = async (request: FastifyRequest) => {
  const authHeader = request.headers.authorization;
  const deviceId = request.headers["x-device-id"] as string;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error(Errors.JWT.TOKEN_REQUIRED.code);
  }

  const accessToken = getAccessToken(authHeader);
  const decoded = verifyAccessToken(accessToken) as JwtPayload;

  if (!decoded) {
    throw new Error(Errors.JWT.ACCESS_EXPIRED.code);
  }

  const refreshToken = await redis.get(
    `refresh_token:${decoded.userId}:${deviceId}`
  );

  if (!refreshToken) {
    throw new Error(Errors.JWT.INVALID_REFRESH_TOKEN.code);
  }

  const decoded_refreshToken = verifyRefreshToken(refreshToken);

  if (!decoded_refreshToken) {
    throw new Error(Errors.JWT.REFRESH_EXPIRED.code);
  }

  // 디바이스 아이디, 유저 아이디 테이블에서 검증

  // if (!userDevice) {
  //   throw new Error(Errors.JWT.INVALID_ACCESS_TOKEN.code);
  // }

  // if (userDevice.is_blocked) {
  //   throw new Error(Errors.USER.USER_BLOCKED.code);
  // }
};

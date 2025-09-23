import { FastifyInstance } from "fastify";
import { MultipartFile } from "@fastify/multipart";

// service
import {
  googleUploadWithUserToken,
  googleDownloadWithUserToken,
  verifyAndStoreTokens,
} from "./google.service.js";

// 타입 정의는 필요시 추가

export default async function googleRoutes(server: FastifyInstance) {
  server.post("/tokens", async (request, reply) => {
    try {
      const { idToken, accessToken } = request.body as {
        idToken: string;
        accessToken?: string;
      };

      if (!idToken) {
        return reply.code(400).send({ error: "ID 토큰이 필요합니다." });
      }

      const result = await verifyAndStoreTokens(idToken, accessToken);

      return reply.code(200).send({
        success: true,
        message: "토큰 저장 완료",
        user: result.user,
      });
    } catch (error) {
      console.error("Tokens endpoint error:", error);
      return reply.code(500).send({
        error: "토큰 처리 실패",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // 파일 업로드 라우트
  server.post("/upload", {
    handler: async (request, reply) => {
      try {
        // multipart 데이터 처리
        const data = await request.file();

        if (!data) {
          return reply.code(400).send({
            error: "파일이 없습니다.",
          });
        }

        const result = await googleUploadWithUserToken(
          request.body as MultipartFile
        );

        reply.code(201).send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error("Upload error:", error);
        reply.code(500).send({
          error: "파일 업로드 실패",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  });

  // 파일 다운로드 라우트 (파일명으로)
  server.post<{ Body: { fileName: string } }>("/download", {
    handler: async (request, reply) => {
      try {
        const { fileName } = request.body;

        if (!fileName) {
          return reply.code(400).send({
            error: "파일명이 필요합니다.",
          });
        }

        const result = await googleDownloadWithUserToken(fileName);

        reply.code(200).send({
          success: true,
          data: result,
        });
      } catch (error) {
        console.error("Download error:", error);
        reply.code(500).send({
          error: "파일 다운로드 실패",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  });
}

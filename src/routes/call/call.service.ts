import { FastifyRequest } from "fastify";
import { GetCallQuery } from "../../types/call.type.js";
import { promises as fs } from "fs";
import * as path from "path";

export const uploadFile = async (request: FastifyRequest) => {
  const data = await request.file();

  const { filename, file } = data || {};

  const chunks: Buffer[] = [];
  for await (const chunk of file || []) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const timestamp = Date.now();
  const uploadPath = path.join(__dirname, `${filename}_${timestamp}`);

  await fs.writeFile(uploadPath, buffer);

  return {
    message: "파일 업로드 성공",
    fileName: filename || `${filename}_${timestamp}`,
    path: uploadPath,
  };
};

export const getCall = async (query: GetCallQuery) => {
  const { tel } = query;

  const members = JSON.parse(
    await fs.readFile(path.join(__dirname, "members.json"), "utf8")
  );

  const findMember = members.find((member: any) => member.phone === tel);

  return findMember;
};

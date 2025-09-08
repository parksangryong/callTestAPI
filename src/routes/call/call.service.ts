import { FastifyRequest } from "fastify";
import {
  GetCallQuery,
  GetCallParams,
  StatusBody,
} from "../../types/call.type.js";
import { promises as fs } from "fs";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const uploadFile = async (request: FastifyRequest) => {
  const data = await request.file();

  const { filename, mimetype, file } = data || {};

  const chunks: Buffer[] = [];
  for await (const chunk of file || []) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const timestamp = Date.now();
  const uploadPath = path.join(
    dirname(__filename),
    `${timestamp}_${filename}.${mimetype?.split("/")[1]}`
  );

  await fs.writeFile(uploadPath, buffer);

  return {
    message: "파일 업로드 성공",
    fileName: filename || `${timestamp}_${filename}.${mimetype?.split("/")[1]}`,
    path: uploadPath,
  };
};

export const getCall = async (query: GetCallQuery) => {
  const { tel } = query;

  const members = JSON.parse(
    await fs.readFile(path.join(__dirname, "members.json"), "utf8")
  );

  const findMember = members.find((member: any) => member.phone === tel);

  console.log(findMember);

  return findMember;
};

export const getCallById = async (params: GetCallParams) => {
  const { id } = params;

  const members = JSON.parse(
    await fs.readFile(path.join(dirname(__filename), "members.json"), "utf8")
  );

  const findMember = members.find((member: any) => member.id === id);

  return findMember;
};

export const getMembers = async () => {
  const members = JSON.parse(
    await fs.readFile(path.join(dirname(__filename), "members.json"), "utf8")
  );

  return members;
};

export const getStatus = async (body: StatusBody) => {
  const { status, tel } = body;

  console.log(status, tel);

  return {
    message: "상태 업데이트 성공",
  };
};

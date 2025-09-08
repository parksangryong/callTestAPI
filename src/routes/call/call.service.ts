import { FastifyRequest } from "fastify";
import { GetCallQuery, GetCallParams } from "../../types/call.type.js";
import { promises as fs } from "fs";
import * as path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const uploadFile = async (request: FastifyRequest) => {
  console.log("Request headers:", request.headers);
  console.log("Content-Type:", request.headers["content-type"]);

  let fileData: any = null;
  let formData: any = {};

  try {
    // 폼 데이터 파싱
    for await (const part of request.files()) {
      console.log("Part type:", part.type);
      console.log("Part fieldname:", part.fieldname);
      console.log("Part filename:", part.filename);

      if (part.type === "file") {
        // 파일 데이터 처리
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        fileData = {
          filename: part.filename,
          mimetype: part.mimetype,
          buffer: Buffer.concat(chunks),
        };
        console.log("File processed:", part.filename);
      } else {
        // 일반 폼 필드 처리
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        const value = Buffer.concat(chunks).toString();
        formData[part.fieldname] = value;
        console.log("Form field processed:", part.fieldname, "=", value);
      }
    }
  } catch (error) {
    console.log("Error processing parts:", error);
  }

  // 전체 formData 확인
  console.log("전체 formData:", formData);
  console.log("formData keys:", Object.keys(formData));

  // formData에서 status, tel 분리
  const { status, tel, callType, duration, timestamp } = formData;

  // 상태와 전화번호 콘솔 출력
  console.log("Status:", status);
  console.log("Tel:", tel);
  console.log("Call Type:", callType);
  console.log("Duration:", duration);
  console.log("Timestamp:", timestamp);

  let result: any = {
    message: "데이터 처리 성공",
    status: status,
    tel: tel,
  };

  // 파일이 있으면 저장하고 콘솔 출력
  if (fileData) {
    const timestamp = Date.now();
    const uploadPath = path.join(
      dirname(__filename),
      `${timestamp}_${fileData.filename}.${fileData.mimetype?.split("/")[1]}`
    );

    await fs.writeFile(uploadPath, fileData.buffer);

    console.log("File saved:", {
      fileName: fileData.filename,
      path: uploadPath,
      size: fileData.buffer.length,
    });

    result = {
      ...result,
      message: "파일 업로드 성공",
      fileName: fileData.filename,
      path: uploadPath,
    };
  }

  return result;
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

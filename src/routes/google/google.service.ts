import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { Readable } from "stream";
import type { MultipartFile } from "@fastify/multipart";
import fs from "fs/promises";
import path from "path";

// OAuth 2.0 클라이언트 설정
const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// 토큰 저장소 (Redis를 사용하는 것이 좋습니다. 여기서는 간단한 메모리 저장소로 예시)
let storedTokens: any = null;

// 토큰 파일 경로
const TOKENS_FILE = path.join(process.cwd(), ".tokens.json");

// 토큰 저장
const saveTokens = async (tokens: any) => {
  try {
    await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2));
    console.log("✅ Tokens saved to file");
  } catch (error) {
    console.error("❌ Error saving tokens to file:", error);
    // 파일 저장이 실패하면 메모리에 저장 (임시 방편)
    storedTokens = tokens;
  }
};

// 토큰 로드
const loadTokens = async () => {
  try {
    const data = await fs.readFile(TOKENS_FILE, "utf-8");
    const tokens = JSON.parse(data);
    console.log("✅ Tokens loaded from file");
    return tokens;
  } catch (error) {
    console.error("❌ Error loading tokens from file:", error);
  }

  // 파일에서 로드 실패하면 메모리에서 로드 (임시 방편)
  return storedTokens;
};

// 클라이언트로부터 받은 토큰을 검증하고 저장하는 함수 (간소화됨, .env 없이)
export const verifyAndStoreTokens = async (
  idToken: string,
  accessToken?: string
) => {
  try {
    // ID 토큰의 audience를 동적으로 사용 ( .env 없이 )
    const decoded = JSON.parse(atob(idToken.split(".")[1])); // JWT 페이로드 디코딩
    const tokenAudience = decoded.aud; // 토큰의 audience 사용

    const ticket = await oAuth2Client.verifyIdToken({
      idToken: idToken,
      audience: tokenAudience, // 토큰의 audience로 검증
    });
    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Invalid token");
    }

    // 토큰 저장 (간단하게)
    const tokens = { access_token: accessToken, id_token: idToken };
    saveTokens(tokens);

    return { success: true, user: payload, tokens };
  } catch (error) {
    console.error("Token error:", error);
    throw new Error("Failed to verify tokens");
  }
};

// 토큰이 유효한지 확인하고 필요시 새로고침
const ensureValidToken = async () => {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error("No tokens available. Please authenticate first.");
  }

  oAuth2Client.setCredentials(tokens);

  // 토큰 만료 확인 (간단한 체크)
  const now = Date.now();
  if (tokens.expiry_date && now > tokens.expiry_date) {
    // Refresh Token으로 새 Access Token 요청
    try {
      const { credentials } = await oAuth2Client.refreshAccessToken();
      oAuth2Client.setCredentials(credentials);
      saveTokens(credentials); // 갱신된 토큰 저장
      return credentials.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw new Error("Failed to refresh token");
    }
  }

  return tokens.access_token;
};

// Access Token으로 인증 설정 (내부용)
const getAuthWithToken = (accessToken: string) => {
  oAuth2Client.setCredentials({ access_token: accessToken });
  return oAuth2Client;
};

// 사용자 Access Token으로 파일 업로드 (토큰 자동 관리)
export const googleUploadWithUserToken = async (file: MultipartFile) => {
  try {
    const accessToken = await ensureValidToken(); // 토큰 확인/갱신
    const auth = getAuthWithToken(accessToken);
    const service = google.drive({ version: "v3", auth });

    const requestBody = {
      name: file.filename,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID || "root"],
    };

    const fileBuffer = await file.toBuffer();
    const media = {
      mimeType: file.mimetype,
      body: Readable.from(fileBuffer),
    };

    const uploadedFile = await service.files.create({
      requestBody,
      media,
      fields: "id,name,webViewLink",
    });

    console.log("File uploaded with user token:", uploadedFile.data);
    return {
      fileId: uploadedFile.data.id,
      fileName: uploadedFile.data.name,
      webViewLink: uploadedFile.data.webViewLink,
    };
  } catch (error) {
    console.error("Error uploading with user token:", error);
    throw new Error("Failed to upload file with user token");
  }
};

// 사용자 Access Token으로 파일 다운로드 (토큰 자동 관리)
export const googleDownloadWithUserToken = async (fileName: string) => {
  try {
    const accessToken = await ensureValidToken(); // 토큰 확인/갱신
    const auth = getAuthWithToken(accessToken);
    const service = google.drive({ version: "v3", auth });

    const searchResponse = await service.files.list({
      q: `name='${fileName}' and trashed=false`,
      fields:
        "files(id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime)",
    });

    console.log("Search response:", searchResponse.data);

    const files = searchResponse.data.files;
    if (!files || files.length === 0) {
      throw new Error(`File '${fileName}' not found`);
    }

    const file = files[0];

    // 파일 권한 설정
    try {
      await service.permissions.create({
        fileId: file.id || "",
        requestBody: {
          type: "anyone",
          role: "reader",
        },
      });
      console.log(`✅ File ${file.id} is now publicly accessible`);
    } catch (permError) {
      console.log(`ℹ️ File ${file.id} may already be publicly accessible`);
    }

    return {
      fileId: file.id,
      fileName: file.name,
      mimeType: file.mimeType,
      size: file.size,
      webViewLink: file.webViewLink, // 브라우저에서 볼 수 있는 링크
      webContentLink: file.webContentLink, // 파일을 직접 다운로드할 수 있는 링크
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      // 파일 타입 정보
      isAudio: file.mimeType?.startsWith("audio/") || false,
      isVideo: file.mimeType?.startsWith("video/") || false,
      isImage: file.mimeType?.startsWith("image/") || false,
      // 파일 공유를 위한 퍼블릭 URL (더 안정적)
      downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
    };
  } catch (error) {
    console.error("Error getting file info with user token:", error);
    throw new Error(`Failed to get file info '${fileName}' with user token`);
  }
};

// 사용자 Access Token으로 파일 다운로드 (토큰 자동 관리)
export const googleDownloadWithUserTokenList = async (keyword: string) => {
  try {
    const accessToken = await ensureValidToken(); // 토큰 확인/갱신
    const auth = getAuthWithToken(accessToken);
    const service = google.drive({ version: "v3", auth });

    const searchResponse = await service.files.list({
      q: `name contains '${keyword}' and trashed=false`,
      fields:
        "files(id,name,mimeType,size,webViewLink,webContentLink,createdTime,modifiedTime)",
      orderBy: "createdTime desc",
    });

    console.log("Search response:", searchResponse.data);

    const files = searchResponse.data.files;
    if (!files || files.length === 0) {
      throw new Error(`File '${keyword}' not found`);
    }

    let fileData = [];

    // 파일 권한 설정
    for (const file of files) {
      try {
        await service.permissions.create({
          fileId: file.id || "",
          requestBody: {
            type: "anyone",
            role: "reader",
          },
        });
        console.log(`✅ File ${file.id} is now publicly accessible`);
      } catch (permError) {
        console.log(`ℹ️ File ${file.id} may already be publicly accessible`);
      }

      fileData.push({
        fileId: file.id,
        fileName: file.name,
        mimeType: file.mimeType,
        size: file.size,
        webViewLink: file.webViewLink, // 브라우저에서 볼 수 있는 링크
        webContentLink: file.webContentLink, // 파일을 직접 다운로드할 수 있는 링크
        createdTime: file.createdTime,
        modifiedTime: file.modifiedTime,
        // 파일 타입 정보
        isAudio: file.mimeType?.startsWith("audio/") || false,
        isVideo: file.mimeType?.startsWith("video/") || false,
        isImage: file.mimeType?.startsWith("image/") || false,
        // 파일 공유를 위한 퍼블릭 URL (더 안정적)
        downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
      });
    }

    return fileData;
  } catch (error) {
    console.error("Error getting file info with user token:", error);
    throw new Error(`Failed to get file info '${keyword}' with user token`);
  }
};

export const uploadSchema = {
  tags: ["call"],
  response: {
    201: {
      type: "object",
      description: "파일 업로드 성공 시 메시지를 반환합니다.",
      properties: {
        message: { type: "string" },
      },
    },
    400: {
      type: "object",
      description: "파일 업로드 실패 시 오류 메시지를 반환합니다.",
    },
  },
};

export const getCallSchema = {
  tags: ["call"],
  querystring: {
    type: "object",
    description: "전화번호를 입력하여 전화를 조회합니다.",
    required: ["tel"],
    properties: {
      tel: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      description: "전화 조회 성공 시 메시지를 반환합니다.",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        company: { type: "string" },
        position: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        lastConsultation: { type: "string" },
        status: { type: "string" },
        callStatus: { type: "string" },
        lastCallTime: { type: "string" },
        consultationContent: { type: "string" },
      },
    },
  },
};

export const getCallByIdSchema = {
  tags: ["call"],
  params: {
    type: "object",
    description: "전화번호를 입력하여 전화를 조회합니다.",
    required: ["id"],
    properties: {
      id: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      description: "전화 조회 성공 시 메시지를 반환합니다.",
      properties: {
        id: { type: "string" },
        name: { type: "string" },
        company: { type: "string" },
        position: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        lastConsultation: { type: "string" },
        status: { type: "string" },
        callStatus: { type: "string" },
        lastCallTime: { type: "string" },
        consultationContent: { type: "string" },
      },
    },
  },
};

export const getMembersSchema = {
  tags: ["call"],
  response: {
    200: {
      type: "object",
      description: "멤버 조회 성공 시 메시지와 멤버 목록을 반환합니다.",
      message: { type: "string" },
      properties: {
        members: { type: "array" },
      },
    },
  },
};

export const getStatusSchema = {
  tags: ["call"],
  body: {
    type: "object",
    description: "상태를 업데이트합니다.",
    required: ["status"],
    properties: {
      status: { type: "string" },
      tel: { type: "string" },
    },
  },
  response: {
    200: {
      type: "object",
      description: "상태 업데이트 성공 시 메시지를 반환합니다.",
      properties: {
        message: { type: "string" },
      },
    },
  },
};

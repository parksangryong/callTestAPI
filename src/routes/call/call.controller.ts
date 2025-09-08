import { FastifyInstance } from "fastify";

// service
import {
  uploadFile,
  getCall,
  getCallById,
  getMembers,
} from "./call.service.js";

import { GetCallQuery, GetCallParams } from "../../types/call.type.js";
import {
  uploadSchema,
  getCallSchema,
  getCallByIdSchema,
  getMembersSchema,
} from "./call.schema.js";

export default async function callRoutes(server: FastifyInstance) {
  server.post("/upload", {
    schema: uploadSchema,
    handler: async (request, reply) => {
      const isSuccess = await uploadFile(request);
      reply.code(201).send(isSuccess);
    },
  });

  server.get<{ Querystring: GetCallQuery }>("/", {
    schema: getCallSchema,
    handler: async (request, reply) => {
      const users = await getCall(request.query);
      return reply.code(200).send(users);
    },
  });

  server.get<{ Params: GetCallParams }>("/:id", {
    schema: getCallByIdSchema,
    handler: async (request, reply) => {
      const users = await getCallById(request.params);
      return reply.code(200).send(users);
    },
  });

  server.get("/members", {
    schema: getMembersSchema,
    handler: async (request, reply) => {
      const members = await getMembers();
      return reply.code(200).send({ members });
    },
  });
}

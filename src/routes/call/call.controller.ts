import { FastifyInstance } from "fastify";

// service
import { uploadFile, getCall, getCallById } from "./call.service.js";

import { GetCallQuery, GetCallParams } from "../../types/call.type.js";

export default async function callRoutes(server: FastifyInstance) {
  server.post("/upload", {
    handler: async (request, reply) => {
      const isSuccess = await uploadFile(request);
      reply.code(201).send(isSuccess);
    },
  });

  server.get<{ Querystring: GetCallQuery }>("/", {
    handler: async (request, reply) => {
      const users = await getCall(request.query);
      return reply.code(200).send(users);
    },
  });

  server.get<{ Params: GetCallParams }>("/:id", {
    handler: async (request, reply) => {
      const users = await getCallById(request.params);
      return reply.code(200).send(users);
    },
  });
}

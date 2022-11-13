import { Router } from "../deps.ts";

import { openapi } from "./parts/openapi.ts";

export const openapiRouter = () => {
  const router = new Router();
  router.get("/", (ctx) => {
    ctx.response.body = openapi;
  });
  return router.routes();
};

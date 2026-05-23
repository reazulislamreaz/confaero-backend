import { Express, Request, Response } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { swaggerOptions } from "../../swaggerOptions";

/** Build OpenAPI spec from current module imports (call on each /docs.json request in dev). */
export const buildSwaggerSpec = () => swaggerJSDoc(swaggerOptions);

export const setupSwagger = (app: Express) => {
  app.get("/docs.json", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json(buildSwaggerSpec());
  });

  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      swaggerOptions: {
        url: "/docs.json",
        persistAuthorization: true,
      },
    }),
  );
};

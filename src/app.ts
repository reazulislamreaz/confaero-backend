import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import bodyParser from "body-parser";
import swaggerUi from "swagger-ui-express";
import globalErrorHandler from "./app/middlewares/global_error_handler";
import notFound from "./app/middlewares/not_found_api";
import appRouter from "./routes";
import { swaggerOptions } from "./swaggerOptions";
import { upload } from "./app/middlewares/upload";
import { uploadToS3 } from "./app/utils/s3";
import { stripeWebhookController } from "./app/utils/stripe.webhook";

// define app
const app = express();
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// middleware
app.use(
  cors({
    origin: true, // allows all origins dynamically
    credentials: true,
  }),
);

// stripe webhook endpoint
app.post(
  "/webhooks/stripe",
  bodyParser.raw({ type: "application/json" }),
  stripeWebhookController,
);

app.use(express.json({ limit: "100mb" }));
//! app.use(express.raw());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/api/v1/", appRouter);

// stating point
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    status: "success",
    message: "Server is running successful !!",
    data: null,
  });
});

app.post("/test-upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file found" });
  }

  const url = await uploadToS3(req.file, "test");

  res.status(200).json({
    success: true,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    url,
  });
});
// global error handler
app.use(globalErrorHandler);
app.use(notFound);

// export app
export default app;

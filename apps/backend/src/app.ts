import express, { type Express } from "express";
import cors from "cors";
import { config } from "./config/index.js";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import snailpayRouter from "./routes/snailpay.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";

const app: Express = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

app.use("/api", healthRouter);
app.use("/api", authRouter);
app.use("/api", snailpayRouter);

app.use(notFoundHandler);
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  app.listen(config.port, () => {
    console.log(`Backend running on http://localhost:${config.port}`);
  });
}

export default app;

import express, { type Express } from "express";
import cors from "cors";
import { config } from "./config/index.js";
import healthRouter from "./routes/health.js";
import { errorHandler } from "./middleware/error.js";

const app: Express = express();

app.use(cors({ origin: config.corsOrigins }));
app.use(express.json());

app.use("/api", healthRouter);

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`Backend running on http://localhost:${config.port}`);
});

export default app;

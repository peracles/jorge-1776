import "dotenv/config";

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  corsOrigins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:5173"],
} as const;

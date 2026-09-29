import type { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/index.js";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
}

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? (err as AppError).statusCode : 500;
  const isOperational = isAppError ? (err as AppError).isOperational : false;

  if (!isOperational) {
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    console.error(err.stack);
  }

  res.status(statusCode).json({
    error: err.name || "Error",
    message: err.message,
    statusCode,
    path: req.originalUrl,
  });
}

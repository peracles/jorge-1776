import type { Request, Response, NextFunction } from "express";
import { SnailPayService } from "../services/snailpay.js";
import type { AuthRequest } from "../middleware/auth.js";

export function processPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const simulateSystemError = req.headers["x-snailpay-simulate"] === "system_error";
    const result = SnailPayService.processPayment(req.body, simulateSystemError);

    const status = result.status === "approved" ? 200 : 200;
    res.status(status).json(result);
  } catch (err) {
    next(err);
  }
}

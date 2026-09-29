import type { Request, Response, NextFunction } from "express";
import { SnailPayService } from "../services/snailpay.js";
import type { AuthRequest } from "../middleware/auth.js";
import { snailpaySchema } from "../validators/snailpay.js";
import { ValidationError } from "../errors/index.js";

export function processPayment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = snailpaySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues[0].message);
    }

    const simulateSystemError = req.headers["x-snailpay-simulate"] === "system_error";
    const result = SnailPayService.processPayment(parsed.data, simulateSystemError);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

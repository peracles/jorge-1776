import type { Request, Response, NextFunction } from "express";
import { SessionModel } from "../models/session.js";
import { UserModel } from "../models/user.js";
import { config } from "../config/index.js";

export interface AuthRequest extends Request {
  userId?: string;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = header.slice(7);
  const session = SessionModel.findByToken(token);
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session" });
    return;
  }

  const sessionAgeMs = Date.now() - new Date(session.createdAt).getTime();
  const maxAgeMs = config.sessionDurationHours * 60 * 60 * 1000;
  if (sessionAgeMs > maxAgeMs) {
    SessionModel.delete(token);
    res.status(401).json({ error: "Session expired" });
    return;
  }

  const user = UserModel.findById(session.userId);
  if (!user) {
    res.status(401).json({ error: "User no longer exists" });
    return;
  }

  req.userId = user.id;
  next();
}

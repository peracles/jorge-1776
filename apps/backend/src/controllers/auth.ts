import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.js";
import type { AuthRequest } from "../middleware/auth.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password } = req.body;
    const result = await AuthService.register(fullName, email, password);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export function logout(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.slice(7) ?? "";
    AuthService.logout(token);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}

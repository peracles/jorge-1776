import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.js";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { fullName, email, password } = req.body;
    const user = await AuthService.register(fullName, email, password);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await AuthService.login(email, password);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

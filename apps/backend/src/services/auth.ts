import bcrypt from "bcryptjs";
import { UserModel } from "../models/user.js";
import { SessionModel } from "../models/session.js";
import type { User } from "../types/index.js";

const SALT_ROUNDS = 10;

function sanitizeUser(user: User): Omit<User, "passwordHash"> {
  const { passwordHash: _, ...safe } = user;
  return safe;
}

export const AuthService = {
  async register(fullName: string, email: string, password: string) {
    const existing = UserModel.findByEmail(email);
    if (existing) {
      throw Object.assign(new Error("Email already registered"), { statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = UserModel.create({ fullName, email, passwordHash });
    const session = SessionModel.create(user.id);
    return { user: sanitizeUser(user), token: session.id };
  },

  async login(email: string, password: string) {
    const user = UserModel.findByEmail(email);
    if (!user) {
      throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error("Invalid credentials"), { statusCode: 401 });
    }

    const session = SessionModel.create(user.id);
    return { user: sanitizeUser(user), token: session.id };
  },

  logout(token: string): void {
    const deleted = SessionModel.delete(token);
    if (!deleted) {
      throw Object.assign(new Error("Session not found"), { statusCode: 404 });
    }
  },
};

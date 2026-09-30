import { describe, it, expect, beforeEach } from "vitest";
import { AuthService } from "../../src/services/auth.js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DATA_PATH = resolve(process.cwd(), "data", "users.json");
const SESSION_PATH = resolve(process.cwd(), "data", "sessions.json");

function resetStores() {
  writeFileSync(DATA_PATH, JSON.stringify({ users: [] }));
  writeFileSync(SESSION_PATH, JSON.stringify({ sessions: [] }));
}

describe("AuthService", () => {
  beforeEach(() => {
    resetStores();
  });

  describe("register", () => {
    it("should create a new user and return user + token", async () => {
      const result = await AuthService.register("Jorge", "jorge@test.com", "Password1!");
      expect(result.user).toBeDefined();
      expect(result.user.fullName).toBe("Jorge");
      expect(result.user.email).toBe("jorge@test.com");
      expect(result.token).toBeDefined();
    });

    it("should throw ConflictError if email already exists", async () => {
      await AuthService.register("Jorge", "jorge@test.com", "Password1!");
      await expect(
        AuthService.register("Jorge2", "jorge@test.com", "Password1!")
      ).rejects.toThrow("Email already registered");
    });

    it("should hash the password with bcrypt", async () => {
      const result = await AuthService.register("Jorge", "jorge@test.com", "Password1!");
      const store = JSON.parse(readFileSync(DATA_PATH, "utf-8"));
      const user = store.users.find((u: any) => u.id === result.user.id);
      expect(user.passwordHash).not.toBe("Password1!");
      expect(user.passwordHash).toMatch(/^\$2[ayb]\$\d+\$/);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      await AuthService.register("Jorge", "jorge@test.com", "Password1!");
    });

    it("should return user + token with correct credentials", async () => {
      const result = await AuthService.login("jorge@test.com", "Password1!");
      expect(result.user.email).toBe("jorge@test.com");
      expect(result.token).toBeDefined();
    });

    it("should throw AuthenticationError with wrong password", async () => {
      await expect(
        AuthService.login("jorge@test.com", "WrongPass1!")
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw AuthenticationError with non-existent email", async () => {
      await expect(
        AuthService.login("nobody@test.com", "Password1!")
      ).rejects.toThrow("Invalid credentials");
    });
  });

  describe("logout", () => {
    it("should delete the session", async () => {
      const { token } = await AuthService.register("Jorge", "jorge@test.com", "Password1!");
      AuthService.logout(token);
      const store = JSON.parse(readFileSync(SESSION_PATH, "utf-8"));
      expect(store.sessions.find((s: any) => s.id === token)).toBeUndefined();
    });

    it("should throw NotFoundError for invalid token", () => {
      expect(() => AuthService.logout("invalid-token")).toThrow("Session not found");
    });
  });
});

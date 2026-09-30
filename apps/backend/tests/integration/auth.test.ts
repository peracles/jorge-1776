import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DATA_PATH = resolve(process.cwd(), "data", "users.json");
const SESSION_PATH = resolve(process.cwd(), "data", "sessions.json");

function resetStores() {
  writeFileSync(DATA_PATH, JSON.stringify({ users: [] }));
  writeFileSync(SESSION_PATH, JSON.stringify({ sessions: [] }));
}

describe("Auth Endpoints", () => {
  beforeEach(() => {
    resetStores();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ fullName: "Jorge", email: "jorge@test.com", password: "Password1!" });

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe("jorge@test.com");
    });

    it("should return 409 for duplicate email", async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ fullName: "Jorge", email: "jorge@test.com", password: "Password1!" });

      const res = await request(app)
        .post("/api/auth/register")
        .send({ fullName: "Jorge2", email: "jorge@test.com", password: "Password1!" });

      expect(res.status).toBe(409);
    });

    it("should return 400 for invalid data", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ fullName: "", email: "invalid", password: "short" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      await request(app)
        .post("/api/auth/register")
        .send({ fullName: "Jorge", email: "jorge@test.com", password: "Password1!" });
    });

    it("should login with correct credentials", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "jorge@test.com", password: "Password1!" });

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.token).toBeDefined();
    });

    it("should return 401 for wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "jorge@test.com", password: "WrongPass1!" });

      expect(res.status).toBe(401);
    });

    it("should return 401 for non-existent email", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nobody@test.com", password: "Password1!" });

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully", async () => {
      const { body } = await request(app)
        .post("/api/auth/register")
        .send({ fullName: "Jorge", email: "jorge@test.com", password: "Password1!" });

      const res = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${body.token}`);

      expect(res.status).toBe(200);
    });

    it("should return 404 without token (session not found)", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.status).toBe(404);
    });
  });
});

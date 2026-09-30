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

async function getAuthToken() {
  await request(app)
    .post("/api/auth/register")
    .send({ fullName: "Jorge", email: "jorge@test.com", password: "Password1!" });

  const { body } = await request(app)
    .post("/api/auth/login")
    .send({ email: "jorge@test.com", password: "Password1!" });

  return { token: body.token, userId: body.user.id, userEmail: body.user.email };
}

describe("SnailPay Endpoint", () => {
  beforeEach(() => {
    resetStores();
  });

  describe("POST /api/snailpay/process", () => {
    it("should process approved payment", async () => {
      const { token, userId, userEmail } = await getAuthToken();

      const res = await request(app)
        .post("/api/snailpay/process")
        .set("Authorization", `Bearer ${token}`)
        .send({
          cardNumber: "1234123412341234",
          expiryDate: "12/26",
          cvv: "543",
          fullName: "Jorge Perales",
          amount: 100,
          payerId: userId,
          payerEmail: userEmail,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("approved");
    });

    it("should reject payment with wrong card", async () => {
      const { token, userId, userEmail } = await getAuthToken();

      const res = await request(app)
        .post("/api/snailpay/process")
        .set("Authorization", `Bearer ${token}`)
        .send({
          cardNumber: "9999999999999999",
          expiryDate: "12/26",
          cvv: "543",
          fullName: "Jorge Perales",
          amount: 100,
          payerId: userId,
          payerEmail: userEmail,
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("rejected");
    });

    it("should return 500 for system error", async () => {
      const { token, userId, userEmail } = await getAuthToken();

      const res = await request(app)
        .post("/api/snailpay/process")
        .set("Authorization", `Bearer ${token}`)
        .set("X-SnailPay-Simulate", "system_error")
        .send({
          cardNumber: "1234123412341234",
          expiryDate: "12/26",
          cvv: "543",
          fullName: "Jorge Perales",
          amount: 100,
          payerId: userId,
          payerEmail: userEmail,
        });

      expect(res.status).toBe(500);
    });

    it("should return 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/snailpay/process")
        .send({
          cardNumber: "1234123412341234",
          expiryDate: "12/26",
          cvv: "543",
          fullName: "Jorge Perales",
          amount: 100,
        });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid data", async () => {
      const { token } = await getAuthToken();

      const res = await request(app)
        .post("/api/snailpay/process")
        .set("Authorization", `Bearer ${token}`)
        .send({
          cardNumber: "123",
          expiryDate: "invalid",
          cvv: "1",
          fullName: "",
          amount: -10,
        });

      expect(res.status).toBe(400);
    });
  });
});

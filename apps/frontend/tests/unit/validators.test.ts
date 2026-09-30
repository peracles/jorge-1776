import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicamos los schemas aqui para testearlos de forma aislada
// (En los componentes estan definidos inline)

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

describe("Zod Validators", () => {
  describe("registerSchema", () => {
    it("should accept valid registration data", () => {
      const result = registerSchema.safeParse({
        fullName: "Jorge Perales",
        email: "jorge@test.com",
        password: "Password1!",
        confirmPassword: "Password1!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject fullName less than 2 characters", () => {
      const result = registerSchema.safeParse({
        fullName: "J",
        email: "jorge@test.com",
        password: "Password1!",
        confirmPassword: "Password1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid email format", () => {
      const result = registerSchema.safeParse({
        fullName: "Jorge Perales",
        email: "invalid-email",
        password: "Password1!",
        confirmPassword: "Password1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password less than 8 characters", () => {
      const result = registerSchema.safeParse({
        fullName: "Jorge Perales",
        email: "jorge@test.com",
        password: "Short1!",
        confirmPassword: "Short1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without uppercase letter", () => {
      const result = registerSchema.safeParse({
        fullName: "Jorge Perales",
        email: "jorge@test.com",
        password: "password1!",
        confirmPassword: "password1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without number", () => {
      const result = registerSchema.safeParse({
        fullName: "Jorge Perales",
        email: "jorge@test.com",
        password: "Password!",
        confirmPassword: "Password!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject password without special character", () => {
      const result = registerSchema.safeParse({
        fullName: "Jorge Perales",
        email: "jorge@test.com",
        password: "Password1",
        confirmPassword: "Password1",
      });
      expect(result.success).toBe(false);
    });

    it("should reject when passwords do not match", () => {
      const result = registerSchema.safeParse({
        fullName: "Jorge Perales",
        email: "jorge@test.com",
        password: "Password1!",
        confirmPassword: "Different1!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("should accept valid login data", () => {
      const result = loginSchema.safeParse({
        email: "jorge@test.com",
        password: "Password1!",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = loginSchema.safeParse({
        email: "invalid",
        password: "Password1!",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty password", () => {
      const result = loginSchema.safeParse({
        email: "jorge@test.com",
        password: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
